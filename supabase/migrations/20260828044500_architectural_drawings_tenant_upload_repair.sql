-- BASOUL: bind architectural drawing persistence and storage access to the selected project's organization.

alter table public.architectural_drawings
  alter column organization_id drop default;

alter table public.architectural_drawings enable row level security;
alter table public.architectural_drawings force row level security;

drop policy if exists architectural_drawings_org_select on public.architectural_drawings;
drop policy if exists architectural_drawings_org_insert on public.architectural_drawings;
drop policy if exists architectural_drawings_org_update on public.architectural_drawings;
drop policy if exists architectural_drawings_org_delete on public.architectural_drawings;

create policy architectural_drawings_org_select on public.architectural_drawings
for select to authenticated
using (
  private.has_permission(organization_id,'read')
  and exists (
    select 1 from public.projects p
    where p.id = architectural_drawings.project_id
      and p.organization_id = architectural_drawings.organization_id
  )
);

create policy architectural_drawings_org_insert on public.architectural_drawings
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.has_permission(organization_id,'create')
  and exists (
    select 1 from public.projects p
    where p.id = architectural_drawings.project_id
      and p.organization_id = architectural_drawings.organization_id
  )
);

create policy architectural_drawings_org_update on public.architectural_drawings
for update to authenticated
using (
  private.has_permission(organization_id,'update')
  and exists (
    select 1 from public.projects p
    where p.id = architectural_drawings.project_id
      and p.organization_id = architectural_drawings.organization_id
  )
)
with check (
  user_id = (select auth.uid())
  and private.has_permission(organization_id,'update')
  and exists (
    select 1 from public.projects p
    where p.id = architectural_drawings.project_id
      and p.organization_id = architectural_drawings.organization_id
  )
);

create policy architectural_drawings_org_delete on public.architectural_drawings
for delete to authenticated
using (
  private.has_permission(organization_id,'delete')
  and exists (
    select 1 from public.projects p
    where p.id = architectural_drawings.project_id
      and p.organization_id = architectural_drawings.organization_id
  )
);

revoke all on table public.architectural_drawings from anon;
revoke all on table public.architectural_drawings from authenticated;
grant select, insert, update, delete on table public.architectural_drawings to authenticated;

drop policy if exists architectural_storage_select_own on storage.objects;
drop policy if exists architectural_storage_insert_own on storage.objects;
drop policy if exists architectural_storage_update_own on storage.objects;
drop policy if exists architectural_storage_delete_own on storage.objects;

create policy architectural_storage_select_own on storage.objects
for select to authenticated
using (
  bucket_id='architectural-drawings'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'read')
  )
);

create policy architectural_storage_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id='architectural-drawings'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'create')
  )
);

create policy architectural_storage_update_own on storage.objects
for update to authenticated
using (
  bucket_id='architectural-drawings'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'update')
  )
)
with check (
  bucket_id='architectural-drawings'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'update')
  )
);

create policy architectural_storage_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id='architectural-drawings'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'delete')
  )
);
