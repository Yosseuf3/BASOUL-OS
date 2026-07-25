-- Run once after migration_v0.1.0
begin;

alter table public.projects
  add column if not exists client_name text;

create index if not exists projects_user_client_idx
  on public.projects(user_id, client_name);

commit;
