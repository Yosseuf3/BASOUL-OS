-- BASOUL Phase 8: secure member invitations and server-authorized admin operations.
begin;

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and char_length(email) between 3 and 320),
  target_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('viewer','member','admin')),
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, email) where status='pending';
create index organization_invitations_target_user_idx
  on public.organization_invitations(target_user_id) where target_user_id is not null;
create index organization_invitations_expires_idx
  on public.organization_invitations(expires_at) where status='pending';

alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;
revoke all on public.organization_invitations from public, anon, authenticated;
grant all on public.organization_invitations to service_role;

create or replace function public.create_organization_invitation(
  target_organization uuid, target_email text, target_role text
) returns public.organization_invitations language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; normalized_email text; invitation public.organization_invitations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  if private.role_rank(caller_role) < 30 then raise exception 'Insufficient invitation permission' using errcode='42501'; end if;
  if target_role not in ('viewer','member','admin') then raise exception 'Owner invitations are not allowed' using errcode='42501'; end if;
  normalized_email := lower(trim(target_email));
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Invalid invitation email' using errcode='22023';
  end if;
  if exists (
    select 1 from public.organization_memberships membership
    join auth.users target on target.id=membership.user_id
    where membership.organization_id=target_organization and lower(target.email)=normalized_email
      and membership.status='active'
  ) then raise exception 'Active membership already exists' using errcode='23505'; end if;

  update public.organization_invitations set status='expired',updated_at=now()
    where organization_id=target_organization and email=normalized_email
      and status='pending' and expires_at<=now();
  select * into invitation from public.organization_invitations
    where organization_id=target_organization and email=normalized_email and status='pending';
  if invitation.id is not null then
    update public.organization_invitations set role=target_role,expires_at=now()+interval '7 days',updated_at=now()
      where id=invitation.id returning * into invitation;
    return invitation;
  end if;
  insert into public.organization_invitations(organization_id,email,role,invited_by)
    values(target_organization,normalized_email,target_role,(select auth.uid())) returning * into invitation;
  return invitation;
end
$$;

create or replace function public.attach_organization_invitation(
  target_invitation uuid, target_user uuid
) returns public.organization_memberships language plpgsql security definer
set search_path = ''
as $$
declare invitation public.organization_invitations; target_email text; changed public.organization_memberships;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into invitation from public.organization_invitations where id=target_invitation for update;
  if invitation.id is null or invitation.status<>'pending' or invitation.expires_at<=now() then
    raise exception 'Invitation is not pending' using errcode='22023';
  end if;
  if not private.has_permission(invitation.organization_id,'manage_members') then
    raise exception 'Insufficient invitation permission' using errcode='42501';
  end if;
  select lower(email) into target_email from auth.users where id=target_user;
  if target_email is null or target_email<>invitation.email then
    raise exception 'Invitation identity mismatch' using errcode='42501';
  end if;
  if exists(select 1 from public.organization_memberships where organization_id=invitation.organization_id and user_id=target_user and status='active') then
    raise exception 'Active membership already exists' using errcode='23505';
  end if;
  insert into public.organization_memberships(organization_id,user_id,role,status,invited_by)
    values(invitation.organization_id,target_user,invitation.role,'invited',(select auth.uid()))
  on conflict(organization_id,user_id) do update set role=excluded.role,status='invited',invited_by=excluded.invited_by,updated_at=now()
  returning * into changed;
  update public.organization_invitations set target_user_id=target_user,updated_at=now() where id=invitation.id;
  perform private.record_administration_event(invitation.organization_id,'member_invited',target_user,
    jsonb_build_object('invitation_id',invitation.id,'target_email',invitation.email,'role',invitation.role));
  return changed;
end
$$;

create or replace function public.accept_organization_invitations()
returns integer language plpgsql security definer
set search_path = ''
as $$
declare caller uuid; caller_email text; accepted_count integer;
begin
  caller := (select auth.uid());
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select lower(email) into caller_email from auth.users where id=caller;
  update public.organization_invitations set status='expired',updated_at=now()
    where status='pending' and expires_at<=now() and email=caller_email;
  with accepted as (
    update public.organization_invitations set status='accepted',target_user_id=caller,accepted_at=now(),updated_at=now()
      where status='pending' and expires_at>now() and email=caller_email returning organization_id,role,invited_by
  ), activated as (
    insert into public.organization_memberships(organization_id,user_id,role,status,invited_by)
      select organization_id,caller,role,'active',invited_by from accepted
    on conflict(organization_id,user_id) do update set status='active',role=excluded.role,updated_at=now()
    returning 1
  ) select count(*)::integer into accepted_count from activated;
  return accepted_count;
end
$$;

create or replace function public.change_organization_member_role(
  target_organization uuid, target_user uuid, target_role text
) returns public.organization_memberships language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; existing_role text; changed public.organization_memberships;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  if private.role_rank(caller_role)<30 then raise exception 'Insufficient membership permission' using errcode='42501'; end if;
  if target_role not in ('viewer','member','admin') then raise exception 'Owner promotion requires a protected ownership workflow' using errcode='42501'; end if;
  select role into existing_role from public.organization_memberships
    where organization_id=target_organization and user_id=target_user and status='active';
  if existing_role is null then raise exception 'Active membership not found' using errcode='P0002'; end if;
  if existing_role='owner' then raise exception 'Owner roles cannot be changed through member administration' using errcode='42501'; end if;
  if target_user=(select auth.uid()) and private.role_rank(target_role)>private.role_rank(existing_role) then
    raise exception 'Users cannot escalate their own role' using errcode='42501';
  end if;
  update public.organization_memberships set role=target_role,updated_at=now()
    where organization_id=target_organization and user_id=target_user returning * into changed;
  perform private.record_administration_event(target_organization,'role_changed',target_user,
    jsonb_build_object('previous_role',existing_role,'role',target_role));
  return changed;
end
$$;

create or replace function public.deactivate_organization_member(target_organization uuid,target_user uuid)
returns public.organization_memberships language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; target_role text; changed public.organization_memberships;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  if private.role_rank(caller_role)<30 then raise exception 'Insufficient membership permission' using errcode='42501'; end if;
  select role into target_role from public.organization_memberships where organization_id=target_organization and user_id=target_user and status='active';
  if target_role is null then return null; end if;
  if target_role='owner' and caller_role<>'owner' then raise exception 'Admins cannot modify owners' using errcode='42501'; end if;
  update public.organization_memberships set status='suspended',updated_at=now()
    where organization_id=target_organization and user_id=target_user returning * into changed;
  perform private.record_administration_event(target_organization,'member_deactivated',target_user,jsonb_build_object('role',target_role));
  return changed;
end
$$;

create or replace function public.revoke_organization_invitation(target_invitation uuid)
returns public.organization_invitations language plpgsql security definer
set search_path = ''
as $$
declare invitation public.organization_invitations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into invitation from public.organization_invitations where id=target_invitation for update;
  if invitation.id is null then raise exception 'Invitation not found' using errcode='P0002'; end if;
  if not private.has_permission(invitation.organization_id,'manage_members') then raise exception 'Insufficient invitation permission' using errcode='42501'; end if;
  if invitation.status='revoked' then return invitation; end if;
  if invitation.status<>'pending' then raise exception 'Only pending invitations can be revoked' using errcode='22023'; end if;
  update public.organization_invitations set status='revoked',revoked_at=now(),updated_at=now()
    where id=invitation.id returning * into invitation;
  delete from public.organization_memberships where organization_id=invitation.organization_id
    and user_id=invitation.target_user_id and status='invited';
  perform private.record_administration_event(invitation.organization_id,'invitation_revoked',invitation.target_user_id,
    jsonb_build_object('invitation_id',invitation.id,'target_email',invitation.email,'role',invitation.role));
  return invitation;
end
$$;

revoke all on function public.create_organization_invitation(uuid,text,text) from public,anon;
revoke all on function public.attach_organization_invitation(uuid,uuid) from public,anon;
revoke all on function public.accept_organization_invitations() from public,anon;
revoke all on function public.change_organization_member_role(uuid,uuid,text) from public,anon;
revoke all on function public.deactivate_organization_member(uuid,uuid) from public,anon;
revoke all on function public.revoke_organization_invitation(uuid) from public,anon;
grant execute on function public.create_organization_invitation(uuid,text,text) to authenticated;
grant execute on function public.attach_organization_invitation(uuid,uuid) to authenticated;
grant execute on function public.accept_organization_invitations() to authenticated;
grant execute on function public.change_organization_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.deactivate_organization_member(uuid,uuid) to authenticated;
grant execute on function public.revoke_organization_invitation(uuid) to authenticated;

commit;
