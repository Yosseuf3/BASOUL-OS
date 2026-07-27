-- YOSSEUF OS v3.0.0-alpha.5 — private architectural drawings and revisions

create table if not exists public.architectural_drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  format text not null check (format in ('pdf', 'image')),
  revision text not null default 'A',
  storage_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
  page_count integer check (page_count is null or page_count > 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, revision, name)
);

create index if not exists architectural_drawings_user_project_idx
  on public.architectural_drawings (user_id, project_id, created_at desc);

alter table public.architectural_drawings enable row level security;

drop policy if exists "architectural_drawings_select_own" on public.architectural_drawings;
create policy "architectural_drawings_select_own"
  on public.architectural_drawings for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "architectural_drawings_insert_own" on public.architectural_drawings;
create policy "architectural_drawings_insert_own"
  on public.architectural_drawings for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = project_id and projects.user_id = (select auth.uid())
    )
  );

drop policy if exists "architectural_drawings_update_own" on public.architectural_drawings;
create policy "architectural_drawings_update_own"
  on public.architectural_drawings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "architectural_drawings_delete_own" on public.architectural_drawings;
create policy "architectural_drawings_delete_own"
  on public.architectural_drawings for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.architectural_drawings to authenticated;
revoke all on public.architectural_drawings from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'architectural-drawings',
  'architectural-drawings',
  false,
  52428800,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "architectural_storage_select_own" on storage.objects;
create policy "architectural_storage_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'architectural-drawings'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "architectural_storage_insert_own" on storage.objects;
create policy "architectural_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'architectural-drawings'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "architectural_storage_delete_own" on storage.objects;
create policy "architectural_storage_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'architectural-drawings'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
