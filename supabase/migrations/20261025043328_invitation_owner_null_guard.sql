-- NULL membership is not an owner. Preserve signatures, ACLs, audit and invitation behavior.
begin;

do $$ begin
  if to_regprocedure('public.create_organization_invitation(uuid,text,text)') is null
     or to_regprocedure('public.revoke_organization_invitation(uuid)') is null then
    raise exception 'Expected invitation functions missing; review schema before applying security correction';
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.create_organization_invitation(target_organization uuid, target_email text, target_role text)
 RETURNS public.organization_invitations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare caller_role text; normalized_email text; invitation public.organization_invitations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  caller_role := private.member_role(target_organization);
  if caller_role is distinct from 'owner' then raise exception 'Only organization owners may invite members' using errcode='42501'; end if;
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
$function$;

CREATE OR REPLACE FUNCTION public.revoke_organization_invitation(target_invitation uuid)
 RETURNS public.organization_invitations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare invitation public.organization_invitations;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into invitation from public.organization_invitations where id=target_invitation for update;
  if invitation.id is null then raise exception 'Invitation not found' using errcode='P0002'; end if;
  if private.member_role(invitation.organization_id) is distinct from 'owner' then raise exception 'Only organization owners may revoke invitations' using errcode='42501'; end if;
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
$function$;

commit;
