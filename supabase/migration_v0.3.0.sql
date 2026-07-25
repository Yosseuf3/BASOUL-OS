-- YOSSEUF OS v0.3.0 — Tasks foundation (fixed)
-- Safe to run after v0.1.1, including when a partial tasks table already exists.
begin;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'To Do',
  priority priority_level not null default 'Medium',
  progress integer not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Repair an older or partial tasks table without deleting existing data.
alter table public.tasks
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists status text default 'To Do',
  add column if not exists priority priority_level default 'Medium',
  add column if not exists progress integer default 0,
  add column if not exists due_date date,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Normalize legacy rows before indexes and application reads.
update public.tasks
set
  status = coalesce(status, 'To Do'),
  priority = coalesce(priority, 'Medium'),
  progress = coalesce(progress, 0),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.tasks enable row level security;

drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks"
on public.tasks
for all
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.user_id = auth.uid()
  )
);

create index if not exists tasks_user_id_idx
  on public.tasks(user_id);

create index if not exists tasks_project_id_idx
  on public.tasks(project_id);

create index if not exists tasks_user_status_idx
  on public.tasks(user_id, status);

create index if not exists tasks_user_due_idx
  on public.tasks(user_id, due_date);

create index if not exists tasks_user_updated_idx
  on public.tasks(user_id, updated_at desc);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

commit;
