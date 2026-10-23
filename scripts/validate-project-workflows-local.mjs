import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {teamHttp} from './validate-team-collaboration-local.mjs';
import {invitationMailHttp} from './validate-invitation-mail-local.mjs';
const A='10000000-0000-0000-0000-000000000001',B='10000000-0000-0000-0000-000000000002',P='40000000-0000-0000-0000-000000000001';
export async function projectHttp({identity,password,sql}) {
 const base='http://127.0.0.1:35439',headers={authorization:'Bearer '+identity.access_token,apikey:'synthetic-local-anon-key','Content-Type':'application/json','x-basoul-task-create-contract':'atomic-source-v1',Prefer:'return=representation'};
 async function rest(path,method='GET',body,token){const r=await fetch(base+'/rest/v1/'+path,{method,headers:{...headers,...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
 const legacyCount=sql('SELECT count(*) FROM tasks;');
 for(const source of ['legacy-note','legacy-finding']){
  const response=await fetch(base+'/rest/v1/tasks',{method:'POST',headers:{authorization:'Bearer '+identity.access_token,apikey:'synthetic-local-anon-key','Content-Type':'application/json'},body:JSON.stringify({organization_id:A,user_id:identity.user.id,project_id:P,title:source,status:'To Do'})});
  assert.equal(response.status,409);assert.match((await response.json()).message,/TASK_UPDATE_REQUIRED/);
 }
 assert.equal(sql('SELECT count(*) FROM tasks;'),legacyCount);
 assert.equal((await rest('tasks?limit=1')).status,200);
 const draftId=crypto.randomUUID(),draft={p_organization_id:A,p_project_id:P,p_note_id:draftId,p_input:{title:'Idempotent note draft',content:null,type:'general',project_file_id:null,assigned_to:null,follow_up_date:null}};
 assert.equal((await rest('rpc/create_project_note','POST',draft)).status,200);assert.equal((await rest('rpc/create_project_note','POST',draft)).body.id,draftId);
 assert.equal(sql(`SELECT count(*) FROM activity_events WHERE metadata->>'project_note_id'='${draftId}';`),'1');
 const note=await rest('project_notes','POST',{organization_id:A,user_id:identity.user.id,project_id:P,type:'review',title:'Atomic synthetic note',status:'open'});assert.equal(note.status,201);const n=note.body[0];
 const args={p_organization_id:A,p_project_id:P,p_source_kind:'note',p_source_id:n.id,p_expected_updated_at:n.updated_at};
 const simultaneous=await Promise.all([rest('rpc/convert_project_source_to_task','POST',args),rest('rpc/convert_project_source_to_task','POST',args)]);
 assert.equal(simultaneous[0].status,200);assert.equal(simultaneous[1].status,200);assert.equal(simultaneous[0].body.id,simultaneous[1].body.id);
 assert.equal(sql(`SELECT count(*) FROM activity_events WHERE entity_id='${simultaneous[0].body.id}' AND metadata ? '_basoul_source_conversion';`),'1');
 assert.ok((await rest('activity_events?entity_id=eq.'+simultaneous[0].body.id,'DELETE')).status>=400);
 assert.ok((await rest('project_notes?id=eq.'+n.id,'PATCH',{task_id:null})).status>=400);
 assert.ok((await rest('project_notes?id=eq.'+n.id,'DELETE')).status>=400);
 const stale=await rest('project_notes','POST',{organization_id:A,user_id:identity.user.id,project_id:P,title:'CAS source',type:'general'});const sn=stale.body[0];
 await rest('project_notes?id=eq.'+sn.id,'PATCH',{title:'Changed CAS source'});
 assert.equal((await rest('rpc/convert_project_source_to_task','POST',{...args,p_source_id:sn.id,p_expected_updated_at:sn.updated_at})).body.code,'PT409');
 assert.equal((await rest('rpc/convert_project_source_to_task','POST',{...args,p_organization_id:B})).status,403);
 // Inject a transaction failure at audit insertion; task and source must roll back.
 const before=sql('SELECT count(*) FROM tasks;');
 sql(`CREATE FUNCTION public.synthetic_conversion_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.metadata ? '_basoul_source_conversion' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER synthetic_conversion_failure BEFORE INSERT ON activity_events FOR EACH ROW EXECUTE FUNCTION public.synthetic_conversion_failure();`);
 const fresh=(await rest('project_notes?id=eq.'+sn.id)).body[0];
 try{assert.ok((await rest('rpc/convert_project_source_to_task','POST',{...args,p_source_id:sn.id,p_expected_updated_at:fresh.updated_at})).status>=400);assert.equal(sql('SELECT count(*) FROM tasks;'),before);assert.equal(sql(`SELECT task_id IS NULL FROM project_notes WHERE id='${sn.id}';`),'t');}
 finally{sql('DROP TRIGGER synthetic_conversion_failure ON activity_events; DROP FUNCTION public.synthetic_conversion_failure();');}
 assert.equal((await rest('rpc/convert_project_source_to_task','POST',{...args,p_source_id:sn.id,p_expected_updated_at:fresh.updated_at})).status,200);
 // Finding conversion uses the same transaction and returns the original task on retry.
 const drawingCreated=await rest('architectural_drawings','POST',{organization_id:A,user_id:identity.user.id,project_id:P,name:'Synthetic conversion drawing',format:'pdf',storage_path:identity.user.id+'/'+P+'/synthetic.pdf',file_size:12,mime_type:'application/pdf'});assert.equal(drawingCreated.status,201);
 assert.equal(sql(`SELECT count(*) FROM drawing_assets WHERE id='${drawingCreated.body[0].id}';`),'1');
 assert.ok((await rest('architectural_drawings?id=eq.'+drawingCreated.body[0].id,'PATCH',{storage_path:'unsafe-moved.pdf'})).status>=400);
 assert.equal((await rest('architectural_findings?id=eq.70000000-0000-4000-8000-000000000003')).body[0].task_id,'20000000-0000-0000-0000-000000000001');
 assert.equal((await rest('architectural_findings?id=eq.70000000-0000-4000-8000-000000000003','PATCH',{task_id:null})).status,403);
 // The historical manifest has both drawing graphs. Supply an explicit valid
 // dual-record fixture; do not rewrite historical FKs or claim analyzer coverage.
 const reviewCreated=await rest('architectural_reviews','POST',{organization_id:A,user_id:identity.user.id,project_id:P,drawing_id:drawingCreated.body[0].id,status:'ready',plan_health:80,engine_version:'synthetic',disclaimer:'Synthetic fixture'});assert.equal(reviewCreated.status,201,JSON.stringify(reviewCreated.body));
 const drawing=drawingCreated.body[0];assert.ok(drawing);
 const review=reviewCreated.body[0];assert.ok(review);
 const finding=await rest('architectural_review_findings','POST',{organization_id:A,user_id:identity.user.id,review_id:review.id,drawing_id:drawing.id,code:'SYNTHETIC',title:'Atomic finding',description:'Synthetic',recommendation:'Test',category:'privacy',severity:'warning',confidence_score:90,status:'accepted'});assert.equal(finding.status,201);
 let f=finding.body[0]; const decided=await rest('architectural_review_findings?id=eq.'+f.id+'&review_id=eq.'+review.id+'&updated_at=eq.'+encodeURIComponent(f.updated_at),'PATCH',{status:'resolved'}); assert.equal(decided.status,200); assert.equal(decided.body.length,1); assert.equal((await rest('architectural_review_findings?id=eq.'+f.id+'&updated_at=eq.'+encodeURIComponent(f.updated_at),'PATCH',{status:'accepted'})).body.length,0); assert.equal((await rest('architectural_reviews?id=eq.'+review.id)).body[0].status,'ready'); f=(await rest('architectural_review_findings?id=eq.'+f.id,'PATCH',{status:'accepted'})).body[0]; const fa={...args,p_source_kind:'finding',p_source_id:f.id,p_expected_updated_at:f.updated_at};const converted=await rest('rpc/convert_project_source_to_task','POST',fa);assert.equal(converted.status,200);assert.equal((await rest('rpc/convert_project_source_to_task','POST',fa)).body.id,converted.body.id);
 const fileId=crypto.randomUUID(),path=identity.user.id+'/'+P+'/'+fileId+'-synthetic.bin',bytes=Buffer.from([0,255,12,67,0,128,21]);
 const descriptor={id:fileId,organization_id:A,user_id:identity.user.id,project_id:P,name:'synthetic.bin',storage_path:path,file_size:bytes.length,mime_type:'application/octet-stream',category:'other',content_sha256:createHash('sha256').update(bytes).digest('hex')};
 const metadata=await rest('project_files','POST',descriptor);assert.equal(metadata.status,201);
 assert.equal((await rest('project_files','POST',{...descriptor,id:crypto.randomUUID(),storage_path:path+'-duplicate'})).status,409);
 async function storage(endpoint,method='GET',body,auth=identity.access_token,type='application/json'){return fetch(base+'/storage/v1/'+endpoint,{method,headers:{authorization:'Bearer '+auth,apikey:'synthetic-local-anon-key','Content-Type':type},...(body?{body}: {})});}
 const missing=await storage('object/authenticated/project-files/'+path);assert.ok(!missing.ok);
 assert.ok(!(await storage('object/project-files/'+identity.user.id+'/'+P+'/unregistered.bin','POST',bytes,identity.access_token,'application/octet-stream')).ok);
 const upload=await storage('object/project-files/'+path,'POST',bytes,identity.access_token,'application/octet-stream');assert.equal(upload.status,200);
 assert.ok(!(await storage('object/project-files/'+path,'POST',bytes,identity.access_token,'application/octet-stream')).ok);
 const downloaded=await storage('object/authenticated/project-files/'+path);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),bytes);
 const signed=await storage('object/sign/project-files/'+path,'POST',JSON.stringify({expiresIn:60}));assert.equal(signed.status,200);const signedBody=await signed.json();assert.equal((await fetch(base+'/storage/v1'+signedBody.signedURL)).status,200);
 const other=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json',apikey:'synthetic-local-anon-key'},body:JSON.stringify({email:'actor3@synthetic.invalid',password})});const otherIdentity=await other.json();
 assert.ok(!(await storage('object/authenticated/project-files/'+path,'GET',null,otherIdentity.access_token)).ok);
 const forbidden=await storage('object/project-files/'+identity.user.id+'/40000000-0000-0000-0000-000000000002/forbidden.bin','POST',bytes,identity.access_token,'application/octet-stream');assert.ok(!forbidden.ok);
 const invalidReference=await rest('project_notes','POST',{organization_id:B,user_id:identity.user.id,project_id:'40000000-0000-0000-0000-000000000002',project_file_id:fileId,title:'Foreign file',type:'general'});assert.ok(invalidReference.status>=400);
 const secondProject=await rest('projects','POST',{organization_id:A,user_id:identity.user.id,name:'Synthetic reference-only project'});assert.equal(secondProject.status,201);
 assert.ok((await rest('project_notes','POST',{organization_id:A,user_id:identity.user.id,project_id:secondProject.body[0].id,project_file_id:fileId,title:'Wrong project file',type:'general'})).status>=400);
 // Remove only the synthetic empty test project so the existing two-org list assertions remain exact.
 assert.equal((await rest('projects?id=eq.'+secondProject.body[0].id,'DELETE')).status,200);
 sql(`BEGIN;
 INSERT INTO projects(id,user_id,organization_id,name) VALUES('40000000-0000-0000-0000-000000000099','${identity.user.id}','${A}','Synthetic hidden history');
 INSERT INTO drawing_assets(user_id,project_id,name,format,storage_path) SELECT id,'40000000-0000-0000-0000-000000000099','Hidden legacy drawing','pdf','synthetic-hidden.pdf' FROM auth.users WHERE email='actor2@synthetic.invalid';
 SET LOCAL ROLE authenticated;
 SELECT set_config('request.jwt.claim.sub','${identity.user.id}',true);
 DO $$ BEGIN BEGIN DELETE FROM projects WHERE id='40000000-0000-0000-0000-000000000099'; RAISE EXCEPTION 'Expected hidden history retention'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END $$;
 ROLLBACK;`);
 const retained=await fetch('http://127.0.0.1:3107/api/workspace/projects?id='+P,{method:'DELETE',headers:{authorization:'Bearer '+identity.access_token,'x-yosseuf-organization':A}});assert.equal(retained.status,409);
 console.log('PASS project HTTP: concurrent/idempotent note + finding conversion, source CAS, tenant/role negatives, immutable audit/link, injected rollback and recovery, project history retention');
 console.log('PASS real Storage: binary upload/download/sign, duplicate retry without overwrite, missing object failure, foreign actor/organization denial and file reference integrity');
 await teamHttp({identity,password,sql});
 await invitationMailHttp(identity);
}
export async function projectBrowser(page,{sql,identity}){
 await page.goto('http://127.0.0.1:3107/');await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor({timeout:90000});
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(A);await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor();
 await page.locator('.sidebar').getByRole('button',{name:/المشاريع/}).click();await page.getByRole('heading',{name:'Synthetic project A',exact:true}).click();
 await page.locator('.project-workspace-head').getByRole('button',{name:'مهمة جديدة',exact:false}).click();
 const form=page.locator('.modal form');assert.equal(await form.locator('select[name=project_id]').inputValue(),P);
 await form.locator('input[name=title]').fill('Browser project linked task');await form.locator('button[type=submit],button.primary').last().click();
 await page.locator('.modal').waitFor({state:'hidden'});await page.locator('.project-workspace-tabs').getByRole('button',{name:/مهام/}).click();await page.getByRole('button',{name:'Browser project linked task',exact:true}).click();
 await page.locator('.modal').waitFor();await page.locator('.modal .icon-button').click();assert.ok(await page.locator('.project-workspace').isVisible());
 await page.locator('.project-workspace-tabs').getByRole('button',{name:/ملفات/}).click();
 let failUpload=true;await page.route('**/storage/v1/object/project-files/**',route=>{if(failUpload&&route.request().method()==='POST'){failUpload=false;return route.abort();}return route.continue();});
 const browserFile={name:'browser-synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('synthetic browser file')};
 await page.locator('.project-file-upload input').setInputFiles(browserFile);await page.getByText(/Recovery reference retained/).waitFor({timeout:30000});
 await page.locator('.project-file-upload input').setInputFiles(browserFile);await page.getByText('browser-synthetic.txt',{exact:true}).waitFor({timeout:30000});
 await page.locator('.project-file-upload input').setInputFiles(browserFile);await page.getByText('browser-synthetic.txt',{exact:true}).waitFor();assert.equal(await page.getByText('browser-synthetic.txt',{exact:true}).count(),1);
 await page.unroute('**/storage/v1/object/project-files/**');
 await page.locator('.project-files-list article').filter({has:page.getByText('browser-synthetic.txt',{exact:true})}).getByRole('button',{name:'تنزيل',exact:true}).click();
 const link=page.getByRole('link',{name:'فتح التنزيل الآمن / Open secure download',exact:true});await link.waitFor();
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:30000}),link.click()]);assert.equal(readFileSync(await download.path(),'utf8'),'synthetic browser file');assert.ok(await page.locator('.project-workspace').isVisible());
 await page.locator('.project-workspace-tabs').getByRole('button',{name:/ملاحظات/}).click();await page.getByRole('button',{name:'إضافة سجل',exact:true}).click();
 await page.locator('.project-note-form input[name=title]').fill('Browser project note');await page.locator('.project-note-form button.primary').click();await page.getByRole('heading',{name:'Browser project note',exact:true}).waitFor();
 await page.locator('.project-note-list article').filter({has:page.getByRole('heading',{name:'Browser project note',exact:true})}).getByRole('button',{name:'تحويل إلى مهمة',exact:true}).click();await page.locator('.modal').waitFor({timeout:30000});await page.locator('.modal .icon-button').click();assert.ok(await page.locator('.project-workspace').isVisible());
 console.log('PASS actual project browser: project-prefilled task create/open/back, real file upload, note create/atomic conversion/open/back');
 const notificationId=sql(`SELECT id FROM notifications WHERE user_id='${identity.user.id}' AND organization_id='${A}' AND source_kind='membership' ORDER BY created_at LIMIT 1;`);
 assert.match(notificationId,/^[0-9a-f-]{36}$/);
 await page.goto('http://127.0.0.1:3107/?membershipNotificationId='+notificationId);
 await page.getByRole('heading',{name:'إدارة المؤسسة',exact:true}).waitFor({timeout:30000});
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(B);
 await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor();
 await page.goto('http://127.0.0.1:3107/?membershipNotificationId='+notificationId);
 await page.getByText('الرابط غير متاح أو سُحبت الصلاحية. / Link unavailable or access revoked.',{exact:true}).waitFor({timeout:30000});
 assert.equal(await page.getByRole('heading',{name:'إدارة المؤسسة',exact:true}).count(),0);
 await page.getByRole('combobox',{name:'المؤسسة / Organization',exact:true}).selectOption(A);
 await page.getByRole('heading',{name:'لوحة القيادة',exact:true}).waitFor();
 try{
  sql(`UPDATE organization_memberships SET role='viewer' WHERE organization_id='${A}' AND user_id='${identity.user.id}';`);
  await page.goto('http://127.0.0.1:3107/?membershipNotificationId='+notificationId);
  await page.getByText('الرابط غير متاح أو سُحبت الصلاحية. / Link unavailable or access revoked.',{exact:true}).waitFor({timeout:30000});
  assert.equal(await page.getByRole('heading',{name:'إدارة المؤسسة',exact:true}).count(),0);
 }finally{
  sql(`UPDATE organization_memberships SET role='owner' WHERE organization_id='${A}' AND user_id='${identity.user.id}';`);
 }
 await page.goto('http://127.0.0.1:3107/?membershipNotificationId='+notificationId);
 await page.getByRole('heading',{name:'إدارة المؤسسة',exact:true}).waitFor({timeout:30000});
 console.log('PASS actual notification browser: authorized membership deep link, wrong-organization viewer denial, revoked admin access and recovery');
}
