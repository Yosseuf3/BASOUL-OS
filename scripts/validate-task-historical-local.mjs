// Fixed network-none disposable target. No external connection parameters.
import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {historicalMigrationPlan} from './task-historical-manifest.mjs';
const container='basoul-pr173-validation';
function docker(args,input){const r=spawnSync('docker',args,{input,encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw new Error(r.stderr||'Local SQL failed');return r.stdout.trim();}
const config=JSON.parse(docker(['inspect',container]))[0];
assert.equal(config.HostConfig.NetworkMode,'none');assert.deepEqual(config.Mounts,[]);assert.ok(config.HostConfig.Tmpfs['/var/lib/postgresql/data']);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const plan=historicalMigrationPlan(readdirSync(new URL('../supabase/',import.meta.url)),readdirSync(new URL('../supabase/migrations/',import.meta.url)));
const sql=(db,s)=>docker(['exec','-i',container,'psql','-X','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At'],s);
function fingerprint(db){
 const tables=sql(db,"SELECT quote_ident(schemaname)||'.'||quote_ident(tablename) FROM pg_tables WHERE schemaname IN('public','private','auth','storage') ORDER BY 1;").split('\n').filter(Boolean);
 const rows=tables.map(t=>[t,sql(db,`SELECT coalesce(md5(string_agg(row_to_json(r)::text,'|' ORDER BY row_to_json(r)::text)),'empty') FROM ${t} r;`)]);
 const structure=sql(db,`SELECT jsonb_agg(x ORDER BY x::text) FROM (
 SELECT jsonb_build_array('column',table_schema,table_name,column_name,data_type,udt_name,is_nullable,column_default) x FROM information_schema.columns WHERE table_schema IN('public','private','auth','storage')
 UNION ALL SELECT jsonb_build_array('policy',schemaname,tablename,policyname,roles,cmd,qual,with_check) FROM pg_policies WHERE schemaname IN('public','private','auth','storage')
 UNION ALL SELECT jsonb_build_array('function',n.nspname,p.proname,pg_get_functiondef(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN('public','private','auth','storage') AND p.prokind='f'
 UNION ALL SELECT jsonb_build_array('table',n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','private','auth','storage') AND c.relkind='r'
 UNION ALL SELECT jsonb_build_array('constraint',n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid)) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','private','auth','storage')
 UNION ALL SELECT jsonb_build_array('trigger',n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid),t.tgenabled) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname IN('public','private','auth','storage')
 UNION ALL SELECT jsonb_build_array('enum',n.nspname,t.typname,e.enumlabel,row_number() OVER(PARTITION BY t.oid ORDER BY e.enumsortorder)) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public'
 ) s;`);
 return createHash('sha256').update(JSON.stringify({structure:JSON.parse(structure),rows})).digest('hex');
}
const candidates=['proposed-task-rollout-gate.sql','proposed-task-security-hardening.sql','proposed-task-transition-enforcement.sql','proposed-task-notifications.sql','proposed-task-edit-cas.sql'].map(p=>read('docs/database/'+p)).join('\n');
for(const mode of ['fresh','upgrade']){
 const db=`basoul_history_${mode}_${Date.now()}`;docker(['exec',container,'createdb','-U','postgres',db]);
 sql(db,read('tests/fixtures/historical-host-services.sql'));
 sql(db,read('tests/fixtures/historical-storage-catalog.sql'));
 let bootstrap=read('supabase/schema.sql');if(mode==='upgrade')bootstrap=bootstrap.replace("'Waiting','Review','Done'","'Waiting','Done'");sql(db,bootstrap);
 sql(db,"INSERT INTO auth.users(id,email) VALUES('00000000-0000-0000-0000-000000000001','history@synthetic.invalid'); INSERT INTO projects(id,user_id,name,created_at) VALUES('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Synthetic historical project','2025-01-01'); INSERT INTO tasks(id,user_id,project_id,title,status,progress) VALUES('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Synthetic historical task','To Do',15);");
 for(const file of plan){
  try{sql(db,read(file));}catch(error){throw new Error(`${mode} historical dependency failed at ${file}: ${error.message.slice(0,700)}`);}
  if(file.endsWith('clients_baseline_repair.sql'))sql(db,"INSERT INTO clients(id,user_id,name,status,created_at) VALUES('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Synthetic existing client','Active','2025-01-02');");
  if(file==='supabase/migration_v0.5.0.sql'){
   assert.equal(sql(db,"SELECT name||'|'||status::text||'|'||to_char(created_at,'YYYY-MM-DD')||'|'||to_char(updated_at,'YYYY-MM-DD') FROM clients;"),'Synthetic existing client|Active|2025-01-02|2025-01-02');
   const before=fingerprint(db);sql(db,read(file));assert.equal(fingerprint(db),before,'Repeated v0.5.0 changed existing data/schema');
  }
 }
 sql(db,read('docs/database/proposed-task-review-enum.sql'));const before=fingerprint(db);
 assert.throws(()=>sql(db,'BEGIN;\n'+candidates+"\nDO $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_INSTALL_FAILURE'; END $$; COMMIT;"),/SYNTHETIC_INSTALL_FAILURE/);
 assert.equal(fingerprint(db),before,'Failed candidate installation did not roll back completely');
 sql(db,'BEGIN;\n'+candidates+'\nCOMMIT;');assert.equal(sql(db,'SELECT count(*) FROM private.task_workflow_activation;'),'0','Rehearsal must not activate workflow');
 sql(db,`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
 SELECT (edit_task_fields(t.id,t.organization_id,t.updated_at,'{"description":"Historical CAS edit"}')).id FROM tasks t;
 SELECT (edit_task_fields(t.id,t.organization_id,t.updated_at,'{"archived":true}')).id FROM tasks t;`);
 assert.equal(sql(db,"SELECT archived::text||'|'||progress::text||'|'||status::text FROM tasks;"),'true|15|To Do');
 const expected=fingerprint(db),backup='/tmp/'+db+'.dump',recovered=db+'_restore';
 docker(['exec',container,'pg_dump','-U','postgres','-d',db,'-Fc','-f',backup]);docker(['exec',container,'createdb','-U','postgres',recovered]);
 docker(['exec',container,'pg_restore','-U','postgres','--exit-on-error','-d',recovered,backup]);assert.equal(fingerprint(recovered),expected,'Backup recovery changed data/schema/security');
 console.log(`PASS ${mode}: ${plan.length} ordered migrations, existing client preservation/idempotence, candidate atomic rollback, CAS archive, full local dump/restore fingerprint. No activation.`);
}
console.log('LIMIT: synthetic Auth/Storage catalog fixture, not a hosted service or production-data parity certification.');
