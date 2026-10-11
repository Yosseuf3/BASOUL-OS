-- REVIEW ONLY, NOT APPLIED. Requires committed Review enum and upgraded writers.
-- Must be tested with real PostgreSQL/RLS before migration authorization.
CREATE OR REPLACE FUNCTION private.validate_task_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR OLD.user_id IS DISTINCT FROM auth.uid()
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR private.has_permission(OLD.organization_id, 'update') IS NOT TRUE THEN
    RAISE EXCEPTION 'TASK_TRANSITION_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NOT ((OLD.status::text = 'To Do' AND NEW.status::text = 'In Progress')
    OR (OLD.status::text = 'In Progress' AND NEW.status::text IN ('Waiting','Review'))
    OR (OLD.status::text = 'Waiting' AND NEW.status::text = 'In Progress')
    OR (OLD.status::text = 'Review' AND NEW.status::text IN ('In Progress','Done'))) THEN
    RAISE EXCEPTION 'TASK_TRANSITION_REJECTED' USING ERRCODE = '22023';
  END IF;
  -- Transaction-local expectations are concurrency checks, NOT authorization.
  -- Permissions and creator checks above apply even if a caller sets expectations.
  IF NULLIF(current_setting('basoul.task_id', true),'') IS DISTINCT FROM OLD.id::text
     OR NULLIF(current_setting('basoul.task_status', true),'') IS DISTINCT FROM OLD.status::text
     OR NULLIF(current_setting('basoul.task_updated_at', true),'')::timestamptz IS DISTINCT FROM OLD.updated_at THEN
    RAISE EXCEPTION 'TASK_TRANSITION_CONFLICT' USING ERRCODE = '40001';
  END IF;
  IF NEW.progress IS DISTINCT FROM OLD.progress THEN
    RAISE EXCEPTION 'TASK_PROGRESS_SEPARATE_EDIT_REQUIRED' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_task_status(
  p_task_id uuid, p_organization_id uuid, p_expected_status public.task_status,
  p_expected_updated_at timestamptz, p_target_status public.task_status
) RETURNS public.tasks LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_task public.tasks; changed_task public.tasks;
BEGIN
  IF auth.uid() IS NULL OR private.has_permission(p_organization_id, 'update') IS NOT TRUE THEN
    RAISE EXCEPTION 'TASK_TRANSITION_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO current_task FROM public.tasks WHERE id=p_task_id
    AND organization_id=p_organization_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TASK_UNAVAILABLE' USING ERRCODE='42501'; END IF;
  IF p_expected_status IS NULL OR p_expected_updated_at IS NULL OR p_target_status IS NULL
    OR current_task.status IS DISTINCT FROM p_expected_status
    OR current_task.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'TASK_TRANSITION_CONFLICT' USING ERRCODE='40001';
  END IF;
  IF p_target_status = p_expected_status THEN
    RAISE EXCEPTION 'TASK_TRANSITION_REJECTED' USING ERRCODE='22023';
  END IF;
  PERFORM set_config('basoul.task_id',p_task_id::text,true);
  PERFORM set_config('basoul.task_status',p_expected_status::text,true);
  PERFORM set_config('basoul.task_updated_at',p_expected_updated_at::text,true);
  UPDATE public.tasks SET status=p_target_status WHERE id=p_task_id
    AND organization_id=p_organization_id AND user_id=auth.uid() RETURNING * INTO changed_task;
  PERFORM set_config('basoul.task_id','',true);
  PERFORM set_config('basoul.task_status','',true);
  PERFORM set_config('basoul.task_updated_at','',true);
  RETURN changed_task;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_task_status(uuid,uuid,public.task_status,timestamptz,public.task_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_task_status(uuid,uuid,public.task_status,timestamptz,public.task_status) TO authenticated;
REVOKE ALL ON FUNCTION private.validate_task_transition() FROM PUBLIC, anon;
CREATE TRIGGER validate_task_status_transition BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION private.validate_task_transition();
-- RLS remains unchanged. No SECURITY DEFINER, service-role route or blind retries.
-- Audit/notification transaction integration is a separate activation gate.
