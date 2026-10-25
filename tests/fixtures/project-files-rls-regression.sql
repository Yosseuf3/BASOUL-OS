begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
do $$ declare n integer; begin
 assert current_user='authenticated';
 assert not (select rolsuper or rolbypassrls from pg_roles where rolname=current_user),'Tests must enforce RLS';
 assert (select count(*) from public.project_files)=1,'Hide legacy mismatched file even from dual-tenant member';
 begin
  insert into public.project_files(user_id,organization_id,project_id,name,storage_path,file_size)
  values(auth.uid(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000202','bad','bad-new',1);
  raise exception 'Cross-org INSERT accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.project_files set project_id='00000000-0000-0000-0000-000000000202' where storage_path='valid';
  raise exception 'Cross-org UPDATE accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.project_files set organization_id='00000000-0000-0000-0000-000000000002' where storage_path='valid';
  raise exception 'Organization mismatch UPDATE accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.project_files set user_id='00000000-0000-0000-0000-000000000102' where storage_path='valid';
  raise exception 'Forged owner UPDATE accepted';
 exception when insufficient_privilege then null; end;
 update public.project_files set name='bad-change' where storage_path='inconsistent';
 get diagnostics n=row_count; assert n=0,'Mismatched UPDATE must affect zero rows';
 delete from public.project_files where storage_path='inconsistent';
 get diagnostics n=row_count; assert n=0,'Mismatched DELETE must affect zero rows';
 insert into public.project_files(user_id,organization_id,project_id,name,storage_path,file_size)
 values(auth.uid(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000201','good','crud',1);
 assert (select count(*) from public.project_files where storage_path='crud')=1;
 update public.project_files set name='updated' where storage_path='crud';
 get diagnostics n=row_count; assert n=1,'Same-org UPDATE';
 delete from public.project_files where storage_path='crud';
 get diagnostics n=row_count; assert n=1,'Same-org owner DELETE';
end $$;
-- Viewer, outsider, other-tenant-only owner, suspended membership.
do $$ declare identity text; n integer; begin
 foreach identity in array array['103','104','102','105'] loop
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-'||lpad(identity,12,'0'),true);
  assert (select count(*) from public.project_files)=case when identity='103' then 1 else 0 end,'Read boundary '||identity;
  begin
   insert into public.project_files(user_id,organization_id,project_id,name,storage_path,file_size)
   values(auth.uid(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000201','denied','denied-'||identity,1);
   raise exception 'Unauthorized INSERT %',identity;
  exception when insufficient_privilege then null; end;
  update public.project_files set name='denied' where storage_path='valid';
  get diagnostics n=row_count; assert n=0,'Unauthorized UPDATE';
  delete from public.project_files where storage_path='valid';
  get diagnostics n=row_count; assert n=0,'Unauthorized DELETE';
  begin
   perform public.create_organization_invitation('00000000-0000-0000-0000-000000000001','denied@example.invalid','admin');
   raise exception 'Nonowner invitation accepted %',identity;
  exception when insufficient_privilege then null; end;
  begin
   perform public.revoke_organization_invitation('00000000-0000-0000-0000-000000000401');
   raise exception 'Nonowner revocation accepted %',identity;
  exception when insufficient_privilege then null; end;
 end loop;
end $$;
-- Member can create/update own B file but cannot delete or invite in B.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000106',true);
do $$ begin
 begin
  perform public.create_organization_invitation('00000000-0000-0000-0000-000000000001','admin-denied@example.invalid','member');
  raise exception 'Admin invitation accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform public.revoke_organization_invitation('00000000-0000-0000-0000-000000000401');
  raise exception 'Admin revocation accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
do $$ declare n integer; begin
 insert into public.project_files(user_id,organization_id,project_id,name,storage_path,file_size)
 values(auth.uid(),'00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000202','member','member-b',1);
 update public.project_files set name='member-updated' where storage_path='member-b';
 get diagnostics n=row_count; assert n=1;
 delete from public.project_files where storage_path='member-b';
 get diagnostics n=row_count; assert n=0,'Member delete privilege must not broaden';
 begin
  perform public.create_organization_invitation('00000000-0000-0000-0000-000000000002','denied@example.invalid','admin');
  raise exception 'Member invited';
 exception when insufficient_privilege then null; end;
end $$;
-- Actual storage policies remain owner-prefix and parent-permission scoped.
insert into storage.objects(bucket_id,name) values('project-files','00000000-0000-0000-0000-000000000101/00000000-0000-0000-0000-000000000201/fixture.dxf');
do $$ declare n integer; begin
 assert (select count(*) from storage.objects)=1;
 update storage.objects set name='00000000-0000-0000-0000-000000000101/00000000-0000-0000-0000-000000000201/renamed.dxf';
 get diagnostics n=row_count; assert n=1;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
do $$ begin
 assert (select count(*) from storage.objects)=0,'Storage other user denied';
 begin
  insert into storage.objects(bucket_id,name) values('project-files','00000000-0000-0000-0000-000000000102/00000000-0000-0000-0000-000000000201/denied.dxf');
  raise exception 'Cross-tenant storage INSERT accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
delete from storage.objects;
-- Authorized owner invitation and audit behavior preserved.
select public.create_organization_invitation('00000000-0000-0000-0000-000000000001','allowed@example.invalid','member');
select public.revoke_organization_invitation('00000000-0000-0000-0000-000000000401');
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 assert (select count(*) from public.project_files)=0;
 begin
  perform public.create_organization_invitation('00000000-0000-0000-0000-000000000001','denied@example.invalid','member');
  raise exception 'Missing identity invited';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 assert (select count(*) from public.project_files where storage_path='inconsistent')=1,'No historical data deletion';
 assert (select count(*) from public.activity_events where action='invitation_revoked')=1,'Owner revocation audited';
 assert (select relrowsecurity and relforcerowsecurity from pg_class where oid='public.project_files'::regclass),'RLS stays forced';
end $$;
set local role anon;
do $$ begin
 begin perform * from public.project_files; raise exception 'Anon file access'; exception when insufficient_privilege then null; end;
 begin perform public.create_organization_invitation('00000000-0000-0000-0000-000000000001','denied@example.invalid','member'); raise exception 'Anon RPC'; exception when insufficient_privilege then null; end;
end $$;
rollback;
