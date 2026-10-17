-- PoC only. Not applied to any Supabase project.
-- Proposed tenant-scoped persistence for Pascal scene graphs.

create table if not exists public.architecture_scenes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null default 'Architecture scene',
  scene jsonb not null default '{"nodes":{},"rootNodeIds":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id)
);

alter table public.architecture_scenes enable row level security;
alter table public.architecture_scenes force row level security;

create policy architecture_scenes_org_select
on public.architecture_scenes for select to authenticated
using (private.has_permission(organization_id, 'read'));

create policy architecture_scenes_org_insert
on public.architecture_scenes for insert to authenticated
with check (
  private.has_permission(organization_id, 'create')
  and user_id = (select auth.uid())
);

-- Architecture scenes are organization-owned collaborative records. Unlike
-- personal rows, updates are authorized by organization permission, not by the
-- identity of the original creator.
create policy architecture_scenes_org_update
on public.architecture_scenes for update to authenticated
using (private.has_permission(organization_id, 'update'))
with check (private.has_permission(organization_id, 'update'));

create policy architecture_scenes_org_delete
on public.architecture_scenes for delete to authenticated
using (private.has_permission(organization_id, 'delete'));

-- Prevent a valid editor from moving a scene into another tenant/project or
-- rewriting creator ownership during an update.
create or replace function public.guard_architecture_scene_scope()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.project_id is distinct from old.project_id
     or new.user_id is distinct from old.user_id then
    raise exception 'architecture_scene_scope_immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.guard_architecture_scene_scope() from public;
grant execute on function public.guard_architecture_scene_scope() to authenticated;

drop trigger if exists architecture_scenes_guard_scope on public.architecture_scenes;
create trigger architecture_scenes_guard_scope
before update on public.architecture_scenes
for each row execute function public.guard_architecture_scene_scope();

grant select, insert, update, delete on public.architecture_scenes to authenticated;
revoke all on public.architecture_scenes from anon;

create index if not exists architecture_scenes_org_project_idx
  on public.architecture_scenes (organization_id, project_id);
