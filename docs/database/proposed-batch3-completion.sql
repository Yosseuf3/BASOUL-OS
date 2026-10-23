-- Local review candidate. Install after project and team candidates. No activation.
BEGIN;
CREATE OR REPLACE FUNCTION private.require_atomic_task_client()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND
  coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-basoul-task-create-contract' IS DISTINCT FROM 'atomic-source-v1'
  AND coalesce(current_setting('basoul.conversion_source',true),'')='' THEN
  RAISE EXCEPTION 'TASK_UPDATE_REQUIRED: حدّث التطبيق / Upgrade required for atomic task creation' USING ERRCODE='PT409';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS require_atomic_task_client ON public.tasks;
CREATE TRIGGER require_atomic_task_client BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION private.require_atomic_task_client();
REVOKE ALL ON FUNCTION private.require_atomic_task_client() FROM PUBLIC,anon,authenticated;

-- The modern graph remains canonical for new PDF/image records; a matching
-- legacy asset satisfies the historical review FK without dropping it.
-- Existing legacy-only drawings/findings and their task links are not rewritten.
CREATE OR REPLACE FUNCTION private.bridge_engineering_drawing()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE legacy record;
BEGIN
 IF to_regclass('public.drawing_assets') IS NULL THEN RETURN NEW; END IF;
 IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid()
  OR private.has_permission(NEW.organization_id,'create') IS NOT TRUE THEN
  RAISE EXCEPTION 'ENGINEERING_BRIDGE_FORBIDDEN' USING ERRCODE='42501'; END IF;
 SELECT * INTO legacy FROM public.drawing_assets WHERE id=NEW.id;
 IF FOUND THEN
  IF legacy.user_id IS DISTINCT FROM NEW.user_id OR legacy.project_id IS DISTINCT FROM NEW.project_id
   OR legacy.storage_path IS DISTINCT FROM NEW.storage_path OR legacy.format IS DISTINCT FROM NEW.format THEN
   RAISE EXCEPTION 'ENGINEERING_IDENTITY_COLLISION' USING ERRCODE='23514'; END IF;
 ELSE
  INSERT INTO public.drawing_assets(id,user_id,project_id,name,format,revision,storage_path,metadata)
  VALUES(NEW.id,NEW.user_id,NEW.project_id,NEW.name,NEW.format,NEW.revision,NEW.storage_path,
   jsonb_build_object('bridge','modern-pdf-image-v1'));
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS bridge_engineering_drawing ON public.architectural_drawings;
CREATE TRIGGER bridge_engineering_drawing BEFORE INSERT ON public.architectural_drawings FOR EACH ROW EXECUTE FUNCTION private.bridge_engineering_drawing();
REVOKE ALL ON FUNCTION private.bridge_engineering_drawing() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.preserve_engineering_drawing_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF ROW(NEW.id,NEW.user_id,NEW.organization_id,NEW.project_id,NEW.storage_path,NEW.format)
  IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.organization_id,OLD.project_id,OLD.storage_path,OLD.format) THEN
  RAISE EXCEPTION 'ENGINEERING_IDENTITY_IMMUTABLE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS preserve_engineering_drawing_identity ON public.architectural_drawings;
CREATE TRIGGER preserve_engineering_drawing_identity BEFORE UPDATE ON public.architectural_drawings FOR EACH ROW EXECUTE FUNCTION private.preserve_engineering_drawing_identity();
REVOKE ALL ON FUNCTION private.preserve_engineering_drawing_identity() FROM PUBLIC,anon,authenticated;
-- Mirrored legacy rows must not remain readable after membership revocation.
-- Restrictive policies narrow the existing owner policies; no new read grant.
DO $$ BEGIN
 IF to_regclass('public.drawing_assets') IS NOT NULL THEN
  EXECUTE 'DROP POLICY IF EXISTS legacy_drawing_tenant_guard ON public.drawing_assets';
  EXECUTE $policy$CREATE POLICY legacy_drawing_tenant_guard ON public.drawing_assets AS RESTRICTIVE FOR ALL TO authenticated
   USING(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND private.has_permission(p.organization_id,'read')))
   WITH CHECK(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND private.has_permission(p.organization_id,'create')))$policy$;
  EXECUTE 'DROP POLICY IF EXISTS legacy_drawing_retention ON public.drawing_assets';
  EXECUTE 'CREATE POLICY legacy_drawing_retention ON public.drawing_assets AS RESTRICTIVE FOR DELETE TO authenticated USING(false)';
  EXECUTE 'REVOKE UPDATE ON public.drawing_assets FROM authenticated';
 END IF;
 IF to_regclass('public.architectural_findings') IS NOT NULL THEN
  EXECUTE 'DROP POLICY IF EXISTS legacy_finding_tenant_guard ON public.architectural_findings';
  EXECUTE $policy$CREATE POLICY legacy_finding_tenant_guard ON public.architectural_findings AS RESTRICTIVE FOR ALL TO authenticated
   USING(EXISTS(SELECT 1 FROM public.architectural_reviews r WHERE r.id=review_id AND private.has_permission(r.organization_id,'read')))
   WITH CHECK(EXISTS(SELECT 1 FROM public.architectural_reviews r WHERE r.id=review_id AND private.has_permission(r.organization_id,'create')))$policy$;
  -- No active client consumes legacy finding writes. Keep reads/history;
  -- require the modern atomic conversion contract for all new conversions.
  EXECUTE 'REVOKE INSERT,UPDATE,DELETE ON public.architectural_findings FROM authenticated';
 END IF;
END $$;
ALTER TABLE public.architectural_reviews ADD COLUMN IF NOT EXISTS generated_at timestamptz;
ALTER TABLE public.architectural_reviews ALTER COLUMN generated_at SET DEFAULT now();
ALTER TABLE public.architectural_reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.architectural_reviews ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.architectural_reviews ADD COLUMN IF NOT EXISTS engine_version text;
ALTER TABLE public.architectural_reviews ADD COLUMN IF NOT EXISTS disclaimer text;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_kind text;
CREATE OR REPLACE FUNCTION public.membership_notification_target(p_organization_id uuid,p_notification_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n public.notifications;
BEGIN
 IF auth.uid() IS NULL OR coalesce(private.member_role(p_organization_id),'') NOT IN ('owner','admin') THEN
  RAISE EXCEPTION 'MEMBERSHIP_LINK_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 SELECT * INTO n FROM public.notifications WHERE id=p_notification_id AND user_id=auth.uid()
  AND organization_id=p_organization_id AND source_kind='membership';
 IF NOT FOUND THEN RAISE EXCEPTION 'MEMBERSHIP_LINK_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organization_memberships WHERE organization_id=p_organization_id AND user_id=n.entity_id) THEN
  RAISE EXCEPTION 'MEMBERSHIP_LINK_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('organization_id',p_organization_id,'member_id',n.entity_id,'view','administration');
END $$;
REVOKE ALL ON FUNCTION public.membership_notification_target(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.membership_notification_target(uuid,uuid) TO authenticated;
COMMIT;
