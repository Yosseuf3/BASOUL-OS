-- BASOUL: qualify storage.objects.name to avoid SQL name collision with project aliases.
begin;

drop policy if exists project_file_storage_select_own on storage.objects;
drop policy if exists project_file_storage_insert_own on storage.objects;
drop policy if exists project_file_storage_update_own on storage.objects;
drop policy if exists project_file_storage_delete_own on storage.objects;

create policy project_file_storage_select_own on storage.objects
for select to authenticated
using (
  bucket_id='project-files'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'read')
  )
);

create policy project_file_storage_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id='project-files'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'create')
  )
);

create policy project_file_storage_update_own on storage.objects
for update to authenticated
using (
  bucket_id='project-files'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'update')
  )
)
with check (
  bucket_id='project-files'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'update')
  )
);

create policy project_file_storage_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id='project-files'
  and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects p
    where p.id::text=(storage.foldername(storage.objects.name))[2]
      and private.has_permission(p.organization_id,'delete')
  )
);

commit;
