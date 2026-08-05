-- YOSSEUF Platform v4.0.0-rc.1 organization workspace foundation.
-- Migration artifact only: validate on Staging before any separately approved Production application.
begin;

create table if not exists public.organization_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active','archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists organization_workspaces_organization_idx on public.organization_workspaces(organization_id, created_at);
create index if not exists organization_workspaces_owner_idx on public.organization_workspaces(owner_id);
alter table public.organization_workspaces enable row level security;
alter table public.organization_workspaces force row level security;

drop policy if exists organization_workspaces_select on public.organization_workspaces;
drop policy if exists organization_workspaces_insert on public.organization_workspaces;
drop policy if exists organization_workspaces_update on public.organization_workspaces;
drop policy if exists organization_workspaces_delete on public.organization_workspaces;
create policy organization_workspaces_select on public.organization_workspaces for select to authenticated
  using (private.has_permission(organization_id,'read'));
create policy organization_workspaces_insert on public.organization_workspaces for insert to authenticated
  with check (private.has_permission(organization_id,'create') and owner_id=(select auth.uid()));
create policy organization_workspaces_update on public.organization_workspaces for update to authenticated
  using (private.has_permission(organization_id,'update'))
  with check (private.has_permission(organization_id,'update'));
create policy organization_workspaces_delete on public.organization_workspaces for delete to authenticated
  using (private.has_permission(organization_id,'delete'));

grant select,insert,update,delete on public.organization_workspaces to authenticated;
revoke all on public.organization_workspaces from anon;

commit;
