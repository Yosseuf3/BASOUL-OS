begin;

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
using (
  private.has_permission(organization_id, 'read')
  and exists (
    select 1
    from public.projects p
    where p.id = architecture_scenes.project_id
      and p.organization_id = architecture_scenes.organization_id
  )
);

create policy architecture_scenes_org_insert
on public.architecture_scenes for insert to authenticated
with check (
  private.has_permission(organization_id, 'create')
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = architecture_scenes.project_id
      and p.organization_id = architecture_scenes.organization_id
  )
);

create policy architecture_scenes_org_update
on public.architecture_scenes for update to authenticated
using (
  private.has_permission(organization_id, 'update')
  and exists (
    select 1
    from public.projects p
    where p.id = architecture_scenes.project_id
      and p.organization_id = architecture_scenes.organization_id
  )
)
with check (
  private.has_permission(organization_id, 'update')
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = architecture_scenes.project_id
      and p.organization_id = architecture_scenes.organization_id
  )
);

create policy architecture_scenes_org_delete
on public.architecture_scenes for delete to authenticated
using (
  private.has_permission(organization_id, 'delete')
  and exists (
    select 1
    from public.projects p
    where p.id = architecture_scenes.project_id
      and p.organization_id = architecture_scenes.organization_id
  )
);

grant select, insert, update, delete on public.architecture_scenes to authenticated;
revoke all on public.architecture_scenes from anon;

create index if not exists architecture_scenes_org_project_idx
  on public.architecture_scenes (organization_id, project_id);

commit;
