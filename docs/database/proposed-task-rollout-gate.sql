-- REVIEW ONLY. Install before enforcement/notification candidates.
-- Empty by default: schema installation does not activate any organization.
CREATE TABLE IF NOT EXISTS private.task_workflow_activation (
 organization_id uuid PRIMARY KEY REFERENCES public.organizations(id),
 enabled boolean NOT NULL DEFAULT false
);
ALTER TABLE private.task_workflow_activation ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.task_workflow_activation FORCE ROW LEVEL SECURITY;
REVOKE ALL ON private.task_workflow_activation FROM PUBLIC,anon,authenticated;
GRANT SELECT ON private.task_workflow_activation TO authenticated;
DROP POLICY IF EXISTS task_activation_member_read ON private.task_workflow_activation;
CREATE POLICY task_activation_member_read ON private.task_workflow_activation FOR SELECT TO authenticated
USING(private.has_permission(organization_id,'read'));
CREATE OR REPLACE FUNCTION private.check_task_rollout()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status AND NOT EXISTS(
  SELECT 1 FROM private.task_workflow_activation a WHERE a.organization_id=OLD.organization_id AND a.enabled
 ) THEN RAISE EXCEPTION 'TASK_WORKFLOW_NOT_ACTIVATED' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a_check_task_rollout ON public.tasks;
CREATE TRIGGER a_check_task_rollout BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION private.check_task_rollout();
REVOKE ALL ON FUNCTION private.check_task_rollout() FROM PUBLIC,anon,authenticated;
