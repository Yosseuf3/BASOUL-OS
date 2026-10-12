import {spawnSync,spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {randomUUID,createHmac} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const db='basoul_pr173_auth_phase2_clean', network='basoul-pr173-auth-network';
const authContainer=JSON.parse(spawnSync('docker',['inspect','basoul-pr173-auth-clean'],{encoding:'utf8'}).stdout)[0];
assert.equal(authContainer.Config.Image,'supabase/gotrue:v2.196.0');
assert.equal(authContainer.HostConfig.NetworkMode,network);
const authEnv=authContainer.Config.Env;
const secret=authEnv.find(x=>x.startsWith('GOTRUE_JWT_SECRET=')).split('=')[1];
const authUri=new URL(authEnv.find(x=>x.startsWith('GOTRUE_DB_DATABASE_URL=')).slice('GOTRUE_DB_DATABASE_URL='.length));
assert.equal(authUri.hostname,'basoul-pr173-auth-db'); assert.equal(authUri.pathname,'/'+db);
const pass=authUri.password; // Only the credentials generated for these synthetic fixtures.
function docker(args,input){const r=spawnSync('docker',args,{input,encoding:'utf8'});if(r.status!==0)throw new Error('Local Docker operation failed: '+args.slice(0,3).join(' '));return r.stdout.trim();}
function sql(s){return docker(['exec','-i','basoul-pr173-auth-db','psql','-X','-U','supabase_admin','-d',db,'-v','ON_ERROR_STOP=1','-At'],s);}
const read=p=>readFileSync(root+p,'utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function request(port,path,body,token,method=body?'POST':'GET'){
 const url=port===55431?'http://basoul-pr173-auth-clean:9999':'http://basoul-pr173-postgrest:3000';
 return new Promise((resolve,reject)=>{
 const code="let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',async()=>{try{const q=JSON.parse(s);const r=await fetch(q.url,{...q.options,signal:AbortSignal.timeout(10000)});let data;try{data=await r.json();}catch{data=null;}process.stdout.write(JSON.stringify({status:r.status,data}),()=>process.exit(0));}catch(e){process.stderr.write(e.name,()=>process.exit(1));}})";
 const child=spawn('docker',['exec','-i','basoul-pr173-http-client','node','-e',code]);let output='',kind='';
 child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>kind+=x);child.on('error',reject);child.on('close',c=>{if(c)reject(new Error('Isolated HTTP failed '+port+' '+path+' '+kind.slice(0,50)));else resolve(JSON.parse(output));});
 child.stdin.end(JSON.stringify({url:url+path,options:{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}}));
 });
}
assert.equal(docker(['network','inspect',network,'--format','{{.Internal}}']),'true');
const isolatedDb=JSON.parse(docker(['inspect','basoul-pr173-auth-db']))[0];
assert.equal(isolatedDb.HostConfig.NetworkMode,network); assert.deepEqual(isolatedDb.Mounts,[]);
assert.ok(isolatedDb.HostConfig.Tmpfs['/var/lib/postgresql/data']);
const restContainer=JSON.parse(docker(['inspect','basoul-pr173-postgrest']))[0];
assert.equal(restContainer.HostConfig.NetworkMode,network); assert.equal(restContainer.Config.Image,'postgrest/postgrest:v14.17');
const restUri=new URL(restContainer.Config.Env.find(x=>x.startsWith('PGRST_DB_URI=')).slice('PGRST_DB_URI='.length));
assert.equal(restUri.hostname,'basoul-pr173-auth-db'); assert.equal(restUri.pathname,'/'+db);
assert.equal(JSON.parse(docker(['inspect','basoul-pr173-http-client']))[0].HostConfig.NetworkMode,network);
assert.equal(sql("SELECT count(*) FROM pg_roles WHERE rolname IN ('authenticated','authenticator') AND (rolsuper OR rolbypassrls);"),'0');
for(let i=0;i<30;i++){const r=spawnSync('docker',['exec','basoul-pr173-auth-db','pg_isready','-h','127.0.0.1','-U','postgres']);if(r.status===0)break;await pause(1000);}
// Resume the verified, dedicated synthetic Auth service without recreating users.
let ready=false;
for(let i=0;i<30;i++){try{if((await request(55431,'/health')).status===200){ready=true;break;}}catch{}await pause(1000);}
assert.ok(ready,'Auth health not ready'); console.log('Local Auth health PASS');
const users=[];
for(let i=1;i<=4;i++){
 const email=`actor${i}@synthetic.invalid`;
 const login=await request(55431,'/token?grant_type=password',{email,password:pass});assert.equal(login.status,200,'Synthetic password login failed');
 users.push({id:login.data.user.id,token:login.data.access_token});
 const identity=await request(55431,'/user',undefined,login.data.access_token);assert.equal(identity.data.id,login.data.user.id);
 assert.equal(identity.data.email,email); assert.match(identity.data.id,/^[0-9a-f-]{36}$/);
}
assert.equal((await request(55431,'/user',undefined,'invalid')).status,403);
assert.equal(sql("SELECT to_regclass('public.tasks') IS NOT NULL;"),'t','Provision the documented synthetic stack first');
// Update only the reviewed function candidates in this isolated database.
sql(read('docs/database/proposed-task-transition-enforcement.sql').split('REVOKE ALL ON FUNCTION public.transition_task_status')[0]);
ready=false;for(let i=0;i<30;i++){try{if((await request(55432,'/')).status===200){ready=true;break;}}catch{}await pause(1000);}assert.ok(ready,'PostgREST health not ready');
const task=randomUUID(),org='10000000-0000-0000-0000-000000000001';
const membership=await request(55432,`/organization_memberships?organization_id=eq.${org}&user_id=eq.${users[0].id}`,undefined,users[0].token);
assert.equal(membership.status,200); assert.equal(membership.data[0]?.role,'owner');
sql(`INSERT INTO public.tasks(id,user_id,organization_id,project_id,title,status,progress,updated_at)
VALUES('${task}','${users[0].id}','${org}','40000000-0000-0000-0000-000000000001','Synthetic HTTP regression','Waiting',15,'2026-10-11T00:00:00Z');`);
function load(path,require=()=>({})) {const m={exports:{}};runInNewContext(ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require});return m.exports;}
const contract=load('packages/shared-types/src/task-status-contract.ts');
const client=load('packages/shared-types/src/task-transition-client.ts',()=>contract);
const args=client.taskTransitionRpcArgs({taskId:task,organizationId:org,expectedStatus:'Waiting',expectedUpdatedAt:'2026-10-11T00:00:00Z',targetStatus:'In Progress',reason:'synthetic dependency resolved'});
const rpc=(payload,actor=0)=>request(55432,'/rpc/transition_task_status',payload,users[actor].token);
for(const actor of [1,2,3]) assert.equal((await rpc(args,actor)).status,403,'Forbidden actor allowed');
assert.equal((await request(55432,'/tasks',undefined,'invalid')).status,401);
const jwt=(claims)=>{const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const p=Buffer.from(JSON.stringify(claims)).toString('base64url');return h+'.'+p+'.'+createHmac('sha256',secret).update(h+'.'+p).digest('base64url');};
const expired=jwt({sub:users[0].id,role:'authenticated',exp:1});
assert.equal((await request(55432,'/tasks',undefined,expired)).status,401);
assert.equal((await rpc({...args,p_target_status:'Unknown'})).status,400);
const direct=await request(55432,`/tasks?id=eq.${task}`,{status:'In Progress',progress:15},users[0].token,'PATCH');
assert.equal(direct.status,409); assert.equal(direct.data.code,'PT409');
assert.equal(client.taskTransitionError(direct.data).code,'TASK_TRANSITION_CONFLICT');
const [a,b]=await Promise.all([rpc(args),rpc(args)]);
assert.deepEqual([a.status,b.status].sort(),[200,409]);
assert.equal(sql(`SELECT count(*) FROM activity_events WHERE entity_id='${task}';`),'1');
assert.equal(sql(`SELECT progress FROM tasks WHERE id='${task}';`),'15');
const view=await request(55432,`/tasks?id=eq.${task}`,undefined,users[0].token);assert.equal(view.status,200);
assert.equal((await request(55432,`/tasks?id=eq.${task}`,undefined,users[2].token)).data.length,0);
const current=view.data[0];
sql('REVOKE INSERT ON activity_events FROM authenticated;');
try {
const fail=await rpc({...args,p_expected_status:current.status,p_expected_updated_at:current.updated_at,p_target_status:'Review'});
assert.equal(fail.status,403);assert.equal(sql(`SELECT status FROM tasks WHERE id='${task}';`),'In Progress');
assert.equal(sql(`SELECT count(*) FROM activity_events WHERE entity_id='${task}';`),'1');
} finally { sql('GRANT INSERT ON activity_events TO authenticated;'); }
const project=await request(55432,'/projects',undefined,users[0].token);assert.equal(project.status,200);assert.equal(project.data.length,1);
console.log('PASS actual password Auth identity; invalid/expired JWT; HTTP RLS owner/creator/viewer/tenant negatives; direct legacy rejection; shared client payload and error normalization; RPC concurrent CAS; audit atomicity; unrelated project reads');
console.log('Synthetic DB:',db,'Task fixture:',task,'Internal-network HTTP only; no secrets emitted.');
