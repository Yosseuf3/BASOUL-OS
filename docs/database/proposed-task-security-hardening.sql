-- REVIEW ONLY. Apply only with separately authorized enforcement rollout.
-- Preserve rows, timestamps, statuses, progress and existing RLS policies.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.tasks WHERE updated_at IS NULL) THEN
    RAISE EXCEPTION 'TASK_VERSION_PREFLIGHT_REQUIRED' USING ERRCODE='22023';
  END IF;
END $$;
-- No backfill or invented historical version. Nullable installations fail closed.
ALTER TABLE public.tasks ALTER COLUMN updated_at SET NOT NULL;
REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN ON public.tasks, public.activity_events
  FROM PUBLIC, anon, authenticated;
-- No role inheritance is present in the inspected production environment.
-- Verify effective privileges again; inherited grants require a separate review.
DO $$ BEGIN
  IF has_table_privilege('authenticated','public.tasks','TRUNCATE')
    OR has_table_privilege('authenticated','public.tasks','TRIGGER')
    OR has_table_privilege('authenticated','public.activity_events','TRUNCATE')
    OR has_table_privilege('authenticated','public.activity_events','TRIGGER') THEN
    RAISE EXCEPTION 'TASK_PRIVILEGE_PREFLIGHT_REQUIRED' USING ERRCODE='42501';
  END IF;
END $$;

-- Keep unrelated activity UPDATE/DELETE workflows. Only server-generated
-- task-transition records use this reserved marker and are append-only.
CREATE OR REPLACE FUNCTION private.protect_task_transition_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.metadata ? '_basoul_task_transition' THEN
    RAISE EXCEPTION 'TASK_AUDIT_IMMUTABLE' USING ERRCODE='42501';
  END IF;
  IF TG_OP <> 'DELETE' AND NEW.metadata ? '_basoul_task_transition' THEN
    -- The reviewed task AFTER UPDATE trigger is the only permitted producer.
    -- Depth alone is not authorization: bind the transaction's CAS context,
    -- authenticated actor, tenant, entity, and resulting task state as well.
    IF TG_OP <> 'INSERT' OR pg_trigger_depth() <> 2
      OR NEW.metadata->>'_basoul_task_transition' IS DISTINCT FROM 'true'
      OR NEW.module <> 'tasks' OR NEW.user_id IS DISTINCT FROM auth.uid()
      OR NEW.entity_id::text IS DISTINCT FROM current_setting('basoul.task_id',true)
      OR NEW.metadata->>'old_status' IS DISTINCT FROM current_setting('basoul.task_status',true)
      OR NEW.metadata->>'actor_id' IS DISTINCT FROM auth.uid()::text
      OR NEW.metadata->>'organization_id' IS DISTINCT FROM NEW.organization_id::text
      OR NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.id=NEW.entity_id
        AND t.organization_id=NEW.organization_id AND t.user_id=auth.uid()
        AND t.status::text=NEW.metadata->>'new_status') THEN
      RAISE EXCEPTION 'TASK_AUDIT_PRODUCER_REQUIRED' USING ERRCODE='42501';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.protect_task_transition_audit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_task_transition_audit ON public.activity_events;
CREATE TRIGGER protect_task_transition_audit BEFORE INSERT OR UPDATE OR DELETE
ON public.activity_events FOR EACH ROW EXECUTE FUNCTION private.protect_task_transition_audit();
-- Privileged maintenance, backups and service-role behavior need separate gates.
-- This is not immutable storage against database owners/superusers.
