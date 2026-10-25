begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
do $$ begin
 assert (select count(*) from public.project_files)=2,'Original mismatch must be visible to dual member';
 insert into public.project_files(user_id,organization_id,project_id,name,storage_path,file_size)
 values(auth.uid(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000202','bad','reproduce',1);
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000104',true);
select public.create_organization_invitation('00000000-0000-0000-0000-000000000001','outsider-created@example.invalid','admin');
select public.revoke_organization_invitation('00000000-0000-0000-0000-000000000401');
rollback;
