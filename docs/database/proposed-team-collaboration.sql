-- REVIEW CANDIDATE ONLY. No remote activation. Reuses the existing invitation API.
BEGIN;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_kind text;
-- Server-side listing uses one caller-authorized statement, rather than a
-- service-role read after an earlier HTTP membership check.
CREATE OR REPLACE FUNCTION public.organization_administration_state(target_organization uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR coalesce(private.member_role(target_organization),'') NOT IN ('owner','admin') THEN
  RAISE EXCEPTION 'Administrative membership required' USING ERRCODE='42501';
 END IF;
 RETURN jsonb_build_object(
  'invitations',coalesce((SELECT jsonb_agg(row_to_json(i)) FROM (
   SELECT id,email,target_user_id,role,status,expires_at,created_at,updated_at
   FROM public.organization_invitations WHERE organization_id=target_organization
   ORDER BY created_at DESC,id LIMIT 100) i),'[]'::jsonb),
  'members',coalesce((SELECT jsonb_agg(row_to_json(m)) FROM (
   SELECT organization_id,user_id,role,status,created_at,updated_at
   FROM public.organization_memberships WHERE organization_id=target_organization
   ORDER BY created_at,user_id) m),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.organization_administration_state(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.organization_administration_state(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.accept_organization_invitations()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE caller uuid; caller_email text; confirmed timestamptz;
 invitation public.organization_invitations; changed integer; accepted_count integer:=0;
BEGIN
 caller:=(SELECT auth.uid());
 IF caller IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT lower(email),email_confirmed_at INTO caller_email,confirmed FROM auth.users WHERE id=caller;
 IF caller_email IS NULL OR confirmed IS NULL THEN
  RAISE EXCEPTION 'Verified invitation identity required' USING ERRCODE='42501';
 END IF;
 UPDATE public.organization_invitations SET status='expired',updated_at=now()
 WHERE status='pending' AND expires_at<=now() AND email=caller_email;
 -- Same row lock as revoke/attach: an acceptance cannot race past a committed revocation.
 FOR invitation IN SELECT * FROM public.organization_invitations
  WHERE status='pending' AND expires_at>now() AND email=caller_email
   AND (target_user_id IS NULL OR target_user_id=caller)
  ORDER BY id FOR UPDATE
 LOOP
  INSERT INTO public.organization_memberships(organization_id,user_id,role,status,invited_by)
   VALUES(invitation.organization_id,caller,invitation.role,'active',invitation.invited_by)
  ON CONFLICT(organization_id,user_id) DO UPDATE SET status='active',role=excluded.role,
   invited_by=excluded.invited_by,updated_at=now()
   WHERE organization_memberships.status<>'active';
  GET DIAGNOSTICS changed=ROW_COUNT;
  UPDATE public.organization_invitations SET status='accepted',target_user_id=caller,
   accepted_at=now(),updated_at=now() WHERE id=invitation.id;
  IF changed=1 THEN
   PERFORM private.record_administration_event(invitation.organization_id,'membership_changed',caller,
    jsonb_build_object('event','invitation_accepted','invitation_id',invitation.id,'role',invitation.role));
   -- One inbox item per committed acceptance. A failed insert rolls back the
   -- acceptance and its audit; retries cannot duplicate an accepted invitation.
   INSERT INTO public.notifications(user_id,organization_id,activity_event_id,module,priority,title,message,entity_id,source_kind)
   SELECT invitation.invited_by,invitation.organization_id,e.id,'system','info',
    'قبول دعوة الفريق / Team invitation accepted',
    'انضم عضو إلى المؤسسة. / A member joined the organization.',caller,'membership'
   FROM public.activity_events e
   WHERE e.organization_id=invitation.organization_id AND e.action='membership_changed' AND e.metadata->>'event'='invitation_accepted'
    AND e.user_id=caller AND e.metadata->>'invitation_id'=invitation.id::text
    AND invitation.invited_by<>caller
    AND EXISTS(SELECT 1 FROM public.organization_memberships m
     WHERE m.organization_id=invitation.organization_id AND m.user_id=invitation.invited_by
      AND m.status='active' AND m.role='owner')
   ORDER BY e.created_at DESC,e.id LIMIT 1;
   accepted_count:=accepted_count+1;
  END IF;
 END LOOP;
 RETURN accepted_count;
END $$;
REVOKE ALL ON FUNCTION public.accept_organization_invitations() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitations() TO authenticated;
COMMIT;
