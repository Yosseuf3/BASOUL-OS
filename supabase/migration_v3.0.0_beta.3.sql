-- YOSSEUF OS v3.0.0-beta.3
-- Integrated Project Workspace: notes, meetings, reviews, and decisions.

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  project_file_id uuid references public.project_files(id) on delete set null,
  type text not null default 'general' check (type in ('decision', 'meeting', 'review', 'general')),
  title text not null check (char_length(title) between 1 and 180),
  content text,
  status text not null default 'open' check (status in ('open', 'done', 'archived')),
  assigned_to text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_notes_project_created_idx on public.project_notes (project_id, created_at desc);
create index if not exists project_notes_user_status_idx on public.project_notes (user_id, status, follow_up_date);
create index if not exists project_notes_file_idx on public.project_notes (project_file_id) where project_file_id is not null;

alter table public.project_notes enable row level security;

drop policy if exists "project_notes_select_own" on public.project_notes;
create policy "project_notes_select_own" on public.project_notes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "project_notes_insert_own" on public.project_notes;
create policy "project_notes_insert_own" on public.project_notes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  and (
    project_file_id is null
    or exists (
      select 1 from public.project_files f
      where f.id = project_file_id and f.project_id = project_id and f.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "project_notes_update_own" on public.project_notes;
create policy "project_notes_update_own" on public.project_notes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "project_notes_delete_own" on public.project_notes;
create policy "project_notes_delete_own" on public.project_notes for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.project_notes to authenticated;
revoke all on public.project_notes from anon;
