-- REVIEW ONLY. Install after task enforcement/security, with upgraded clients.
-- All non-status task UPDATE writers must use this RPC after installation.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
-- No physical task deletion, including project cascades, is an application permission.
CREATE OR REPLACE FUNCTION private.preserve_task_history()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'TASK_HISTORY_PRESERVED_USE_ARCHIVE' USING ERRCODE='42501'; END $$;
CREATE TRIGGER preserve_task_history BEFORE DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION private.preserve_task_history();
REVOKE ALL ON FUNCTION private.preserve_task_history() FROM PUBLIC,anon,authenticated;
REVOKE DELETE,TRUNCATE,TRIGGER,REFERENCES,MAINTAIN ON public.tasks FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.validate_task_creation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid()
  OR private.has_permission(NEW.organization_id,'create') IS NOT TRUE
  OR (NEW.project_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.projects p WHERE p.id=NEW.project_id AND p.organization_id=NEW.organization_id)) THEN
  RAISE EXCEPTION 'TASK_CREATE_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF NEW.status::text<>'To Do' OR NEW.archived THEN RAISE EXCEPTION 'TASK_INITIAL_STATUS_REJECTED' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_task_creation BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION private.validate_task_creation();
REVOKE ALL ON FUNCTION private.validate_task_creation() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.require_task_edit_cas()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.archived THEN RAISE EXCEPTION 'TASK_ARCHIVED_READ_ONLY' USING ERRCODE='42501'; END IF;
 IF NEW.archived IS DISTINCT FROM OLD.archived AND NEW.status IS DISTINCT FROM OLD.status THEN
 RAISE EXCEPTION 'TASK_ARCHIVE_SEPARATE_EDIT_REQUIRED' USING ERRCODE='22023'; END IF;
 IF NEW.created_at IS DISTINCT FROM OLD.created_at OR (NEW.project_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.projects p WHERE p.id=NEW.project_id AND p.organization_id=NEW.organization_id)) THEN
  RAISE EXCEPTION 'TASK_EDIT_BOUNDARY_REJECTED' USING ERRCODE='42501'; END IF;
 IF NEW.status IS NOT DISTINCT FROM OLD.status AND (
   current_setting('basoul.task_edit_id',true) IS DISTINCT FROM OLD.id::text
   OR NULLIF(current_setting('basoul.task_edit_version',true),'')::timestamptz IS DISTINCT FROM OLD.updated_at) THEN
   RAISE EXCEPTION 'TASK_UPDATE_REQUIRED' USING ERRCODE='PT409';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_require_task_edit_cas BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION private.require_task_edit_cas();
REVOKE ALL ON FUNCTION private.require_task_edit_cas() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.edit_task_fields(p_task_id uuid,p_organization_id uuid,p_expected_updated_at timestamptz,p_changes jsonb)
RETURNS public.tasks LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE current_task public.tasks; candidate public.tasks; changed public.tasks;
BEGIN
 IF auth.uid() IS NULL OR private.has_permission(p_organization_id,'update') IS NOT TRUE THEN
  RAISE EXCEPTION 'TASK_EDIT_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF p_changes IS NULL OR jsonb_typeof(p_changes)<>'object' OR p_changes='{}'::jsonb OR EXISTS(
  SELECT 1 FROM jsonb_object_keys(p_changes) k WHERE k NOT IN ('title','description','project_id','priority','progress','due_date','archived')) THEN
  RAISE EXCEPTION 'TASK_EDIT_FIELDS_REJECTED' USING ERRCODE='22023'; END IF;
 SELECT * INTO current_task FROM public.tasks WHERE id=p_task_id AND organization_id=p_organization_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'TASK_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 IF p_expected_updated_at IS NULL OR current_task.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'TASK_EDIT_CONFLICT' USING ERRCODE='PT409'; END IF;
 candidate:=jsonb_populate_record(current_task,p_changes);
 IF p_changes ? 'archived' AND (p_changes->'archived' IS DISTINCT FROM 'true'::jsonb OR p_changes <> '{"archived":true}'::jsonb) THEN
 RAISE EXCEPTION 'TASK_ARCHIVE_REJECTED' USING ERRCODE='22023'; END IF;
 IF candidate.title IS NULL OR length(btrim(candidate.title)) NOT BETWEEN 1 AND 160
  OR candidate.progress IS NULL OR candidate.progress NOT BETWEEN 0 AND 100
  OR candidate.priority IS NULL THEN RAISE EXCEPTION 'TASK_EDIT_REJECTED' USING ERRCODE='22023'; END IF;
 IF candidate.project_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.projects p WHERE p.id=candidate.project_id AND p.organization_id=p_organization_id) THEN
  RAISE EXCEPTION 'TASK_PROJECT_FORBIDDEN' USING ERRCODE='42501'; END IF;
 PERFORM set_config('basoul.task_edit_id',p_task_id::text,true);
 PERFORM set_config('basoul.task_edit_version',p_expected_updated_at::text,true);
 UPDATE public.tasks SET title=CASE WHEN p_changes ? 'title' THEN btrim(candidate.title) ELSE current_task.title END,description=candidate.description,project_id=candidate.project_id,
  priority=candidate.priority,progress=candidate.progress,due_date=candidate.due_date,archived=candidate.archived
  WHERE id=p_task_id RETURNING * INTO changed;
 PERFORM set_config('basoul.task_edit_id','',true);
 PERFORM set_config('basoul.task_edit_version','',true);
 RETURN changed;
END $$;
REVOKE ALL ON FUNCTION public.edit_task_fields(uuid,uuid,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_task_fields(uuid,uuid,timestamptz,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION private.audit_task_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
 INSERT INTO public.activity_events(user_id,organization_id,module,action,entity_id,title,metadata)
 VALUES(auth.uid(),NEW.organization_id,'tasks','updated',NEW.id,'Task fields updated',
 jsonb_build_object('_basoul_task_edit',true,'actor_id',auth.uid(),'organization_id',NEW.organization_id,
 'old_updated_at',OLD.updated_at,'new_updated_at',NEW.updated_at,'old_archived',OLD.archived,'new_archived',NEW.archived));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER audit_task_field_edit AFTER UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION private.audit_task_edit();
REVOKE ALL ON FUNCTION private.audit_task_edit() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.protect_task_edit_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP<>'INSERT' AND OLD.metadata ? '_basoul_task_edit' THEN RAISE EXCEPTION 'TASK_EDIT_AUDIT_IMMUTABLE' USING ERRCODE='42501'; END IF;
 IF TG_OP<>'DELETE' AND NEW.metadata ? '_basoul_task_edit' THEN
  IF TG_OP<>'INSERT' OR pg_trigger_depth()<>2 OR NEW.metadata->>'_basoul_task_edit'<>'true'
    OR NEW.user_id IS DISTINCT FROM auth.uid() OR NEW.module<>'tasks'
    OR NEW.entity_id::text IS DISTINCT FROM current_setting('basoul.task_edit_id',true)
    OR NEW.metadata->>'actor_id' IS DISTINCT FROM auth.uid()::text
    OR NEW.metadata->>'organization_id' IS DISTINCT FROM NEW.organization_id::text
    OR NOT EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=NEW.entity_id AND t.user_id=auth.uid()
      AND t.organization_id=NEW.organization_id AND t.updated_at=(NEW.metadata->>'new_updated_at')::timestamptz) THEN
   RAISE EXCEPTION 'TASK_EDIT_AUDIT_PRODUCER_REQUIRED' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_task_edit_audit BEFORE INSERT OR UPDATE OR DELETE ON public.activity_events
FOR EACH ROW EXECUTE FUNCTION private.protect_task_edit_audit();
REVOKE ALL ON FUNCTION private.protect_task_edit_audit() FROM PUBLIC,anon,authenticated;
