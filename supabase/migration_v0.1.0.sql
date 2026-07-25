-- Run this file once in Supabase SQL Editor for an EXISTING YOSSEUF OS database.
begin;

alter table public.projects
  add column if not exists updated_at timestamptz not null default now();

create index if not exists projects_user_status_idx on public.projects(user_id, status);
create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);

alter table public.projects enable row level security;

drop policy if exists "Users manage own projects" on public.projects;
create policy "Users manage own projects"
on public.projects
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

commit;
