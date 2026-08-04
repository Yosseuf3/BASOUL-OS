-- YOSSEUF OS v3.1.0: organization and RBAC foundation.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_memberships_user_active_idx
  on public.organization_memberships (user_id, organization_id) where status = 'active';

create or replace function private.role_rank(role_name text)
returns integer language sql immutable parallel safe
set search_path = ''
as $$ select case role_name when 'owner' then 40 when 'admin' then 30 when 'member' then 20 when 'viewer' then 10 else 0 end $$;

create or replace function private.member_role(target_organization uuid)
returns text language sql stable security definer
set search_path = ''
as $$
  select membership.role
  from public.organization_memberships membership
  where membership.organization_id = target_organization
    and membership.user_id = (select auth.uid())
    and membership.status = 'active'
$$;

create or replace function private.has_permission(target_organization uuid, permission_name text)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select case permission_name
    when 'read' then private.role_rank(private.member_role(target_organization)) >= 10
    when 'create' then private.role_rank(private.member_role(target_organization)) >= 20
    when 'update' then private.role_rank(private.member_role(target_organization)) >= 20
    when 'delete' then private.role_rank(private.member_role(target_organization)) >= 30
    when 'manage_members' then private.role_rank(private.member_role(target_organization)) >= 30
    when 'manage_organization' then private.role_rank(private.member_role(target_organization)) >= 40
    else false
  end
$$;

revoke all on function private.role_rank(text) from public, anon, authenticated;
revoke all on function private.member_role(uuid) from public, anon, authenticated;
revoke all on function private.has_permission(uuid, text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.member_role(uuid), private.has_permission(uuid, text) to authenticated;

create or replace function private.protect_last_owner()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active')
     and not exists (
       select 1 from public.organization_memberships other
       where other.organization_id = old.organization_id
         and other.user_id <> old.user_id
         and other.role = 'owner' and other.status = 'active'
     ) then
    raise exception 'An organization must retain at least one active owner' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end
$$;

drop trigger if exists organization_memberships_protect_last_owner on public.organization_memberships;
create trigger organization_memberships_protect_last_owner
before update or delete on public.organization_memberships
for each row execute function private.protect_last_owner();

create or replace function public.create_organization(organization_name text, organization_slug text)
returns public.organizations language plpgsql security definer
set search_path = ''
as $$
declare created public.organizations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.organizations(name, slug, created_by)
    values (trim(organization_name), lower(trim(organization_slug)), (select auth.uid())) returning * into created;
  insert into public.organization_memberships(organization_id, user_id, role, status, invited_by)
    values (created.id, (select auth.uid()), 'owner', 'active', (select auth.uid()));
  return created;
end
$$;

create or replace function public.set_organization_membership(
  target_organization uuid, target_user uuid, target_role text, target_status text default 'active'
) returns public.organization_memberships language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; changed public.organization_memberships;
begin
  caller_role := private.member_role(target_organization);
  if private.role_rank(caller_role) < 30 then raise exception 'Insufficient membership permission' using errcode = '42501'; end if;
  if target_role not in ('owner','admin','member','viewer') or target_status not in ('active','invited','suspended') then
    raise exception 'Invalid membership role or status' using errcode = '22023';
  end if;
  if caller_role <> 'owner' and target_role in ('owner','admin') then
    raise exception 'Only owners may manage privileged memberships' using errcode = '42501';
  end if;
  insert into public.organization_memberships(organization_id,user_id,role,status,invited_by)
  values(target_organization,target_user,target_role,target_status,(select auth.uid()))
  on conflict (organization_id,user_id) do update set role=excluded.role,status=excluded.status,updated_at=now()
  returning * into changed;
  return changed;
end
$$;

create or replace function public.remove_organization_membership(target_organization uuid, target_user uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; target_member_role text;
begin
  caller_role := private.member_role(target_organization);
  select role into target_member_role from public.organization_memberships
    where organization_id=target_organization and user_id=target_user;
  if private.role_rank(caller_role) < 30 then raise exception 'Insufficient membership permission' using errcode='42501'; end if;
  if caller_role <> 'owner' and target_member_role in ('owner','admin') then
    raise exception 'Only owners may remove privileged memberships' using errcode='42501';
  end if;
  delete from public.organization_memberships where organization_id=target_organization and user_id=target_user;
end
$$;

revoke all on function public.create_organization(text,text) from public, anon;
revoke all on function public.set_organization_membership(uuid,uuid,text,text) from public, anon;
revoke all on function public.remove_organization_membership(uuid,uuid) from public, anon;
grant execute on function public.create_organization(text,text) to authenticated;
grant execute on function public.set_organization_membership(uuid,uuid,text,text) to authenticated;
grant execute on function public.remove_organization_membership(uuid,uuid) to authenticated;

create or replace function public.ensure_personal_organization()
returns uuid language plpgsql security definer
set search_path = ''
as $$
declare target uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select organization_id into target from public.organization_memberships
    where user_id=(select auth.uid()) and status='active' order by created_at limit 1;
  if target is null then
    select (public.create_organization(
      coalesce(nullif(split_part((select email from auth.users where id=(select auth.uid())),'@',1),''),'Personal workspace'),
      'personal-' || replace((select auth.uid())::text,'-','')
    )).id into target;
  end if;
  return target;
end
$$;
revoke all on function public.ensure_personal_organization() from public, anon;
grant execute on function public.ensure_personal_organization() to authenticated;

create or replace function private.default_organization_id()
returns uuid language sql stable security definer
set search_path = ''
as $$ select organization_id from public.organization_memberships where user_id=(select auth.uid()) and status='active' order by created_at limit 1 $$;
revoke all on function private.default_organization_id() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'projects','tasks','clients','content_items','knowledge_items','finance_transactions',
    'activity_events','notifications','architectural_drawings','architectural_reviews',
    'architectural_review_findings','architectural_analysis_runs','architectural_plan_elements',
    'architectural_review_comments','project_files','project_notes'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I add column if not exists organization_id uuid references public.organizations(id) on delete restrict', table_name);
      execute format('alter table public.%I alter column organization_id set default private.default_organization_id()', table_name);
    end if;
  end loop;
end $$;

-- Existing single-user rows become an owner-controlled personal organization.
create temporary table iam_legacy_users(user_id uuid primary key) on commit drop;
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'projects','tasks','clients','content_items','knowledge_items','finance_transactions',
    'activity_events','notifications','architectural_drawings','architectural_reviews',
    'architectural_review_findings','architectural_analysis_runs','architectural_plan_elements',
    'architectural_review_comments','project_files','project_notes'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('insert into iam_legacy_users(user_id) select distinct user_id from public.%I where user_id is not null on conflict do nothing', table_name);
    end if;
  end loop;
end $$;

insert into public.organizations(name,slug,created_by)
select coalesce(nullif(split_part(u.email,'@',1),''),'Personal workspace'),
       'personal-' || replace(u.id::text,'-',''), u.id
from auth.users u join iam_legacy_users legacy on legacy.user_id=u.id
where not exists (select 1 from public.organizations o where o.created_by=u.id);

insert into public.organization_memberships(organization_id,user_id,role,status,invited_by)
select o.id,o.created_by,'owner','active',o.created_by from public.organizations o
on conflict (organization_id,user_id) do nothing;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'projects','tasks','clients','content_items','knowledge_items','finance_transactions',
    'activity_events','notifications','architectural_drawings','architectural_reviews',
    'architectural_review_findings','architectural_analysis_runs','architectural_plan_elements',
    'architectural_review_comments','project_files','project_notes'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('update public.%I target set organization_id=o.id from public.organizations o where target.organization_id is null and o.created_by=target.user_id', table_name);
      execute format('alter table public.%I alter column organization_id set not null', table_name);
      execute format('create index if not exists %I on public.%I(organization_id)', table_name || '_organization_idx', table_name);
    end if;
  end loop;
end $$;

commit;
