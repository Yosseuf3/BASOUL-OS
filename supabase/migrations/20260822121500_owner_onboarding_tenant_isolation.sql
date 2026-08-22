-- BASOUL v4.0.1: explicit owner onboarding and tenant-isolation boundary.
-- Migration artifact only. Validate on Staging before any separately approved Production application.
begin;

create table if not exists public.organization_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  legal_name text,
  country_code text not null default 'SA' check (char_length(country_code) = 2),
  region text,
  city text,
  address_line text,
  phone text,
  contact_email text,
  tax_number text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_profiles enable row level security;
alter table public.organization_profiles force row level security;
revoke all on public.organization_profiles from public, anon;
grant select, insert, update on public.organization_profiles to authenticated;

drop policy if exists organization_profiles_select on public.organization_profiles;
drop policy if exists organization_profiles_insert_owner on public.organization_profiles;
drop policy if exists organization_profiles_update_owner on public.organization_profiles;
create policy organization_profiles_select on public.organization_profiles for select to authenticated
  using (private.has_permission(organization_id, 'read'));
create policy organization_profiles_insert_owner on public.organization_profiles for insert to authenticated
  with check (private.member_role(organization_id) = 'owner');
create policy organization_profiles_update_owner on public.organization_profiles for update to authenticated
  using (private.member_role(organization_id) = 'owner')
  with check (private.member_role(organization_id) = 'owner');

create or replace function public.create_owned_organization(
  organization_name text,
  organization_slug text,
  profile_legal_name text default null,
  profile_country_code text default 'SA',
  profile_region text default null,
  profile_city text default null,
  profile_address_line text default null,
  profile_phone text default null,
  profile_contact_email text default null,
  profile_tax_number text default null
) returns uuid language plpgsql security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  created public.organizations;
  pending_count integer;
  active_count integer;
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select count(*) into active_count from public.organization_memberships
    where user_id=caller and status='active';
  if active_count > 0 then
    raise exception 'User already belongs to an active organization' using errcode='23505';
  end if;

  select count(*) into pending_count from public.organization_invitations invitation
    join auth.users account on lower(account.email)=invitation.email
    where account.id=caller and invitation.status='pending' and invitation.expires_at>now();
  if pending_count > 0 then
    raise exception 'Pending organization invitation must be accepted instead of creating a new organization' using errcode='42501';
  end if;

  insert into public.organizations(name, slug, created_by)
    values (trim(organization_name), lower(trim(organization_slug)), caller)
    returning * into created;
  insert into public.organization_memberships(organization_id,user_id,role,status,invited_by)
    values(created.id,caller,'owner','active',caller);
  insert into public.organization_profiles(
    organization_id,legal_name,country_code,region,city,address_line,phone,contact_email,tax_number,onboarding_completed_at
  ) values (
    created.id,nullif(trim(profile_legal_name),''),upper(trim(profile_country_code)),nullif(trim(profile_region),''),
    nullif(trim(profile_city),''),nullif(trim(profile_address_line),''),nullif(trim(profile_phone),''),
    nullif(lower(trim(profile_contact_email)),''),nullif(trim(profile_tax_number),''),now()
  );
  return created.id;
end
$$;
revoke all on function public.create_owned_organization(text,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.create_owned_organization(text,text,text,text,text,text,text,text,text,text) to authenticated;

-- A team invitation is an Owner authority. Admins may continue other delegated member operations,
-- but cannot originate or revoke invitations.
create or replace function public.create_organization_invitation(
  target_organization uuid, target_email text, target_role text
) returns public.organization_invitations language plpgsql security definer
set search_path = ''
as $$
declare caller_role text; normalized_email text; invitation public.organization_invitations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  if caller_role <> 'owner' then raise exception 'Only organization owners may invite members' using errcode='42501'; end if;
  if target_role not in ('viewer','member','admin') then raise exception 'Owner invitations are not allowed' using errcode='42501'; end if;
  normalized_email := lower(trim(target_email));
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Invalid invitation email' using errcode='22023'; end if;
  if exists (
    select 1 from public.organization_memberships membership join auth.users target on target.id=membership.user_id
    where membership.organization_id=target_organization and lower(target.email)=normalized_email and membership.status='active'
  ) then raise exception 'Active membership already exists' using errcode='23505'; end if;
  update public.organization_invitations set status='expired',updated_at=now()
    where organization_id=target_organization and email=normalized_email and status='pending' and expires_at<=now();
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

create or replace function public.revoke_organization_invitation(target_invitation uuid)
returns public.organization_invitations language plpgsql security definer
set search_path = ''
as $$
declare invitation public.organization_invitations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into invitation from public.organization_invitations where id=target_invitation for update;
  if invitation.id is null then raise exception 'Invitation not found' using errcode='P0002'; end if;
  if private.member_role(invitation.organization_id) <> 'owner' then raise exception 'Only organization owners may revoke invitations' using errcode='42501'; end if;
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

commit;
