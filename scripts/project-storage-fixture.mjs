// Real Storage API, fixed disposable local target. No external connection input.
import {spawnSync} from 'node:child_process';
import {createHmac} from 'node:crypto';
import assert from 'node:assert/strict';
const name='basoul-batch2-storage',network='basoul-pr173-auth-network',image='supabase/storage-api:v1.81.0';
function run(args,input){const r=spawnSync('docker',args,{input,encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw new Error('Local storage fixture '+args[0]+' failed');return r.stdout.trim();}
export async function startProjectStorage(sql,secret,password){
 assert.equal(JSON.parse(run(['network','inspect',network]))[0].Internal,true);
 sql(`ALTER ROLE supabase_storage_admin PASSWORD '${password.replaceAll("'","''")}'; CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin; GRANT ALL ON SCHEMA storage TO supabase_storage_admin;`);
 function token(role){const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),p=Buffer.from(JSON.stringify({role,exp:Math.floor(Date.now()/1000)+7200})).toString('base64url');return h+'.'+p+'.'+createHmac('sha256',secret).update(h+'.'+p).digest('base64url');}
 const existing=spawnSync('docker',['inspect',name],{encoding:'utf8'});
 if(existing.status===0){
 const c=JSON.parse(existing.stdout)[0];assert.equal(c.Config.Image,image);assert.equal(c.HostConfig.NetworkMode,network);assert.deepEqual(Object.keys(c.NetworkSettings.Networks),[network]);assert.equal(c.Mounts.length,0);assert.ok(c.HostConfig.Tmpfs['/var/lib/storage']);assert.equal(c.HostConfig.Privileged,false);assert.ok(!Object.keys(c.HostConfig.PortBindings??{}).length);
 const env=Object.fromEntries(c.Config.Env.map(value=>{const i=value.indexOf('=');return [value.slice(0,i),value.slice(i+1)];})),uri=new URL(env.DATABASE_URL);
 assert.equal(uri.hostname,'basoul-pr173-auth-db');assert.equal(uri.pathname,'/basoul_pr173_auth_phase2_clean');assert.equal(uri.username,'supabase_storage_admin');assert.equal(env.AUTH_JWT_SECRET,secret);assert.equal(env.POSTGREST_URL,'http://basoul-pr173-postgrest:3000');assert.equal(env.STORAGE_BACKEND,'file');assert.equal(env.FILE_STORAGE_BACKEND_PATH,'/var/lib/storage');assert.equal(c.State.Running,false);run(['start',name]);
 }
 else {
 const env={ANON_KEY:token('anon'),SERVICE_KEY:token('service_role'),AUTH_JWT_SECRET:secret,DATABASE_URL:'postgres://supabase_storage_admin:'+encodeURIComponent(password)+'@basoul-pr173-auth-db:5432/basoul_pr173_auth_phase2_clean',POSTGREST_URL:'http://basoul-pr173-postgrest:3000',STORAGE_BACKEND:'file',FILE_STORAGE_BACKEND_PATH:'/var/lib/storage',GLOBAL_S3_BUCKET:'synthetic',TENANT_ID:'synthetic',REGION:'local',FILE_SIZE_LIMIT:'104857600',ENABLE_IMAGE_TRANSFORMATION:'false'};
 // Values originate only from the verified synthetic fixture; never log args.
 run(['run','-d','--name',name,'--network',network,'--tmpfs','/var/lib/storage:rw,size=128m',...Object.entries(env).flatMap(([k,v])=>['-e',k+'='+v]),image]);
 }
 let ready=false;for(let n=0;n<60;n++){const r=spawnSync('docker',['exec','basoul-pr173-http-client','node','-e',"fetch('http://basoul-batch2-storage:5000/status').then(r=>{if(!r.ok)process.exitCode=1}).catch(()=>process.exitCode=1)"],{encoding:'utf8'});if(r.status===0){ready=true;break;}await new Promise(r=>setTimeout(r,1000));}
 assert.ok(ready,'Real isolated Storage API did not become ready');
 // Self-hosted database bootstrap grants, absent from this deliberately empty
 // disposable database. Row policies remain enabled and are tested below.
 sql('GRANT USAGE ON SCHEMA storage TO authenticated,anon,service_role; GRANT SELECT ON storage.buckets TO authenticated; GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated; GRANT ALL ON ALL TABLES IN SCHEMA storage TO service_role; GRANT EXECUTE ON FUNCTION storage.foldername(text) TO authenticated;');
 console.log('PASS real isolated Storage API ready (filesystem tmpfs, no published ports)');
}
export function stopProjectStorage(){const r=spawnSync('docker',['inspect',name],{encoding:'utf8'});if(r.status===0&&JSON.parse(r.stdout)[0].State.Running)run(['stop','--timeout','10',name]);}
