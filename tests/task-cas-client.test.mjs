import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(p,require=()=>({})) {const m={exports:{}};runInNewContext(ts.transpileModule(read(p),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require});return m.exports;}
const contract=load('packages/shared-types/src/task-status-contract.ts');
const client=load('packages/shared-types/src/task-transition-client.ts',()=>contract);
const base={taskId:'task',organizationId:'org',expectedStatus:'In Progress',expectedUpdatedAt:'2026-10-11T14:00:00.123456+00:00',targetStatus:'Waiting'};
test('CAS payload retains exact microseconds and never sends fabricated progress or identity',()=>{
 const args=client.taskTransitionRpcArgs(base);assert.equal(args.p_expected_updated_at,base.expectedUpdatedAt);
 assert.equal(args.p_expected_status,'In Progress');assert.equal(args.p_target_status,'Waiting');
 for(const key of ['progress','user_id','actor_id'])assert.ok(!(key in args));
});
test('CAS client accepts exactly the six graph edges and rejects unknown/terminal writes',()=>{
 let allowed=0;for(const from of contract.TASK_STATUSES)for(const to of contract.TASK_STATUSES){
 if(contract.canTransitionTask(from,to)){assert.doesNotThrow(()=>client.taskTransitionRpcArgs({...base,expectedStatus:from,targetStatus:to}));allowed++;}
 else assert.throws(()=>client.taskTransitionRpcArgs({...base,expectedStatus:from,targetStatus:to}));
 }assert.equal(allowed,6);assert.throws(()=>client.taskTransitionRpcArgs({...base,targetStatus:'Unknown'}));
});
test('missing CAS token and invalid/overlong reason fail before requests',()=>{
 assert.throws(()=>client.taskTransitionRpcArgs({...base,expectedUpdatedAt:''}));
 assert.throws(()=>client.taskTransitionRpcArgs({...base,reason:'x'.repeat(1001)}));
});
test('conflict and ambiguous outcomes are sanitized, actionable and do not reveal details',()=>{
 const conflict=client.taskTransitionError({code:'40001',message:'private token detail'});assert.equal(conflict.status,409);assert.equal(conflict.code,'TASK_TRANSITION_CONFLICT');assert.ok(!conflict.message.includes('private'));
 assert.equal(client.taskTransitionError({message:'private connection string'}).status,503);
 assert.equal(client.taskTransitionError({code:'PT409'}).code,'TASK_TRANSITION_CONFLICT');
});
test('prepared Web and Android writers remain gated and use the same RPC payload',()=>{
 assert.equal(contract.TASK_WORKFLOW_WRITES_ENABLED,false);
 for(const p of ['app/api/tasks/transition/route.ts','mobile/src/services/task-transitions.ts']){const s=read(p);assert.match(s,/!TASK_WORKFLOW_WRITES_ENABLED/);assert.match(s,/taskTransitionRpcArgs/);assert.match(s,/rpc\('transition_task_status'/);}
 assert.match(read('lib/data/task-transition-client.ts'),/x-yosseuf-organization/);
});
test('confirmed Android conflict refreshes reads with session/revision guards, not a retry',()=>{
 const app=read('mobile/App.tsx');assert.match(app,/code==='40001'/);assert.match(app,/loadMobileWorkspace\(snapshot.selected!\)/);
 assert.match(app,/sessionVersion===sessionRevision.current/);assert.match(app,/organizationStore.current.isCurrent\(snapshot.revision\)/);
 const op=load('mobile/src/organizations/operation.ts');assert.equal(op.losesOrganizationAccess({code:'40001'}),false);
 assert.match(op.safeOperationError({code:'40001'}).message,/تغيرت المهمة/);
});
function routeHarness(enabled) {
 let authCalls=0,rpcCalls=0;
 const next={NextResponse:{json:(body,options={})=>({body,status:options.status??200})}};
 const auth={authenticatedDatabase:async()=>{authCalls++;return {organizationId:'org',database:{rpc:async()=>{rpcCalls++;return {error:{code:'PT409',message:'private backend detail'}};}}};}};
 const route=load('app/api/tasks/transition/route.ts',(name)=>name==='next/server'?next:name.endsWith('authorized-workspace')?auth:name.endsWith('organizations/context')?{requestedOrganization:h=>h.get('x-yosseuf-organization')}:name.endsWith('task-status-contract')?{...contract,TASK_WORKFLOW_WRITES_ENABLED:enabled}:client);
 const request=(body=base,headers=new Headers({'authorization':'Bearer synthetic','x-yosseuf-organization':'org'}))=>({headers,json:async()=>body});
 return {route,request,counts:()=>({authCalls,rpcCalls})};
}
test('actual Web handler stays disabled before any Auth/RPC call in production configuration',async()=>{
 const h=routeHarness(false);const response=await h.route.POST(h.request());
 assert.equal(response.status,503);assert.equal(h.counts().authCalls,0);assert.equal(h.counts().rpcCalls,0);
});
test('prepared Web handler rejects mismatched tenant context before mutation',async()=>{
 const h=routeHarness(true);const response=await h.route.POST(h.request({...base,organizationId:'another-org'}));
 assert.equal(response.status,403);assert.equal(h.counts().rpcCalls,0);
});
test('prepared Web handler normalizes non-retryable conflict without a second RPC or backend detail',async()=>{
 const h=routeHarness(true);const response=await h.route.POST(h.request());
 assert.equal(response.status,409);assert.equal(response.body.code,'TASK_TRANSITION_CONFLICT');
 assert.ok(!response.body.error.includes('private'));assert.equal(h.counts().rpcCalls,1);
});
