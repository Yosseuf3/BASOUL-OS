-- LOCAL REVIEW CANDIDATE ONLY. Install after the historical manifest and task
-- edit/audit candidates. No workflow activation. No historical data backfill.
BEGIN;
ALTER TABLE public.project_notes ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE RESTRICT;
ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS content_sha256 text CHECK(content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$');
CREATE UNIQUE INDEX IF NOT EXISTS project_files_content_retry_idx ON public.project_files(organization_id,user_id,project_id,name,content_sha256) WHERE content_sha256 IS NOT NULL;
-- New object uploads require a durable metadata reference first. Historical
-- objects/rows remain untouched; this is additional to the existing Storage RLS.
DROP POLICY IF EXISTS project_file_registered_upload ON storage.objects;
CREATE POLICY project_file_registered_upload ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(
 bucket_id<>'project-files' OR EXISTS(SELECT 1 FROM public.project_files f WHERE f.storage_path=storage.objects.name AND f.user_id=auth.uid() AND private.has_permission(f.organization_id,'create')));
CREATE INDEX IF NOT EXISTS project_notes_task_idx ON public.project_notes(task_id) WHERE task_id IS NOT NULL;
-- Historical notes have an updated_at column but no update trigger. Do not
-- backfill history; advance future source revisions on the server only.
CREATE OR REPLACE FUNCTION private.advance_project_source_revision()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond'); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS zz_project_note_revision ON public.project_notes;
CREATE TRIGGER zz_project_note_revision BEFORE UPDATE ON public.project_notes FOR EACH ROW EXECUTE FUNCTION private.advance_project_source_revision();
DROP TRIGGER IF EXISTS zz_finding_revision ON public.architectural_review_findings;
CREATE TRIGGER zz_finding_revision BEFORE UPDATE ON public.architectural_review_findings FOR EACH ROW EXECUTE FUNCTION private.advance_project_source_revision();
REVOKE ALL ON FUNCTION private.advance_project_source_revision() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.validate_project_reference()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.projects p WHERE p.id=NEW.project_id AND p.organization_id=NEW.organization_id) THEN
  RAISE EXCEPTION 'PROJECT_REFERENCE_REJECTED' USING ERRCODE='42501'; END IF;
 IF TG_TABLE_NAME='project_notes' THEN
  IF NEW.project_file_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.project_files f WHERE f.id=NEW.project_file_id AND f.organization_id=NEW.organization_id AND f.project_id=NEW.project_id) THEN
   RAISE EXCEPTION 'FILE_REFERENCE_REJECTED' USING ERRCODE='42501'; END IF;
 ELSE
  IF split_part(NEW.storage_path,'/',1) IS DISTINCT FROM NEW.user_id::text OR split_part(NEW.storage_path,'/',2) IS DISTINCT FROM NEW.project_id::text THEN
   RAISE EXCEPTION 'FILE_PATH_REJECTED' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND (NEW.storage_path IS DISTINCT FROM OLD.storage_path OR NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256 OR NEW.file_size IS DISTINCT FROM OLD.file_size OR NEW.name IS DISTINCT FROM OLD.name OR NEW.mime_type IS DISTINCT FROM OLD.mime_type) THEN
   RAISE EXCEPTION 'FILE_IDENTITY_IMMUTABLE' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_project_file_reference ON public.project_files;
CREATE TRIGGER validate_project_file_reference BEFORE INSERT OR UPDATE ON public.project_files FOR EACH ROW EXECUTE FUNCTION private.validate_project_reference();
DROP TRIGGER IF EXISTS validate_project_note_reference ON public.project_notes;
CREATE TRIGGER validate_project_note_reference BEFORE INSERT OR UPDATE ON public.project_notes FOR EACH ROW EXECUTE FUNCTION private.validate_project_reference();
REVOKE ALL ON FUNCTION private.validate_project_reference() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.guard_project_source_link()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.task_id IS NOT NULL THEN RAISE EXCEPTION 'CONVERSION_HISTORY_PRESERVED' USING ERRCODE='42501'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND OLD.task_id IS NOT NULL AND
   (NEW.task_id IS DISTINCT FROM OLD.task_id OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id OR (to_jsonb(NEW)->>'project_id') IS DISTINCT FROM (to_jsonb(OLD)->>'project_id')
    OR (to_jsonb(NEW)->>'review_id') IS DISTINCT FROM (to_jsonb(OLD)->>'review_id')) THEN
  RAISE EXCEPTION 'CONVERSION_HISTORY_PRESERVED' USING ERRCODE='42501'; END IF;
 IF NEW.task_id IS NOT NULL AND (TG_OP='INSERT' OR OLD.task_id IS DISTINCT FROM NEW.task_id) THEN
  IF current_setting('basoul.conversion_source',true) IS DISTINCT FROM NEW.id::text THEN
   RAISE EXCEPTION 'ATOMIC_CONVERSION_REQUIRED' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_note_task_link ON public.project_notes;
CREATE TRIGGER guard_note_task_link BEFORE INSERT OR UPDATE OR DELETE ON public.project_notes FOR EACH ROW EXECUTE FUNCTION private.guard_project_source_link();
DROP TRIGGER IF EXISTS guard_finding_task_link ON public.architectural_review_findings;
CREATE TRIGGER guard_finding_task_link BEFORE INSERT OR UPDATE OR DELETE ON public.architectural_review_findings FOR EACH ROW EXECUTE FUNCTION private.guard_project_source_link();
REVOKE ALL ON FUNCTION private.guard_project_source_link() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.audit_project_conversion()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.task_id IS NOT NULL AND OLD.task_id IS NULL THEN
  INSERT INTO public.activity_events(user_id,organization_id,module,action,entity_id,title,metadata)
  VALUES(auth.uid(),NEW.organization_id,'tasks','created',NEW.task_id,'Source converted to task',
   jsonb_build_object('_basoul_source_conversion',true,'source_kind',CASE WHEN TG_TABLE_NAME='project_notes' THEN 'note' ELSE 'finding' END,
    'source_id',NEW.id,'actor_id',auth.uid(),'organization_id',NEW.organization_id));
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS audit_note_conversion ON public.project_notes;
CREATE TRIGGER audit_note_conversion AFTER UPDATE ON public.project_notes FOR EACH ROW EXECUTE FUNCTION private.audit_project_conversion();
DROP TRIGGER IF EXISTS audit_finding_conversion ON public.architectural_review_findings;
CREATE TRIGGER audit_finding_conversion AFTER UPDATE ON public.architectural_review_findings FOR EACH ROW EXECUTE FUNCTION private.audit_project_conversion();
REVOKE ALL ON FUNCTION private.audit_project_conversion() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.protect_conversion_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP<>'INSERT' AND OLD.metadata ? '_basoul_source_conversion' THEN
  RAISE EXCEPTION 'CONVERSION_AUDIT_IMMUTABLE' USING ERRCODE='42501'; END IF;
 IF TG_OP<>'DELETE' AND NEW.metadata ? '_basoul_source_conversion' THEN
  IF TG_OP<>'INSERT' OR pg_trigger_depth()<>2 OR NEW.user_id IS DISTINCT FROM auth.uid()
   OR NEW.module<>'tasks' OR NEW.action<>'created' OR NEW.metadata->>'_basoul_source_conversion'<>'true'
   OR NEW.metadata->>'source_id' IS DISTINCT FROM current_setting('basoul.conversion_source',true)
   OR NEW.metadata->>'actor_id' IS DISTINCT FROM auth.uid()::text
   OR NEW.metadata->>'organization_id' IS DISTINCT FROM NEW.organization_id::text
   OR NOT EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=NEW.entity_id AND t.organization_id=NEW.organization_id AND t.user_id=auth.uid()) THEN
   RAISE EXCEPTION 'CONVERSION_AUDIT_PRODUCER_REQUIRED' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_conversion_audit ON public.activity_events;
CREATE TRIGGER protect_conversion_audit BEFORE INSERT OR UPDATE OR DELETE ON public.activity_events FOR EACH ROW EXECUTE FUNCTION private.protect_conversion_audit();
REVOKE ALL ON FUNCTION private.protect_conversion_audit() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.convert_project_source_to_task(p_organization_id uuid,p_project_id uuid,p_source_kind text,p_source_id uuid,p_expected_updated_at timestamptz)
RETURNS public.tasks LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE source_row jsonb; linked public.tasks; v_review_id uuid; task_title text; task_description text; task_priority public.priority_level;
BEGIN
 IF auth.uid() IS NULL OR private.has_permission(p_organization_id,'create') IS NOT TRUE
  OR private.has_permission(p_organization_id,'update') IS NOT TRUE THEN RAISE EXCEPTION 'CONVERSION_FORBIDDEN' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.projects WHERE id=p_project_id AND organization_id=p_organization_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 IF p_source_kind='note' THEN
  SELECT to_jsonb(n) INTO source_row FROM public.project_notes n WHERE id=p_source_id AND organization_id=p_organization_id AND project_id=p_project_id AND user_id=auth.uid() FOR UPDATE;
 ELSIF p_source_kind='finding' THEN
  SELECT f.review_id INTO v_review_id FROM public.architectural_review_findings f WHERE f.id=p_source_id AND f.organization_id=p_organization_id AND f.user_id=auth.uid();
  PERFORM 1 FROM public.architectural_reviews r WHERE r.id=v_review_id AND r.project_id=p_project_id AND r.organization_id=p_organization_id AND r.user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_UNAVAILABLE' USING ERRCODE='42501'; END IF;
  SELECT to_jsonb(f) INTO source_row FROM public.architectural_review_findings f WHERE f.id=p_source_id AND f.review_id=v_review_id AND f.organization_id=p_organization_id AND f.user_id=auth.uid() FOR UPDATE;
 ELSE RAISE EXCEPTION 'SOURCE_KIND_REJECTED' USING ERRCODE='22023'; END IF;
 IF source_row IS NULL THEN RAISE EXCEPTION 'SOURCE_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 -- A lost response may be retried with the old version: return the same link.
 IF source_row->>'task_id' IS NOT NULL THEN
  SELECT * INTO linked FROM public.tasks WHERE id=(source_row->>'task_id')::uuid AND organization_id=p_organization_id AND project_id=p_project_id AND user_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_LINK_REQUIRES_REVIEW' USING ERRCODE='42501'; END IF;
  RETURN linked;
 END IF;
 IF p_expected_updated_at IS NULL OR (source_row->>'updated_at')::timestamptz IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'SOURCE_CONVERSION_CONFLICT' USING ERRCODE='PT409'; END IF;
 IF (p_source_kind='note' AND source_row->>'status'<>'open') OR
    (p_source_kind='finding' AND source_row->>'status' NOT IN ('open','accepted')) THEN
  RAISE EXCEPTION 'SOURCE_STATE_REJECTED' USING ERRCODE='22023'; END IF;
 task_title:=btrim(source_row->>'title');
 IF length(task_title) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'TASK_TITLE_REVIEW_REQUIRED' USING ERRCODE='22023'; END IF;
 task_description:=CASE WHEN p_source_kind='note' THEN source_row->>'content' ELSE concat(source_row->>'description',E'\n\nالتوصية: ',source_row->>'recommendation') END;
 task_priority:=CASE WHEN source_row->>'severity'='critical' THEN 'Critical' WHEN source_row->>'severity'='warning' OR source_row->>'type' IN ('decision','review') THEN 'High' ELSE 'Medium' END;
 PERFORM set_config('basoul.conversion_source',p_source_id::text,true);
 INSERT INTO public.tasks(user_id,organization_id,project_id,title,description,status,priority,progress,due_date)
 VALUES(auth.uid(),p_organization_id,p_project_id,task_title,task_description,'To Do',task_priority,0,CASE WHEN p_source_kind='note' THEN (source_row->>'follow_up_date')::date END) RETURNING * INTO linked;
 PERFORM set_config('basoul.conversion_source',p_source_id::text,true);
 IF p_source_kind='note' THEN
  UPDATE public.project_notes SET task_id=linked.id,status='done' WHERE id=p_source_id AND organization_id=p_organization_id;
 ELSE
  UPDATE public.architectural_review_findings SET task_id=linked.id,status='converted_to_task' WHERE id=p_source_id AND organization_id=p_organization_id;
  -- Analysis status is not a decision-completion state. Historical schemas
  -- reject 'completed'; preserve it and derive decision completion from findings.
 END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_UPDATE_REJECTED' USING ERRCODE='42501'; END IF;
 PERFORM set_config('basoul.conversion_source','',true);
 RETURN linked;
END $$;
REVOKE ALL ON FUNCTION public.convert_project_source_to_task(uuid,uuid,text,uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.convert_project_source_to_task(uuid,uuid,text,uuid,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_project_note(p_organization_id uuid,p_project_id uuid,p_note_id uuid,p_input jsonb)
RETURNS public.project_notes LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE existing public.project_notes; created public.project_notes;
BEGIN
 IF auth.uid() IS NULL OR private.has_permission(p_organization_id,'create') IS NOT TRUE OR p_note_id IS NULL THEN
  RAISE EXCEPTION 'NOTE_CREATE_FORBIDDEN' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.projects WHERE id=p_project_id AND organization_id=p_organization_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 IF p_input IS NULL OR jsonb_typeof(p_input)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_input) k WHERE k NOT IN ('title','content','type','project_file_id','assigned_to','follow_up_date')) THEN
  RAISE EXCEPTION 'NOTE_INPUT_REJECTED' USING ERRCODE='22023'; END IF;
 SELECT * INTO existing FROM public.project_notes WHERE id=p_note_id AND organization_id=p_organization_id AND project_id=p_project_id AND user_id=auth.uid();
 IF FOUND THEN
  IF jsonb_build_object('title',existing.title,'content',existing.content,'type',existing.type,'project_file_id',existing.project_file_id,'assigned_to',existing.assigned_to,'follow_up_date',existing.follow_up_date) IS DISTINCT FROM p_input THEN
   RAISE EXCEPTION 'NOTE_RETRY_INPUT_CHANGED' USING ERRCODE='PT409'; END IF;
  RETURN existing;
 END IF;
 INSERT INTO public.project_notes(id,user_id,organization_id,project_id,title,content,type,project_file_id,assigned_to,follow_up_date)
 VALUES(p_note_id,auth.uid(),p_organization_id,p_project_id,btrim(p_input->>'title'),p_input->>'content',p_input->>'type',(p_input->>'project_file_id')::uuid,p_input->>'assigned_to',(p_input->>'follow_up_date')::date) RETURNING * INTO created;
 INSERT INTO public.activity_events(user_id,organization_id,module,action,entity_id,title,metadata)
 VALUES(auth.uid(),p_organization_id,'projects','created',p_project_id,'Project note created',jsonb_build_object('project_note_id',p_note_id));
 RETURN created;
END $$;
REVOKE ALL ON FUNCTION public.create_project_note(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_project_note(uuid,uuid,uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION private.preserve_project_history()
-- Private trigger only: inspect even legacy child rows hidden by owner-only RLS.
-- It may only veto deletion, never grants a destructive action or returns data.
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR private.has_permission(OLD.organization_id,'delete') IS NOT TRUE THEN
  RAISE EXCEPTION 'PROJECT_DELETE_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.tasks WHERE project_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.project_files WHERE project_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.project_notes WHERE project_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.architectural_drawings WHERE project_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.drawing_assets WHERE project_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.finance_transactions WHERE project_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.activity_events WHERE entity_id=OLD.id) THEN
  RAISE EXCEPTION 'PROJECT_HISTORY_PRESERVED' USING ERRCODE='42501'; END IF;
 RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS preserve_project_history ON public.projects;
CREATE TRIGGER preserve_project_history BEFORE DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION private.preserve_project_history();
REVOKE ALL ON FUNCTION private.preserve_project_history() FROM PUBLIC,anon,authenticated;
COMMIT;
