import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const compiled=ts.transpileModule(readFileSync('app/api/workspace/[resource]/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(authorized=true){
  const exports={},calls=[];
  const query={select:value=>{calls.push(['select',value]);return query;},eq:(key,value)=>{calls.push(['eq',key,value]);return query;},order:async(key,options)=>{calls.push(['order',key,options.ascending]);return{data:[],error:null};}};
  runInNewContext(compiled,{exports,require:name=>{
    if(name==='next/server')return{NextResponse:{json:(value,options)=>Response.json(value,options)}};
    if(name.includes('authorized-workspace'))return{isAuthorizedResource:()=>true,authenticatedDatabase:async()=>authorized?{organizationId:'synthetic-tenant',database:{from:resource=>{calls.push(['from',resource]);return query;}}}:null};
    if(name.includes('organizations/context'))return{requestedOrganization:()=> 'synthetic-tenant'};
    throw Error('Unexpected dependency');
  }});
  return{get:resource=>exports.GET({headers:new Headers({authorization:'Bearer synthetic-session'})},{params:Promise.resolve({resource})}),calls};
}
for(const resource of ['notifications','activity_events','projects','tasks','clients','content_items','knowledge_items','finance_transactions']){
  test(resource+' uses its actual schema timestamp and remains tenant-scoped',async()=>{
    const h=harness(),response=await h.get(resource);
    assert.equal(response.status,200);
    assert.deepEqual(h.calls,[['from',resource],['select','*'],['eq','organization_id','synthetic-tenant'],['order',['notifications','activity_events'].includes(resource)?'created_at':'updated_at',false]]);
  });
}
test('unauthorized workspace read does not query a resource',async()=>{const h=harness(false);assert.equal((await h.get('notifications')).status,401);assert.deepEqual(h.calls,[]);});
