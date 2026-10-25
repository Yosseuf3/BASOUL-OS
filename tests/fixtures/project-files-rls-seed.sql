create policy project_read on public.projects for select to authenticated using(private.has_permission(organization_id,'read'));
-- A=...001, B=...002; dual-tenant owner=...101, B owner=...102,
-- A viewer=...103, outsider=...104, suspended A member=...105.
insert into auth.users(id,email) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'synthetic-'||n||'@example.invalid' from generate_series(101,106) n;
insert into public.organizations values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.organization_memberships values
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','owner','active'),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000101','member','active'),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','owner','active'),
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','viewer','active'),
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000105','member','suspended'),
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000106','admin','active');
insert into public.projects values
 ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000001','Synthetic A'),
 ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000002','Synthetic B');
-- Deliberately inconsistent legacy row is seeded by local test administrator only.
insert into public.project_files(id,user_id,organization_id,project_id,name,storage_path,file_size) values
 ('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000201','valid','valid',1),
 ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000202','inconsistent','inconsistent',1);
revoke all on public.organization_invitations from public,anon,authenticated;
revoke all on function public.create_organization_invitation(uuid,text,text),public.revoke_organization_invitation(uuid) from public,anon;
grant execute on function public.create_organization_invitation(uuid,text,text),public.revoke_organization_invitation(uuid) to authenticated;
insert into public.organization_invitations(id,organization_id,email,role,invited_by) values
 ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000001','target@example.invalid','member','00000000-0000-0000-0000-000000000101');
