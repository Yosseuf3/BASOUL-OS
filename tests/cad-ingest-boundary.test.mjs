import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const compiled=ts.transpileModule(readFileSync('app/api/architecture/cad/ingest/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function route(){
  const exports={};let authCalls=0;
  runInNewContext(compiled,{exports,File,FormData,process:{env:{}},require:name=>{
    if(name==='next/server')return{NextResponse:{json:(value,options)=>Response.json(value,options)}};
    if(name.includes('authorized-workspace'))return{authenticatedDatabase:async()=>{authCalls++;return null;}};
    if(name.includes('organizations/context'))return{requestedOrganization:headers=>headers.get('x-yosseuf-organization')};
    throw Error('Unexpected dependency');
  }});
  return{post:exports.POST,calls:()=>authCalls};
}
test('CAD ingestion requires explicit identity and organization before parsing any upload',async()=>{
  for(const headers of [{},{authorization:'Bearer session'},{'x-yosseuf-organization':'00000000-0000-0000-0000-000000000001'}]){
    const r=route();let parsed=false;
    const response=await r.post({headers:new Headers(headers),formData:async()=>{parsed=true;throw Error('must not parse');}});
    assert.equal(response.status,401);assert.equal(parsed,false);assert.equal(r.calls(),0);
  }
});
test('malformed CAD multipart request returns 400 rather than an unhandled server error',async()=>{
  const r=route();
  const response=await r.post({headers:new Headers({authorization:'Bearer session','x-yosseuf-organization':'00000000-0000-0000-0000-000000000001'}),formData:async()=>{throw Error('multipart boundary missing');}});
  assert.equal(response.status,400);assert.deepEqual(await response.json(),{error:'architecture.cad.invalid_request'});assert.equal(r.calls(),0);
});
