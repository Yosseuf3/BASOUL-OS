-- YOSSEUF OS v0.1.0 — Fresh installation schema
create extension if not exists "pgcrypto";

do $$ begin
  create type project_status as enum ('Planning','Active','On Hold','Completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('Low','Medium','High','Critical');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status project_status not null default 'Planning',
  priority priority_level not null default 'Medium',
  progress integer not null default 0 check (progress between 0 and 100),
  client_name text,
  area text,
  start_date date,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_date_order check (due_date is null or start_date is null or due_date >= start_date)
);

alter table public.projects add column if not exists client_name text;
alter table public.projects add column if not exists updated_at timestamptz not null default now();
alter table public.projects enable row level security;

drop policy if exists "Users manage own projects" on public.projects;
create policy "Users manage own projects"
on public.projects
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_user_status_idx on public.projects(user_id, status);
create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- Tasks module — v0.3.0
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  status text not null default 'To Do' check (status in ('To Do','In Progress','Review','Done')),
  priority priority_level not null default 'Medium',
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks" on public.tasks for all to authenticated
using (auth.uid() = user_id and exists (select 1 from public.projects p where p.id = tasks.project_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.projects p where p.id = tasks.project_id and p.user_id = auth.uid()));
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
