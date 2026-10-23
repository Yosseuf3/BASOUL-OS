import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function load(path, require = () => ({}), globals = {}) {
  const compiled = {exports: {}};
  runInNewContext(ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
  {module:compiled,exports:compiled.exports,require,Error,...globals});
  return compiled.exports;
}
const decision = load('packages/shared-types/src/finding-decision.ts');
const {canAdministerMembership} = load('supabase/functions/organization-admin/authorization.ts');
const creationTransport=load('packages/shared-types/src/task-create-transport.ts',()=>({}),{URL,Headers});
test('administration allows only explicitly active owner/admin membership', () => {
  for (const role of ['owner','admin']) assert.equal(canAdministerMembership({role,status:'active'}),true);
  for (const role of ['viewer','member','unknown','toString','constructor',null,undefined])
    assert.equal(canAdministerMembership({role,status:'active'}),false);
  for (const status of ['invited','suspended',undefined])
    assert.equal(canAdministerMembership({role:'owner',status}),false);
  assert.equal(canAdministerMembership(null),false);
});
function fixture(result={data:{id:'finding'},error:null}) {
  const calls=[];
  const chain=new Proxy({}, {get:(_,method)=> method==='then'
    ? (resolve)=>Promise.resolve(result).then(resolve)
    : (...args)=>{calls.push([method,...args]);return chain;}});
  const client={auth:{getUser:async()=>({data:{user:{id:'actor'}},error:null})},
    from:(table)=>{calls.push(['from',table]);return chain;}};
  const service=load('lib/architecture/review-service.ts',(name)=>
    name.includes('finding-decision') ? decision : name.includes('scoped-client') ? {organizationClient:()=>client} : {});
  return {calls,service};
}
test('finding decisions use source CAS and do not overwrite analysis status',async()=>{
  const f=fixture();
  await f.service.updateFindingDecision({id:'finding',review_id:'review',updated_at:'opaque-version'},'resolved');
  assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='updated_at'&&c[2]==='opaque-version'));
  assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='review_id'&&c[2]==='review'));
  assert.deepEqual(f.calls.filter(c=>c[0]==='from').map(c=>c[1]),['architectural_review_findings']);
  assert.ok(f.calls.some(c=>c[0]==='in'&&c[1]==='status'&&!c[2].includes('converted_to_task')));
});
test('missing source version and forged decision dispatch no writes',async()=>{
  for(const [updated_at,status] of [[undefined,'accepted'],['','resolved'],['version','converted_to_task']]){
    const f=fixture();
    await assert.rejects(f.service.updateFindingDecision({id:'finding',review_id:'review',updated_at},status));
    assert.equal(f.calls.length,0);
  }
});
test('unconfirmed decision produces bilingual recovery feedback',async()=>{
  const f=fixture({data:null,error:null});
  await assert.rejects(f.service.updateFindingDecision({id:'finding',review_id:'review',updated_at:'old'},'accepted'),/Refresh the review/);
});

test('invitation acceptance requires a confirmed count and the same authenticated account',async()=>{
  for(const [response,next,expected] of [[{accepted:1},'actor',1],[{},'actor',null],[{accepted:-1},'actor',null],[{accepted:1},'other',null],[{error:'denied'},'actor',null]]){
    let identities=0;
    const client={auth:{getUser:async()=>({data:{user:{id:++identities===1?'actor':next}},error:null})},
      functions:{invoke:async()=>({data:response,error:null})}};
    const service=load('lib/organizations/administration.ts',name=>name==='@/lib/supabase'?{supabase:client}:{});
    if(expected===null)await assert.rejects(service.acceptPendingInvitations());
    else assert.equal((await service.acceptPendingInvitations()).accepted,expected);
  }
});

test('Edge list handler uses the caller RPC and rejects unknown roles before privileged reads',async()=>{
  for(const role of ['owner','unknown','constructor']){
    let handler,calls=0,clients=0;
    const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:{role,status:'active'},error:null})};
    const user={auth:{getUser:async()=>({data:{user:{id:'actor'}},error:null})},from:()=>chain,
      rpc:async(name)=>{assert.equal(name,'organization_administration_state');calls++;return {data:{invitations:[],members:[]},error:null};}};
    load('supabase/functions/organization-admin/index.ts',name=>name.includes('authorization.ts')?{canAdministerMembership}:name.startsWith('npm:')?{createClient:()=>++clients===1?user:{from:()=>{throw new Error('Privileged read dispatched');}}}:{},
      {Deno:{env:{get:()=> 'synthetic'},serve:value=>{handler=value;}},Request,Response,URL});
    const response=await handler(new Request('http://localhost/organization-admin',{method:'POST',headers:{Authorization:'Bearer synthetic','Content-Type':'application/json'},body:JSON.stringify({action:'list',organizationId:'10000000-0000-4000-8000-000000000001'})}));
    assert.equal(response.status,role==='owner'?200:403);assert.equal(calls,role==='owner'?1:0);
  }
});

test('membership source navigation confirms the active organization and fixed target',async()=>{
  for(const [data,allowed] of [[{organization_id:'A',member_id:'member',view:'administration'},true],[{organization_id:'B',member_id:'member',view:'administration'},false],[{organization_id:'A',view:'administration'},false],[{organization_id:'A',member_id:'member',view:'external'},false]]){
    const service=load('lib/notifications/notification-service.ts',name=>name.includes('active-context')?{requireOrganizationLease:()=>({organizationId:'A'})}:{organizationClient:()=>({rpc:async()=>({data,error:null})})});
    if(allowed)await service.openMembershipNotification('notice');
    else await assert.rejects(service.openMembershipNotification('notice'),/Link unavailable/);
  }
});

test('current Web SDK versions only task inserts without changing Auth/Edge CORS headers',async()=>{
  let options;
  const calls=[];
  load('lib/supabase.ts',name=>name.includes('task-create-transport')?creationTransport:{createClient:(_url,_key,value)=>{options=value;return {};}},{process:{env:{NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:35439',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic'}},fetch:async(input,init)=>{calls.push({input,init});return {};}});
  for(const [path,method,expected] of [['/rest/v1/tasks','POST','atomic-source-v1'],['/rest/v1/tasks','GET',null],['/auth/v1/token','POST',null],['/functions/v1/organization-admin','POST',null],['/storage/v1/object','POST',null]]){
    await options.global.fetch('http://127.0.0.1:35439'+path,{method,headers:{Authorization:'Bearer synthetic'}});
    const headers=new Headers(calls.at(-1).init.headers);
    assert.equal(headers.get('x-basoul-task-create-contract'),expected);assert.equal(headers.get('Authorization'),'Bearer synthetic');
  }
});

test('an unverified existing Auth identity cannot be reported as delivered or attached',async()=>{
  let handler,clients=0,attached=false;
  const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:{role:'owner',status:'active'},error:null})};
  const user={auth:{getUser:async()=>({data:{user:{id:'actor'}},error:null})},from:()=>chain,
    rpc:async name=>{if(name==='attach_organization_invitation')attached=true;return {data:{id:'invitation'},error:null};}};
  const admin={auth:{admin:{listUsers:async()=>({data:{users:[{id:'recipient',email:'member@synthetic.invalid',email_confirmed_at:null}]},error:null})}}};
  load('supabase/functions/organization-admin/index.ts',name=>name.includes('authorization.ts')?{canAdministerMembership}:name.startsWith('npm:')?{createClient:()=>++clients===1?user:admin}:{},
    {Deno:{env:{get:()=> 'synthetic'},serve:value=>{handler=value;}},Request,Response,URL});
  const response=await handler(new Request('http://localhost/organization-admin',{method:'POST',headers:{Authorization:'Bearer synthetic','Content-Type':'application/json'},body:JSON.stringify({action:'invite',organizationId:'10000000-0000-4000-8000-000000000001',email:'member@synthetic.invalid',role:'member'})}));
  assert.equal(response.status,409);assert.equal((await response.json()).code,'INVITATION_DELIVERY_UNCONFIRMED');assert.equal(attached,false);
});

test('native test sessions are isolated without changing remote-project Auth storage',()=>{
  for(const url of ['http://127.0.0.1:35439','https://example.invalid']){
    let options;
    load('mobile/src/config/supabase.ts',name=>name.includes('task-create-transport')?creationTransport:{createClient:(_url,_key,value)=>{options=value;return {};}},{process:{env:{EXPO_PUBLIC_SUPABASE_URL:url,EXPO_PUBLIC_SUPABASE_ANON_KEY:'synthetic',EXPO_PUBLIC_BASOUL_LOCAL_SESSION_RUN:'fixture-run'}}});
    assert.equal(options.auth.storageKey,url.startsWith('http://127.0.0.1:35439')?'basoul-synthetic-fixture-run':undefined);
  }
});

test('Web invitation feedback exposes controlled guidance from non-success Edge responses',async()=>{
  for(const code of ['INVITATION_DELIVERY_UNCONFIRMED','ADMIN_UPDATE_REQUIRED']){
    const client={functions:{invoke:async()=>({data:null,error:{context:new Response(JSON.stringify({code,error:'untrusted backend detail'}),{status:409})}})}};
    const service=load('lib/organizations/administration.ts',()=>({organizationClient:()=>client}),{Response});
    await assert.rejects(service.inviteMember('A','member@synthetic.invalid','member'),cause=>/unconfirmed|server update/.test(cause.message)&&!cause.message.includes('untrusted backend detail'));
  }
});
