-- BASOUL administration boundaries. Staging rollout is required before promotion.
begin;

alter table public.organizations force row level security;
alter table public.organization_memberships force row level security;

drop policy if exists organizations_update_admin on public.organizations;
drop policy if exists organizations_update_owner on public.organizations;
create policy organizations_update_owner on public.organizations for update to authenticated
  using (private.has_permission(id, 'manage_organization'))
  with check (private.has_permission(id, 'manage_organization'));

create or replace function private.record_administration_event(
  target_organization uuid, event_action text, target_user uuid, event_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.activity_events(organization_id,user_id,module,action,entity_id,title,description,metadata)
  values(target_organization,(select auth.uid()),'administration',event_action,target_user,
    'Organization membership administration',null,
    jsonb_build_object('target_user_id',target_user) || coalesce(event_metadata,'{}'::jsonb));
end
$$;
revoke all on function private.record_administration_event(uuid,text,uuid,jsonb) from public,anon,authenticated;

create or replace function public.set_organization_membership(
  target_organization uuid, target_user uuid, target_role text, target_status text default 'active'
) returns public.organization_memberships language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; existing_role text; changed public.organization_memberships;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  select role into existing_role from public.organization_memberships
    where organization_id=target_organization and user_id=target_user;
  if private.role_rank(caller_role) < 30 then raise exception 'Insufficient membership permission' using errcode='42501'; end if;
  if target_role not in ('owner','admin','member','viewer') or target_status not in ('active','invited','suspended') then
    raise exception 'Invalid membership role or status' using errcode='22023';
  end if;
  if target_user=(select auth.uid()) and private.role_rank(target_role)>private.role_rank(caller_role) then
    raise exception 'Users cannot escalate their own role' using errcode='42501';
  end if;
  if caller_role <> 'owner' and (target_role in ('owner','admin') or existing_role in ('owner','admin')) then
    raise exception 'Only owners may manage privileged memberships' using errcode='42501';
  end if;
  insert into public.organization_memberships(organization_id,user_id,role,status,invited_by)
  values(target_organization,target_user,target_role,target_status,(select auth.uid()))
  on conflict (organization_id,user_id) do update
    set role=excluded.role,status=excluded.status,updated_at=now()
  returning * into changed;
  perform private.record_administration_event(target_organization,'membership_changed',target_user,
    jsonb_build_object('previous_role',existing_role,'role',target_role,'status',target_status));
  return changed;
end
$$;

create or replace function public.remove_organization_membership(target_organization uuid, target_user uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; target_member_role text;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  select role into target_member_role from public.organization_memberships
    where organization_id=target_organization and user_id=target_user;
  if private.role_rank(caller_role) < 30 then raise exception 'Insufficient membership permission' using errcode='42501'; end if;
  if caller_role <> 'owner' and target_member_role in ('owner','admin') then
    raise exception 'Only owners may remove privileged memberships' using errcode='42501';
  end if;
  delete from public.organization_memberships where organization_id=target_organization and user_id=target_user;
  perform private.record_administration_event(target_organization,'membership_removed',target_user,
    jsonb_build_object('previous_role',target_member_role));
end
$$;

revoke all on function public.set_organization_membership(uuid,uuid,text,text) from public,anon;
revoke all on function public.remove_organization_membership(uuid,uuid) from public,anon;
grant execute on function public.set_organization_membership(uuid,uuid,text,text) to authenticated;
grant execute on function public.remove_organization_membership(uuid,uuid) to authenticated;

commit;

