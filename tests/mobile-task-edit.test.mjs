import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
function load(path,require) {const compiled={exports:{}};runInNewContext(ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:compiled,exports:compiled.exports,require});return compiled.exports;}
const task={id:'task',status:'To Do',updated_at:'old'};
const input={title:'  Title  ',progress:42,due_date:null};
const confirmed={id:'task',organization_id:'org',status:'To Do',updated_at:'new',title:'Title',progress:42};
function harness({error=null,data=confirmed,enabled=false,permissionError=false}={}) {
 let validations=0,rpcs=0,updates=0;const filters=[];
 const database={rpc:async()=>{rpcs++;return {error,data};},from:()=>{const q={update:()=>{updates++;return q;},eq:(key,value)=>{filters.push([key,value]);return q;},select:()=>q,single:async()=>({data,error:null})};return q;}};
 const service=load('mobile/src/services/task-edits.ts',name=>name.endsWith('/context')?{mobileOrganizationClient:()=>database}:name.endsWith('/supabase')?{supabase:database}:name.endsWith('/organizations')?{validateOrganizationContext:async()=>{validations++;if(permissionError)throw {code:'42501'};}}:{TASK_WORKFLOW_WRITES_ENABLED:enabled});
 return {run:value=>service.editMobileTask({userId:'user',organizationId:'org'},task,value??input),archive:()=>service.archiveMobileTask({userId:'user',organizationId:'org'},task),counts:()=>({validations,rpcs,updates}),filters};
}
test('Mobile generic edits validate permission and confirm exact task fields',async()=>{
 const h=harness();await h.run();assert.equal(h.counts().rpcs,1);assert.equal(h.counts().updates,0);
 const denied=harness({permissionError:true});await assert.rejects(denied.run,error=>error.code==='42501');assert.equal(denied.counts().rpcs,0);
 const invalid=harness();await assert.rejects(()=>invalid.run({...input,progress:101}));assert.equal(invalid.counts().validations,0);
});
test('Mobile archive confirms identity, tenant, revision and archived flag without physical deletion',async()=>{
 const h=harness({data:{...confirmed,archived:true}});await h.archive();assert.equal(h.counts().rpcs,1);assert.equal(h.counts().updates,0);
 for(const data of [confirmed,{...confirmed,archived:true,id:'foreign'},{...confirmed,archived:true,updated_at:'old'}]) await assert.rejects(harness({data}).archive,error=>error.code==='TASK_TRANSITION_UNCONFIRMED');
 await assert.rejects(harness({error:{code:'PGRST202'}}).archive,error=>error.code==='TASK_UPDATE_REQUIRED');
});
test('missing edit RPC fails closed with upgrade guidance, even before activation',async()=>{
 const h=harness({error:{code:'PGRST202'}});await assert.rejects(h.run,error=>error.code==='TASK_UPDATE_REQUIRED');assert.equal(h.counts().updates,0);
 const active=harness({error:{code:'PGRST202'},enabled:true});await assert.rejects(active.run);assert.equal(active.counts().updates,0);
});
test('offline or forbidden generic edit never falls back or retries',async()=>{
 for(const code of ['PT409','42501','NETWORK_ERROR']){const h=harness({error:{code},data:null});await assert.rejects(h.run,error=>error.code===code);assert.equal(h.counts().rpcs,1);assert.equal(h.counts().updates,0);}
});
test('unrelated/stale edit responses cannot confirm success',async()=>{
 for(const data of [{...confirmed,id:'other'},{...confirmed,organization_id:'other'},{...confirmed,updated_at:'old'},{...confirmed,progress:12}]){
  const h=harness({data});await assert.rejects(h.run,error=>error.code==='TASK_TRANSITION_UNCONFIRMED');assert.equal(h.counts().rpcs,1);
 }
});
