INSERT INTO tasks(id,user_id,organization_id,project_id,title,status,progress,updated_at)
VALUES('90000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',
'10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',
'Synthetic notification task','Waiting',15,'2026-10-19T00:00:00Z');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT transition_task_status('90000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',
'Waiting','2026-10-19T00:00:00Z','In Progress','Synthetic notification reason');
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM notifications WHERE entity_id='90000000-0000-0000-0000-000000000001') THEN
 RAISE EXCEPTION 'DELIVERED_INSIDE_MUTATION'; END IF;
END $$;
RESET ROLE;
-- Creator-only transition authorization means normal actions are self-actions.
SET ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
 r:=deliver_task_transition_notifications('10000000-0000-0000-0000-000000000001',50);
 IF (r->>'delivered')::integer<>0 THEN RAISE EXCEPTION 'SELF_NOTIFICATION'; END IF;
END $$;
RESET ROLE;
-- Synthetic historical cross-actor event tests recipient delivery without
-- granting another actor transition permission. Privileged fixture setup only.
BEGIN;
ALTER TABLE activity_events DISABLE TRIGGER protect_task_transition_audit;
UPDATE activity_events SET user_id='00000000-0000-0000-0000-000000000002',
metadata=jsonb_set(metadata,'{actor_id}','"00000000-0000-0000-0000-000000000002"')
WHERE entity_id='90000000-0000-0000-0000-000000000001';
ALTER TABLE activity_events ENABLE TRIGGER protect_task_transition_audit;
COMMIT;
REVOKE INSERT ON public.notifications FROM authenticated;
SET ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=deliver_task_transition_notifications('10000000-0000-0000-0000-000000000001',50);
 IF (result->>'failed')::integer<1 THEN RAISE EXCEPTION 'DELIVERY_FAILURE_NOT_DETECTED'; END IF;
 IF (SELECT status FROM tasks WHERE id='90000000-0000-0000-0000-000000000001')<>'In Progress' THEN
 RAISE EXCEPTION 'DELIVERY_CORRUPTED_TRANSITION'; END IF;
END $$;
RESET ROLE;
GRANT INSERT ON public.notifications TO authenticated;
SET ROLE authenticated;
SELECT deliver_task_transition_notifications('10000000-0000-0000-0000-000000000001',50);
SELECT deliver_task_transition_notifications('10000000-0000-0000-0000-000000000001',50);
DO $$ BEGIN
 IF (SELECT count(*) FROM notifications WHERE entity_id='90000000-0000-0000-0000-000000000001')<>1 THEN
 RAISE EXCEPTION 'RETRY_DUPLICATED_NOTIFICATION'; END IF;
END $$;
DELETE FROM notifications WHERE entity_id='90000000-0000-0000-0000-000000000001';
SELECT deliver_task_transition_notifications('10000000-0000-0000-0000-000000000001',50);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM notifications WHERE entity_id='90000000-0000-0000-0000-000000000001') THEN
 RAISE EXCEPTION 'DELETED_NOTIFICATION_RECREATED'; END IF;
 BEGIN
 PERFORM deliver_task_transition_notifications('10000000-0000-0000-0000-000000000002',10);
 RAISE EXCEPTION 'FOREIGN_TENANT_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
