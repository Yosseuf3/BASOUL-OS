-- Read-only post-install RC preflight. Run only against an approved target.
-- Does not install candidates, repair rows, grant access or activate workflows.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
DO $$
DECLARE relation text;
BEGIN
 FOREACH relation IN ARRAY ARRAY['organizations','organization_memberships','projects','tasks','project_files','project_notes','notifications','architectural_drawings','architectural_reviews','architectural_review_findings'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=relation AND c.relrowsecurity) THEN
   RAISE EXCEPTION 'RC_PREFLIGHT: missing table or RLS: %',relation;
  END IF;
 END LOOP;
 IF to_regtype('public.client_status') IS NULL THEN RAISE EXCEPTION 'RC_PREFLIGHT: client baseline missing'; END IF;
 IF to_regprocedure('public.convert_project_source_to_task(uuid,uuid,text,uuid,timestamp with time zone)') IS NULL
  OR to_regprocedure('public.membership_notification_target(uuid,uuid)') IS NULL
  OR to_regprocedure('public.edit_task_fields(uuid,uuid,timestamp with time zone,jsonb)') IS NULL THEN
  RAISE EXCEPTION 'RC_PREFLIGHT: required candidate RPC missing';
 END IF;
 IF EXISTS(SELECT 1 FROM private.task_workflow_activation WHERE enabled) THEN
  RAISE EXCEPTION 'RC_PREFLIGHT: workflow must remain OFF for this RC';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.tasks'::regclass AND tgname='require_atomic_task_client' AND tgenabled='O') THEN
  RAISE EXCEPTION 'RC_PREFLIGHT: legacy task insert guard missing';
 END IF;
 IF has_function_privilege('anon','public.membership_notification_target(uuid,uuid)','EXECUTE')
  OR has_function_privilege('anon','public.convert_project_source_to_task(uuid,uuid,text,uuid,timestamp with time zone)','EXECUTE') THEN
  RAISE EXCEPTION 'RC_PREFLIGHT: anonymous candidate RPC access';
 END IF;
 IF EXISTS(SELECT 1 FROM public.project_notes n JOIN public.tasks t ON t.id=n.task_id
  WHERE n.organization_id IS DISTINCT FROM t.organization_id OR n.project_id IS DISTINCT FROM t.project_id) THEN
  RAISE EXCEPTION 'RC_PREFLIGHT: note/task tenant or project mismatch';
 END IF;
END $$;
-- Aggregate diagnostics only. Nonzero legacy-only counts require mapping/scope
-- review, not automatic deletion or invented modern metadata.
SELECT 'legacy_drawings_without_modern_counterpart' AS diagnostic,count(*) AS rows
FROM public.drawing_assets a LEFT JOIN public.architectural_drawings d ON d.id=a.id WHERE d.id IS NULL;
SELECT 'legacy_findings_with_task_link' AS diagnostic,count(*) AS rows
FROM public.architectural_findings WHERE task_id IS NOT NULL;
SELECT 'RC_PREFLIGHT_LOCAL_SCHEMA_OK' AS result;
ROLLBACK;
