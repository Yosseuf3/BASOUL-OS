import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const org='00000000-0000-0000-0000-000000000001';
const compiled=ts.transpileModule(readFileSync('app/api/architecture/cad/health/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness({authorized=true,env={CAD_GATEWAY_URL:'https://private.invalid/'},upstream=async()=>Response.json({ok:true,dwg:true,schema:'basoul.cad.v1',internal:'must not escape'})}={}){
  const calls=[],exports={};
  runInNewContext(compiled,{exports,URL,AbortSignal,process:{env},fetch:async(...args)=>{calls.push(args);return upstream(...args);},require:name=>{
    if(name==='next/server')return{NextResponse:{json:(value,options)=>Response.json(value,options)}};
    if(name.includes('authorized-workspace'))return{authenticatedDatabase:async(token,organizationId)=>{assert.equal(token,'session');assert.equal(organizationId,org);return authorized?{organizationId}:null;}};
    if(name.includes('organizations/context'))return{requestedOrganization:headers=>headers.get('x-yosseuf-organization')};
    throw Error('Unexpected dependency');
  }});
  return{calls,get:headers=>exports.GET({headers:new Headers(headers??{authorization:'Bearer session','x-yosseuf-organization':org})})};
}
test('missing identity or organization never contacts the private service',async()=>{
  for(const headers of [{},{authorization:'Bearer session'},{'x-yosseuf-organization':org}]){const h=harness();assert.equal((await h.get(headers)).status,401);assert.equal(h.calls.length,0);}
});
test('revoked or unauthorized membership fails closed before gateway access',async()=>{const h=harness({authorized:false});assert.equal((await h.get()).status,401);assert.equal(h.calls.length,0);});
test('authorized health probe uses private binding, no cache and server credential only',async()=>{
  const h=harness({env:{CAD_GATEWAY_URL:'https://private.invalid/',CAD_GATEWAY_TOKEN:'service-only'}});
  const response=await h.get();assert.equal(response.status,200);assert.deepEqual(await response.json(),{data:{ok:true,dwg:true,schema:'basoul.cad.v1'}});
  assert.equal(String(h.calls[0][0]),'https://private.invalid/health');assert.equal(h.calls[0][1].cache,'no-store');assert.equal(h.calls[0][1].headers.Authorization,'Bearer service-only');
});
test('missing binding and unavailable DWG support cannot report healthy',async()=>{
  for(const options of [{env:{}},{upstream:async()=>Response.json({ok:true,dwg:false,schema:'basoul.cad.v1'})},{upstream:async()=>new Response('failed',{status:500})},{upstream:async()=>Response.json({ok:true,dwg:true,schema:'unknown'})}]){
    assert.equal((await harness(options).get()).status,503);
  }
});
test('gateway failures do not expose internal exception details',async()=>{
  const response=await harness({upstream:async()=>{throw Error('private address secret');}}).get();assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'architecture.cad.gateway_unreachable'});
});
