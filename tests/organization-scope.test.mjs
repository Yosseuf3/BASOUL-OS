import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const root=fileURLToPath(new URL('../',import.meta.url));
function modules(raw={},fetch=()=>{throw new Error('Unexpected network');}) {
 const cache=new Map();
 function load(path){const full=resolve(root,path);if(cache.has(full))return cache.get(full);
  const compiled={exports:{}};cache.set(full,compiled.exports);
  const require=name=>{
   if(name.endsWith('/supabase'))return {supabase:raw};
   const target=name.startsWith('@/')?resolve(root,name.slice(2)):resolve(dirname(full),name);
   return load(target+'.ts');
  };
  runInNewContext(ts.transpileModule(readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
   {module:compiled,exports:compiled.exports,require,Headers,fetch,URL,console});return compiled.exports;
 }
 return load;
}
function activate(state,id='A',user='actor'){const revision=state.beginOrganizationSelection(user,id);state.finishOrganizationSelection(revision,'owner');}
const changed=cause=>cause.code==='ORGANIZATION_CHANGED';
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};

test('a loading selection rejects operations; A -> B -> A never revives an earlier lease',()=>{
 const load=modules(),state=load('lib/organizations/active-context.ts');
 assert.throws(()=>state.requireOrganizationLease(),changed);activate(state);
 const old=state.requireOrganizationLease();assert.equal(old.isCurrent(),true);
 state.beginOrganizationSelection('actor','B');assert.equal(old.isCurrent(),false);
 assert.throws(()=>state.requireOrganizationLease(),changed);activate(state,'A');
 assert.equal(old.isCurrent(),false);assert.throws(()=>state.requireOrganizationLease('B'),changed);
});

test('a queued native fluent mutation cannot dispatch after selection changes',async()=>{
 const load=modules(),{guardOrganizationClient}=load('packages/services/src/organization-guard.ts');let current=true,calls=0;
 const query={update(){return this;},eq(){return this;},then(resolve){calls++;resolve({data:{id:'task'}});}};
 const client=guardOrganizationClient({from:()=>query},()=>current);
 const pending=client.from('tasks').update({title:'A'}).eq('id','task');current=false;
 await assert.rejects(async()=>await pending,changed);assert.equal(calls,0);
});

test('late responses are discarded without replay, while a committed write remains ambiguous',async()=>{
 const load=modules(),{guardOrganizationClient}=load('packages/services/src/organization-guard.ts');const network=deferred();let current=true,calls=0;
 const client=guardOrganizationClient({rpc(){calls++;return network.promise;}},()=>current);
 const result=(async()=>await client.rpc('edit_task_fields'))();await Promise.resolve();current=false;network.resolve({data:{id:'task'}});
 await assert.rejects(result,changed);assert.equal(calls,1);
});

function database(){
 let role='owner',user='actor';const sent=[],gates={};
 const raw={auth:{getUser:async()=>({data:{user:{id:user}},error:null})},from(table){
  const filters=[],q={select(){return q;},eq(key,value){filters.push([key,value]);return q;},insert(value){q.payload=value;q.write=true;return q;},update(value){q.payload=value;q.write=true;return q;},delete(){q.write=true;return q;},single(){q.singleResult=true;return q;},maybeSingle(){q.singleResult=true;return q;},
   then(resolve,reject){
    if(table==='organization_memberships')return Promise.resolve({data:role?{role,status:'active'}:null,error:null}).then(resolve,reject);
    if(table==='projects' && filters.some(([key,value])=>key==='id'&&value==='foreign'))return Promise.resolve({data:null,error:{code:'42501'}}).then(resolve,reject);
    sent.push({table,filters:[...filters],payload:q.payload,write:q.write});
    return (gates[table]?.promise??Promise.resolve({data:q.singleResult?{id:'row'}:[{id:'row'}],error:null})).then(resolve,reject);
   }};return q;}};
 return {raw,sent,gates,setRole:value=>role=value,setUser:value=>user=value};
}
test('Web reads/writes carry selected organization, and viewer/demoted/revoked actors cannot dispatch writes',async()=>{
 const db=database(),load=modules(db.raw),state=load('lib/organizations/active-context.ts');activate(state,'B');
 const {organizationClient}=load('lib/organizations/scoped-client.ts');
 await organizationClient().from('projects').select('*');
 assert.ok(db.sent[0].filters.some(([key,value])=>key==='organization_id'&&value==='B'));
 await organizationClient().from('projects').insert({name:'B project'});
 assert.equal(db.sent[1].payload.organization_id,'B');
 for(const role of ['viewer',null]){db.setRole(role);await assert.rejects(async()=>await organizationClient().from('projects').update({name:'denied'}).eq('id','row'),/ORGANIZATION_ACCESS_DENIED/);}
 db.setRole('member');await assert.rejects(async()=>await organizationClient().from('projects').delete().eq('id','row'),/ORGANIZATION_ACCESS_DENIED/);
 assert.equal(db.sent.filter(request=>request.write).length,1);
});

test('foreign tenant payloads/references and changed accounts cannot reach a business mutation',async()=>{
 const db=database(),load=modules(db.raw),state=load('lib/organizations/active-context.ts');activate(state,'B');
 const {organizationClient}=load('lib/organizations/scoped-client.ts');
 assert.throws(()=>organizationClient().from('tasks').insert({organization_id:'A'}),/ORGANIZATION_RECORD_UNAVAILABLE/);
 await assert.rejects(async()=>await organizationClient().from('tasks').insert({project_id:'foreign',title:'denied'}),/ORGANIZATION_RECORD_UNAVAILABLE/);
 db.setUser('other-account');await assert.rejects(async()=>await organizationClient().from('projects').insert({name:'denied'}),/ORGANIZATION_ACCESS_DENIED/);
 assert.equal(db.sent.filter(request=>request.write).length,0);
});

test('Web request generation is invalidated while membership verification is pending',async()=>{
 const db=database(),identity=deferred();db.raw.auth.getUser=()=>identity.promise;
 const load=modules(db.raw),state=load('lib/organizations/active-context.ts');activate(state,'A');
 const client=load('lib/organizations/scoped-client.ts').organizationClient();
 const result=(async()=>await client.from('projects').insert({name:'old'}))();await Promise.resolve();
 activate(state,'B');identity.resolve({data:{user:{id:'actor'}},error:null});await assert.rejects(result,changed);
 assert.equal(db.sent.length,0);
});

test('Web API transport requires the captured actor/org, includes headers and discards late responses',async()=>{
 let calls=0,header;const network=deferred(),load=modules({},async(_url,init)=>{calls++;header=init.headers.get('x-yosseuf-organization');return network.promise;});
 const state=load('lib/organizations/active-context.ts'),{organizationFetch}=load('lib/organizations/request.ts');
 await assert.rejects(organizationFetch('/api/workspace/projects'),changed);activate(state,'B');
 await assert.rejects(organizationFetch('/api/workspace/projects',{},'A','actor'));
 const result=organizationFetch('/api/workspace/projects',{method:'POST'},'B','actor');
 assert.equal(header,'B');activate(state,'A');network.resolve({ok:true});await assert.rejects(result,changed);assert.equal(calls,1);
});

test('Web transport rejects body decoding completed after an organization switch',async()=>{
 const body=deferred(),load=modules({},async()=>({ok:true,json:()=>body.promise}));
 const state=load('lib/organizations/active-context.ts'),{organizationFetch}=load('lib/organizations/request.ts');
 activate(state,'A');const response=await organizationFetch('/api/workspace/projects');const reading=response.json();
 activate(state,'B');body.resolve({data:[{id:'A-only'}]});await assert.rejects(reading,changed);
});

test('server authentication never infers the first membership when organization header is absent',async()=>{
 let clients=0;const compiled={exports:{}};
 const source=readFileSync(new URL('../lib/auth/authorized-workspace.ts',import.meta.url),'utf8');
 runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:compiled,exports:compiled.exports,require:()=>({createClient:()=>{clients++;throw new Error('must not bootstrap context');}})});
 assert.equal(await compiled.exports.authenticatedDatabase('synthetic'),null);assert.equal(clients,0);
});

test('files and administration retain selected organization and cannot dispatch foreign-tenant operations',async()=>{
 const db=database();let downloads=0,invocations=0;
 db.raw.storage={from:()=>({createSignedUrl:async()=>{downloads++;return {data:{signedUrl:'synthetic'},error:null};}})};
 db.raw.functions={invoke:async()=>{invocations++;return {data:{ok:true},error:null};}};
 const load=modules(db.raw),state=load('lib/organizations/active-context.ts');activate(state,'B');
 const {organizationClient}=load('lib/organizations/scoped-client.ts');
 await assert.rejects(organizationClient().storage.from('project-files').createSignedUrl('actor/foreign/file.pdf',60),/ORGANIZATION_RECORD_UNAVAILABLE/);
 assert.equal(downloads,0);
 await assert.rejects(organizationClient().functions.invoke('organization-admin',{body:{action:'invite',organizationId:'A'}}),/ORGANIZATION_ACCESS_DENIED/);
 assert.equal(invocations,0);
 await organizationClient().storage.from('project-files').createSignedUrl('actor/row/file.pdf',60);assert.equal(downloads,1);
 const reference=db.sent.find(request=>request.table==='projects');assert.ok(reference.filters.some(([key,value])=>key==='organization_id'&&value==='B'));
});
