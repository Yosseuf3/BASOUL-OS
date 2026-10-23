// Called only by the fixed isolated Auth/PostgREST wrapper with --organization.
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createWriteStream,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {startTaskFixtureGateway} from './task-fixture-gateway.mjs';
import {projectHttp,projectBrowser} from './validate-project-workflows-local.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.BASOUL_PLAYWRIGHT_MODULE||'playwright');
const {root,password,gateway}=await startTaskFixtureGateway();
const A='10000000-0000-0000-0000-000000000001',B='10000000-0000-0000-0000-000000000002';
const PA='40000000-0000-0000-0000-000000000001',PB='40000000-0000-0000-0000-000000000002';
function sql(input){const result=spawnSync('docker',['exec','-i','basoul-pr173-auth-db','psql','-X','-U','supabase_admin','-d','basoul_pr173_auth_phase2_clean','-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});assert.equal(result.status,0,'Synthetic organization fixture SQL failed');return result.stdout.trim();}
sql(`INSERT INTO organization_memberships(organization_id,user_id,role,status)
 SELECT '${B}',id,'viewer','active' FROM auth.users WHERE email='actor1@synthetic.invalid'
 ON CONFLICT(organization_id,user_id) DO UPDATE SET role='viewer',status='active';
 INSERT INTO organization_profiles(organization_id,legal_name,country_code) VALUES('${A}','Synthetic legal A','EG'),('${B}','Synthetic legal B','EG')
 ON CONFLICT(organization_id) DO UPDATE SET legal_name=excluded.legal_name;
 INSERT INTO clients(id,user_id,organization_id,name) SELECT '30000000-0000-0000-0000-000000000002',id,'${B}','Synthetic client B' FROM auth.users WHERE email='actor3@synthetic.invalid';`);
assert.equal(sql('SELECT count(*) FROM private.task_workflow_activation WHERE enabled;'),'0');
const log=createWriteStream(root+'.git/basoul-local/organization-next.log');
const next=spawn(process.execPath,[root+'node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3107'],{cwd:root,env:{...process.env,NEXT_PUBLIC_BASOUL_LOCAL_WORKFLOW:'0',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:35439',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-local-anon-key'},stdio:['ignore','pipe','pipe']});
next.stdout.pipe(log);next.stderr.pipe(log);let browser,page;
const pause=ms=>new Promise(done=>setTimeout(done,ms));
try {
 let ready=false;for(let i=0;i<90;i++){assert.equal(next.exitCode,null,'Local Next server exited');try{if((await fetch('http://127.0.0.1:3107/login',{signal:AbortSignal.timeout(2000)})).ok){ready=true;break;}}catch{}await pause(1000);}assert.ok(ready,'Local Next not ready');
 const auth=await fetch('http://127.0.0.1:35439/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json',apikey:'synthetic-local-anon-key'},body:JSON.stringify({email:'actor1@synthetic.invalid',password})});
 assert.equal(auth.status,200);const identity=await auth.json();
 if(process.env.BASOUL_PROJECT_FIXTURE==='1')await projectHttp({identity,password,sql});
 const discovery=await fetch('http://127.0.0.1:3107/api/platform/organizations',{headers:{authorization:'Bearer '+identity.access_token}});
 assert.equal(discovery.status,200);const discovered=await discovery.json();assert.deepEqual(discovered.data.map(row=>row.organization_id).sort(),[A,B]);
 assert.equal((await fetch('http://127.0.0.1:3107/api/platform/organizations')).status,401);
 async function api(resource,method='GET',org=A,body){const response=await fetch('http://127.0.0.1:3107/api/workspace/'+resource,{method,headers:{authorization:'Bearer '+identity.access_token,'Content-Type':'application/json','x-basoul-task-create-contract':'atomic-source-v1',...(org?{'x-yosseuf-organization':org}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json()};}
 assert.equal((await api('projects','GET',null)).status,401);
 assert.equal((await api('projects','GET','10000000-0000-0000-0000-000000000099')).status,401);
 const projectsA=await api('projects'),projectsB=await api('projects','GET',B);
 assert.deepEqual(projectsA.body.data.map(row=>row.id),[PA]);assert.deepEqual(projectsB.body.data.map(row=>row.id),[PB]);
 assert.equal((await api('projects','POST',B,{name:'Denied viewer project'})).status,403);
 assert.equal((await api('projects','POST',A,{name:'Denied foreign client',client_id:'30000000-0000-0000-0000-000000000002'})).status,403);
 assert.ok([403,404].includes((await api('projects','PATCH',B,{id:PA,name:'Denied foreign edit'})).status));
 assert.equal((await api('projects?id='+PA,'DELETE',B)).status,404);
 const created=await api('projects','POST',A,{name:'Organization HTTP confirmed'});assert.equal(created.status,201);assert.equal(created.body.data.organization_id,A);
 assert.equal((await api('projects','PATCH',A,{id:created.body.data.id,name:'Organization HTTP updated'})).status,200);
 assert.equal((await api('projects?id='+created.body.data.id,'DELETE',A)).status,200);
 const task=await api('tasks','POST',A,{title:'Organization CAS regression',project_id:PA,status:'To Do',priority:'High',progress:0});assert.equal(task.status,201);
 const edited=await api('tasks','PATCH',A,{id:task.body.data.id,expectedUpdatedAt:task.body.data.updated_at,title:'Organization CAS confirmed'});assert.equal(edited.status,200);
 assert.equal((await api('tasks','PATCH',A,{id:task.body.data.id,expectedUpdatedAt:task.body.data.updated_at,title:'Stale write'})).status,409);
 assert.equal((await api('tasks?id='+task.body.data.id,'DELETE',A)).status,409);
 const archived=await api('tasks','PATCH',A,{id:task.body.data.id,expectedUpdatedAt:edited.body.data.updated_at,archived:true});assert.equal(archived.status,200);assert.equal(archived.body.data.archived,true);
 assert.equal(sql(`SELECT count(*) FROM activity_events WHERE entity_id='${task.body.data.id}' AND metadata->>'new_archived'='true';`),'1');
 console.log('PASS live Next/Auth/PostgREST explicit organization, two-org reads, viewer/foreign references/unauthorized negatives and scoped project create/edit/delete; workflow remains off');
 browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1365,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort();});
 await page.goto('http://127.0.0.1:3107/login');await page.locator('input[type=email]').fill('actor1@synthetic.invalid');await page.locator('input[type=password]').fill(password);await page.locator('button[type=submit]').click();
 await page.waitForURL('http://127.0.0.1:3107/');await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor({timeout:90000});
 await page.locator('.sidebar').getByRole('button',{name:/المشاريع/}).click();
 await page.getByRole('button',{name:'إضافة',exact:true}).click();await page.getByRole('heading',{name:'إنشاء مشروع جديد',exact:true}).waitFor();
 // Switching via the persistent shell must discard the open A wizard.
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(B);
 await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor({timeout:90000});assert.equal(await page.locator('.modal').count(),0);
 await page.locator('.sidebar').getByRole('button',{name:/المشاريع/}).click();await page.getByRole('heading',{name:'Synthetic project B',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Synthetic project A',exact:true}).count(),0);
 // A delayed B collection response cannot overwrite a later A selection.
 let intercepted,release;const held=new Promise(done=>{release=done;});const seen=new Promise(done=>{intercepted=done;});
 await page.route('**/rest/v1/projects?**',async route=>{const url=new URL(route.request().url());if(url.searchParams.get('organization_id')==='eq.'+B){intercepted();await held;}await route.continue().catch(()=>undefined);});
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(A);await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor();
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(B);await seen;
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(A);release();
 await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor({timeout:90000});await page.locator('.sidebar').getByRole('button',{name:/المشاريع/}).click();await page.getByRole('heading',{name:'Synthetic project A',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Synthetic project B',exact:true}).count(),0);
 await page.unroute('**/rest/v1/projects?**');
 // Dedicated routes must retain B, rather than falling back to first membership A.
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(B);await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor();
 const [architectureResponse]=await Promise.all([page.waitForResponse(response=>response.url().includes('/api/workspace/projects')&&response.status()===200,{timeout:120000}),page.goto('http://127.0.0.1:3107/architecture',{timeout:120000})]);
 const architecture=await architectureResponse.json();assert.deepEqual(architecture.data.map(row=>row.id),[PB]);
 await page.goto('http://127.0.0.1:3107/settings/organization');await page.getByText('غير مخول', {exact:false}).waitFor({timeout:20000}).catch(async()=>{await page.getByText('مالك',{exact:false}).first().waitFor();});
 assert.equal(await page.locator('input[value="Synthetic legal A"]').count(),0);
 assert.equal(errors.length,0,'Browser runtime error');assert.equal(sql('SELECT count(*) FROM private.task_workflow_activation WHERE enabled;'),'0');
 console.log('PASS actual browser: A wizard invalidation, owner A/viewer B context, delayed B response suppression after A switch, architecture/header persistence and owner-only settings; no workflow activation');
 await page.screenshot({path:root+'.git/basoul-local/organization-browser.png',fullPage:true});
 if(process.env.BASOUL_PROJECT_FIXTURE==='1')await projectBrowser(page,{sql,identity});
}catch(error){if(page){try{writeFileSync(root+'.git/basoul-local/organization-browser-failure.txt',(await page.locator('body').innerText()).slice(0,16000));await page.screenshot({path:root+'.git/basoul-local/organization-browser-failure.png',fullPage:true});}catch{}}throw error;}
finally{await browser?.close();if(next.pid)spawnSync('taskkill',['/PID',String(next.pid),'/T','/F'],{stdio:'ignore'});gateway.closeAllConnections();await new Promise(done=>gateway.close(done));log.end();}
