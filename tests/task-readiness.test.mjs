import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
function load(path,require=()=>({})) {const compiled={exports:{}};runInNewContext(ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:compiled,exports:compiled.exports,require,URL});return compiled.exports;}
const contract=load('packages/shared-types/src/task-status-contract.ts');
const edit=load('packages/shared-types/src/task-edit-contract.ts');
function routeHarness({row={id:'t'},enabled=false}={}) {
 const filters=[];let payload,fromCalls=0,rpcArgs;
 const database={from:()=>{fromCalls++;const q={select:()=>q,delete:()=>q,order:async()=>({data:[],error:null}),eq:(key,value)=>{filters.push([key,value]);return q;},update:value=>{payload=value;return q;},single:async()=>({data:{status:'To Do'},error:null}),maybeSingle:async()=>({data:row,error:null})};return q;},rpc:async(name,args)=>{rpcArgs={name,args};return enabled?{data:row,error:null}:{data:null,error:{code:'PGRST202'}};}};
 const route=load('app/api/workspace/[resource]/route.ts',name=>name==='next/server'?{NextResponse:{json:(body,options={})=>({body,status:options.status??200})}}:
 name.endsWith('authorized-workspace')?{isAuthorizedResource:()=>true,authenticatedDatabase:async()=>({database,user:{id:'u'},organizationId:'org'}),trustedIdentityPayload:body=>{const {id:ignored,...fields}=body;void ignored;return {...fields,user_id:'u',organization_id:'org'};}}:
 name.endsWith('organizations/context')?{requestedOrganization:()=> 'org'}:name.endsWith('task-edit-contract')?edit:{...contract,TASK_WORKFLOW_WRITES_ENABLED:enabled});
 return {inboxRead:()=>route.GET({headers:{get:()=>"Bearer synthetic"}},{params:Promise.resolve({resource:"notifications"})}),inboxEdit:()=>route.PATCH({headers:{get:()=>"Bearer synthetic"},json:async()=>({id:"n",is_read:true})},{params:Promise.resolve({resource:"notifications"})}),inboxDelete:()=>route.DELETE({url:"http://127.0.0.1/api/workspace/notifications?id=n",headers:{get:()=>"Bearer synthetic"}},{params:Promise.resolve({resource:"notifications"})}),run:body=>route.PATCH({headers:{get:()=> 'Bearer synthetic'},json:async()=>body},{params:Promise.resolve({resource:'tasks'})}),filters,payload:()=>payload,fromCalls:()=>fromCalls,rpcArgs:()=>rpcArgs};
}
test('old Web edit clients receive an explicit update requirement before database access',async()=>{
 const h=routeHarness();const result=await h.run({id:'t',title:'legacy'});assert.equal(result.status,409);assert.equal(result.body.code,'TASK_UPDATE_REQUIRED');assert.equal(h.fromCalls(),0);
});
test('Web task edit never falls back when the atomic RPC is missing',async()=>{
 const h=routeHarness();const result=await h.run({id:'t',title:'new',expectedUpdatedAt:'opaque'});
 assert.equal(result.status,409);assert.equal(result.body.code,'TASK_UPDATE_REQUIRED');assert.equal(h.payload(),undefined);
});
test('Web stale edit is a conflict, while activated edits use the atomic RPC',async()=>{
 const stale=routeHarness({row:null});assert.equal((await stale.run({id:'t',title:'new',expectedUpdatedAt:'old'})).body.code,'TASK_UPDATE_REQUIRED');
 const activated=routeHarness({enabled:true});const confirmed=await activated.run({id:'t',title:'new',expectedUpdatedAt:'old'});
 assert.equal(confirmed.body.auditRecorded,true);
 assert.equal(activated.rpcArgs().name,'edit_task_fields');assert.equal(activated.rpcArgs().args.p_expected_updated_at,'old');
 assert.deepEqual(Object.keys(activated.rpcArgs().args.p_changes).filter(key=>activated.rpcArgs().args.p_changes[key]!==undefined),['title']);
});
test('notification drain remains gated, bounded and independent of task success',async()=>{
 let calls=0;const db={rpc:async(name,args)=>{calls++;assert.equal(name,'deliver_task_transition_notifications');assert.equal(args.p_limit,10);throw new Error('offline');}};
 await load('packages/shared-types/src/task-notifications.ts',()=>contract).deliverTaskNotifications(db,'org');assert.equal(calls,0);
 const active=load('packages/shared-types/src/task-notifications.ts',()=>({...contract,TASK_WORKFLOW_WRITES_ENABLED:true}));
 await active.deliverTaskNotifications(db,'org');assert.equal(calls,1);
 assert.equal(active.taskNotificationTarget({module:'tasks',entity_id:'foreign'},['own']),null);
 assert.equal(active.taskNotificationTarget({module:'tasks',entity_id:'own'},['own']),'own');
});
test('transition reasons normalize consistently outside either UI',()=>{
 const shared=load('packages/shared-types/src/task-transition-client.ts',()=>contract);
 const input={taskId:'t',organizationId:'o',expectedStatus:'Waiting',targetStatus:'In Progress',expectedUpdatedAt:'opaque'};
 assert.equal(shared.taskTransitionRpcArgs({...input,reason:'  سبب  '}).p_reason,'سبب');
 assert.equal(shared.taskTransitionRpcArgs({...input,reason:'  '}).p_reason,null);
});

test('generic inbox API scopes every read/update/delete to the authenticated recipient',async()=>{
 for(const method of ['inboxRead','inboxEdit','inboxDelete']){
  const h=routeHarness();await h[method]();
  assert.ok(h.filters.some(([k,v])=>k==='user_id'&&v==='u'),method);
  assert.ok(h.filters.some(([k,v])=>k==='organization_id'&&v==='org'),method);
 }
});
