// Optional actual-browser regression against the isolated fixture stack only.
import {spawn,spawnSync} from 'node:child_process';
import {startTaskFixtureGateway} from './task-fixture-gateway.mjs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createWriteStream,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.BASOUL_PLAYWRIGHT_MODULE || 'playwright');
const {password,gateway}=await startTaskFixtureGateway();
function fixtureSql(sql){const result=spawnSync('docker',['exec','-i','basoul-pr173-auth-db','psql','-X','-U','supabase_admin','-d','basoul_pr173_auth_phase2_clean','-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'});assert.equal(result.status,0,'Synthetic browser SQL assertion failed: '+(result.stderr??'').slice(0,450));return result.stdout.trim();}
const log=createWriteStream(new URL('../.git/basoul-local/browser-next.log',import.meta.url));
const next=spawn(process.execPath,[root+'node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3107'],{cwd:root,env:{...process.env,NEXT_PUBLIC_BASOUL_LOCAL_WORKFLOW:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:35439',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-local-anon-key'},stdio:['ignore','pipe','pipe']});
next.stdout.pipe(log);next.stderr.pipe(log);let browser,page;
try {
 let ready=false;for(let attempt=0;attempt<90;attempt++){try{if((await fetch('http://127.0.0.1:3107/login',{signal:AbortSignal.timeout(2000)})).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,1000));}
 assert.ok(ready,'Local Web server did not become ready');
 browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1365,height:900}});
 // Block external requests so browser tests cannot contact production services.
 await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)?route.continue():route.abort();});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:3107/login');
 await page.locator('input[type=email]').fill('actor1@synthetic.invalid');
 await page.locator('input[type=password]').fill(password);
 await page.locator('button[type=submit]').click();
 await page.waitForURL('http://127.0.0.1:3107/',{timeout:90000});
 await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor({timeout:90000});
 await page.locator('.sidebar').getByRole('button',{name:/المهام/}).click();
 await page.getByRole('heading',{name:'محرك المهام',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Existing Waiting',exact:true}).waitFor({timeout:60000});
 await page.getByRole('button',{name:'إضافة',exact:true}).click();
 const title='Synthetic browser created task';
 await page.locator('input[name=title]').fill(title);
 await page.getByRole('button',{name:'حفظ',exact:true}).click();
 await page.getByRole('heading',{name:title,exact:true}).waitFor({timeout:60000});
 await page.getByRole('heading',{name:title,exact:true}).click();
 fixtureSql(`SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM auth.users WHERE email='actor1@synthetic.invalid'),false);
 SET ROLE authenticated;
 SELECT (edit_task_fields(t.id,t.organization_id,t.updated_at,'{"description":"Synthetic concurrent edit"}')).id FROM tasks t WHERE title='Synthetic browser created task';`);
 const conflictResponse=page.waitForResponse(r=>r.url().endsWith('/api/workspace/tasks')&&r.request().method()==='PATCH');
 await page.getByRole('button',{name:'حفظ',exact:true}).click();
 assert.equal((await conflictResponse).status(),409);
 await page.getByText(/Task changed\. Refresh/).waitFor();
 assert.equal(await page.locator('input[name=title]').count(),1,'Stale editor must remain open');
 await page.locator('.modal-head .icon-button').click();
 await page.reload();
 await page.locator('.sidebar').getByRole('button',{name:/المهام/}).click();
 await page.getByRole('heading',{name:title,exact:true}).click({timeout:60000});
 await page.locator('input[name=title]').fill('Synthetic browser CAS edited');
 const editResponse=page.waitForResponse(r=>r.url().endsWith('/api/workspace/tasks')&&r.request().method()==='PATCH');
 await page.getByRole('button',{name:'حفظ',exact:true}).click();
 const edited=await editResponse;assert.equal(edited.status(),200);assert.equal((await edited.json()).data.title,'Synthetic browser CAS edited');
 await page.getByRole('heading',{name:'Synthetic browser CAS edited',exact:true}).waitFor({timeout:60000});
 // Actual activated client confirmation -> Next API -> atomic SQL transition.
 await page.getByRole('heading',{name:'Synthetic browser CAS edited',exact:true}).click();
 await page.locator('select[name=status]').selectOption('In Progress');
 await page.getByRole('button',{name:'حفظ',exact:true}).click();
 await page.getByRole('button',{name:'تأكيد / Confirm',exact:true}).waitFor();
 await page.locator('section[aria-label="تأكيد انتقال المهمة / Confirm task transition"] textarea').fill('Synthetic activated browser reason');
 const transitionResponse=page.waitForResponse(r=>r.url().endsWith('/api/tasks/transition')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'تأكيد / Confirm',exact:true}).click();
 assert.equal((await transitionResponse).status(),200);
 await page.locator('.modal-backdrop').waitFor({state:'detached',timeout:60000});
 assert.equal(fixtureSql("SELECT count(*) FROM notifications n JOIN activity_events e ON e.id=n.activity_event_id WHERE e.metadata->>'_basoul_task_transition'='true';"),'0','No notification for own transition');
 // Explicit historical fixture, not permission to transition somebody else's task.
 fixtureSql(`BEGIN; ALTER TABLE activity_events DISABLE TRIGGER protect_task_transition_audit;
 UPDATE activity_events SET user_id=(SELECT id FROM auth.users WHERE email='actor2@synthetic.invalid'),
 metadata=jsonb_set(metadata,'{actor_id}',to_jsonb((SELECT id::text FROM auth.users WHERE email='actor2@synthetic.invalid')))
 WHERE entity_id IN(SELECT id FROM tasks WHERE title='Synthetic browser CAS edited') AND metadata->>'_basoul_task_transition'='true';
 ALTER TABLE activity_events ENABLE TRIGGER protect_task_transition_audit; COMMIT;`);
 await page.reload();
 await page.locator('.sidebar').getByRole('button',{name:/الإشعارات/}).click();
 await page.locator('.notification-main').filter({hasText:'Synthetic browser CAS edited'}).click({timeout:60000});
 await page.locator('input[name=title]').waitFor();
 assert.equal(await page.locator('input[name=title]').inputValue(),'Synthetic browser CAS edited');
 await page.locator('.modal-head .icon-button').click();
 const card=page.locator('article').filter({has:page.getByRole('heading',{name:'Synthetic browser CAS edited',exact:true})});
 await card.getByText('قيد التنفيذ',{exact:true}).waitFor();
 await card.locator('.card-menu-wrap > button').click();
 await card.getByRole('button',{name:/أرشفة/}).click();
 await page.getByRole('button',{name:'أرشفة / Archive',exact:true}).click();
 await page.getByRole('heading',{name:'Synthetic browser CAS edited',exact:true}).waitFor({state:'detached',timeout:60000});
 await page.screenshot({path:root+'.git/basoul-local/task-browser.png',fullPage:true});
 assert.equal(await page.getByText('TASK_REASON_COPY').count(),0);
 assert.equal(errors.length,0,'Web runtime error');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:root+'.git/basoul-local/task-browser-mobile.png',fullPage:true});
 console.log('PASS activated browser authentication/list/create/real stale CAS editor recovery/edit/reason/committed transition/no self-notification/historical recipient inbox deep link/CAS archive; desktop/mobile viewport; no external network');
} catch(error) {
 if(page){try{await page.screenshot({path:root+'.git/basoul-local/browser-failure.png',fullPage:true});writeFileSync(root+'.git/basoul-local/browser-failure.txt',(await page.locator('body').innerText()).slice(0,12000));}catch{/* preserve original failure */}}
 throw error;
} finally {
 await browser?.close();
 // Stop only this test's Next process tree on Windows, never unrelated servers.
 if(next.pid)spawnSync('taskkill',['/PID',String(next.pid),'/T','/F'],{stdio:'ignore'});
 gateway.closeAllConnections();await new Promise(resolve=>gateway.close(resolve));log.end();
}
