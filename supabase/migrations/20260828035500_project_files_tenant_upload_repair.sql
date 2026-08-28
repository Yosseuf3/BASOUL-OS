-- BASOUL: repair Project Files persistence/storage drift and enforce project/organization integrity.
begin;

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 255),
  storage_path text not null unique,
  file_size bigint not null check (file_size >= 0 and file_size <= 104857600),
  mime_type text not null default 'application/octet-stream',
  category text not null default 'other' check (category in ('drawing','document','image','model','other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_files
  add column if not exists organization_id uuid references public.organizations(id) on delete restrict;

update public.project_files file
set organization_id = project.organization_id
from public.projects project
where file.organization_id is null
  and project.id = file.project_id;

alter table public.project_files alter column organization_id set not null;
create index if not exists project_files_project_created_idx on public.project_files(project_id, created_at desc);
create index if not exists project_files_user_idx on public.project_files(user_id, created_at desc);
create index if not exists project_files_organization_idx on public.project_files(organization_id);

alter table public.project_files enable row level security;
alter table public.project_files force row level security;

do $$
declare policy record;
begin
  for policy in select policyname from pg_policies where schemaname='public' and tablename='project_files' loop
    execute format('drop policy %I on public.project_files', policy.policyname);
  end loop;
end $$;

create policy project_files_org_select on public.project_files
for select to authenticated
using (
  private.has_permission(organization_id,'read')
  and exists (
    select 1 from public.projects project
    where project.id = project_id
      and project.organization_id = organization_id
  )
);

create policy project_files_org_insert on public.project_files
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.has_permission(organization_id,'create')
  and exists (
    select 1 from public.projects project
    where project.id = project_id
      and project.organization_id = organization_id
  )
);

create policy project_files_org_update on public.project_files
for update to authenticated
using (
  private.has_permission(organization_id,'update')
  and exists (
    select 1 from public.projects project
    where project.id = project_id
      and project.organization_id = organization_id
  )
)
with check (
  user_id = (select auth.uid())
  and private.has_permission(organization_id,'update')
  and exists (
    select 1 from public.projects project
    where project.id = project_id
      and project.organization_id = organization_id
  )
);

create policy project_files_org_delete on public.project_files
for delete to authenticated
using (
  private.has_permission(organization_id,'delete')
  and exists (
    select 1 from public.projects project
    where project.id = project_id
      and project.organization_id = organization_id
  )
);

revoke all on table public.project_files from anon;
revoke all on table public.project_files from authenticated;
grant select, insert, update, delete on table public.project_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files','project-files',false,104857600)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists project_file_storage_select_own on storage.objects;
drop policy if exists project_file_storage_insert_own on storage.objects;
drop policy if exists project_file_storage_update_own on storage.objects;
drop policy if exists project_file_storage_delete_own on storage.objects;

create policy project_file_storage_select_own on storage.objects
for select to authenticated
using (
  bucket_id='project-files'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects project
    where project.id::text=(storage.foldername(name))[2]
      and private.has_permission(project.organization_id,'read')
  )
);

create policy project_file_storage_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id='project-files'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects project
    where project.id::text=(storage.foldername(name))[2]
      and private.has_permission(project.organization_id,'create')
  )
);

create policy project_file_storage_update_own on storage.objects
for update to authenticated
using (
  bucket_id='project-files'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects project
    where project.id::text=(storage.foldername(name))[2]
      and private.has_permission(project.organization_id,'update')
  )
)
with check (
  bucket_id='project-files'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects project
    where project.id::text=(storage.foldername(name))[2]
      and private.has_permission(project.organization_id,'update')
  )
);

create policy project_file_storage_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id='project-files'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists (
    select 1 from public.projects project
    where project.id::text=(storage.foldername(name))[2]
      and private.has_permission(project.organization_id,'delete')
  )
);

commit;
