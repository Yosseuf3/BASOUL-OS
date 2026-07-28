-- YOSSEUF OS v3.0.0-beta.2
-- Project Document Control foundation.

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 255),
  storage_path text not null unique,
  file_size bigint not null check (file_size >= 0 and file_size <= 104857600),
  mime_type text not null default 'application/octet-stream',
  category text not null default 'other'
    check (category in ('drawing', 'document', 'image', 'model', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_files_project_created_idx
  on public.project_files (project_id, created_at desc);
create index if not exists project_files_user_idx
  on public.project_files (user_id, created_at desc);

alter table public.project_files enable row level security;

drop policy if exists "project_files_select_own" on public.project_files;
create policy "project_files_select_own"
  on public.project_files for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "project_files_insert_own" on public.project_files;
create policy "project_files_insert_own"
  on public.project_files for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects project
      where project.id = project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "project_files_update_own" on public.project_files;
create policy "project_files_update_own"
  on public.project_files for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "project_files_delete_own" on public.project_files;
create policy "project_files_delete_own"
  on public.project_files for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.project_files to authenticated;
revoke all on public.project_files from anon;

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 104857600)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "project_file_storage_select_own" on storage.objects;
create policy "project_file_storage_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "project_file_storage_insert_own" on storage.objects;
create policy "project_file_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "project_file_storage_delete_own" on storage.objects;
create policy "project_file_storage_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
