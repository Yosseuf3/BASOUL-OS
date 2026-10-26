import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Disposable, network-isolated PostgreSQL only; no URL/env credential input is accepted.
const image=process.env.BASOUL_RLS_TEST_IMAGE || 'postgres:17@sha256:b8faeff7712663c2773a190181e1246e37e364b887611c04658c28b44e2408fe';
const name=`basoul-rls-security-${process.pid}`;
function docker(args,input){
  const r=spawnSync('docker',args,{input,encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(r.status,0,r.stderr || r.stdout);return r.stdout;
}
const read=p=>readFileSync(p,'utf8');
const sql=q=>docker(['exec','-i',name,'psql','-X','-h','127.0.0.1','-U','postgres','-d','basoul_rls_security','-v','ON_ERROR_STOP=1'],q);
function definition(source,name){
  const start=source.indexOf(`create or replace function ${name}(`);
  assert.ok(start>=0,`Missing function ${name}`);
  const end=source.indexOf('$$;',start);assert.ok(end>start);
  return source.slice(start,end+3);
}
let started=false;
try{
  docker(['run','-d','--rm','--name',name,'--network','none','--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust',image]);started=true;
  let ready=false;
  for(let i=0;i<60;i++){
    if(spawnSync('docker',['exec',name,'pg_isready','-h','127.0.0.1','-U','postgres'],{encoding:'utf8'}).status===0){ready=true;break;}
    await new Promise(r=>setTimeout(r,500));
  }
  assert.ok(ready,'Isolated PostgreSQL did not become ready');
  docker(['exec',name,'createdb','-h','127.0.0.1','-U','postgres','basoul_rls_security']);
  sql(read('tests/fixtures/project-files-rls-setup.sql'));
  const foundation=read('supabase/migrations/20260802204811_iam_foundation.sql');
  sql(['private.role_rank','private.member_role','private.has_permission'].map(n=>definition(foundation,n)).join('\n'));
  sql(read('supabase/migrations/20260828035500_project_files_tenant_upload_repair.sql'));
  sql(read('supabase/migrations/20260828042500_project_files_storage_policy_name_collision_fix.sql'));
  const onboarding=read('supabase/migrations/20260822121500_owner_onboarding_tenant_isolation.sql');
  sql(['public.create_organization_invitation','public.revoke_organization_invitation'].map(n=>definition(onboarding,n)).join('\n'));
  const admin=read('supabase/migrations/20260809193000_basoul_administration_boundaries.sql');
  sql(definition(admin,'private.record_administration_event'));
  sql(read('tests/fixtures/project-files-rls-seed.sql'));
  sql(read('tests/fixtures/project-files-rls-reproduce.sql'));
  console.log('PASS: original policies and NULL owner guard reproduced');
  for(let i=0;i<2;i++){
    sql(read('supabase/migrations/20261025043233_project_files_organization_correlation.sql'));
    sql(read('supabase/migrations/20261025043328_invitation_owner_null_guard.sql'));
  }
  console.log(sql(read('tests/fixtures/project-files-rls-regression.sql')));
  console.log('PASS: actual PostgreSQL RLS and invitation owner regression; migrations reapplied safely');
}finally{if(started)docker(['stop','--time','5',name]);}
