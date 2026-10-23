SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ DECLARE old tasks; changed tasks; BEGIN
 SELECT * INTO old FROM tasks WHERE id='90000000-0000-0000-0000-000000000001';
 changed:=edit_task_fields(old.id,old.organization_id,old.updated_at,'{"title":"CAS edited","progress":28}'::jsonb);
 IF changed.title<>'CAS edited' OR changed.progress<>28 OR changed.status<>old.status OR changed.updated_at<=old.updated_at THEN
 RAISE EXCEPTION 'EDIT_RESULT_WRONG'; END IF;
 BEGIN
 PERFORM edit_task_fields(old.id,old.organization_id,old.updated_at,'{"title":"stale"}'::jsonb);
 RAISE EXCEPTION 'STALE_EDIT_ALLOWED'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN
 UPDATE tasks SET title='direct bypass' WHERE id=old.id;
 RAISE EXCEPTION 'LEGACY_EDIT_ALLOWED'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN
 PERFORM edit_task_fields(old.id,old.organization_id,changed.updated_at,'{"status":"Done"}'::jsonb);
 RAISE EXCEPTION 'STATUS_SMUGGLED'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
 PERFORM edit_task_fields(old.id,old.organization_id,changed.updated_at,'{"project_id":"40000000-0000-0000-0000-000000000002"}'::jsonb);
 RAISE EXCEPTION 'FOREIGN_PROJECT_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT count(*) FROM activity_events WHERE entity_id=old.id AND metadata->>'_basoul_task_edit'='true')<>1 THEN
 RAISE EXCEPTION 'EDIT_AUDIT_MISSING'; END IF;
 BEGIN
 DELETE FROM activity_events WHERE entity_id=old.id AND metadata->>'_basoul_task_edit'='true';
 RAISE EXCEPTION 'EDIT_AUDIT_MUTABLE'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ DECLARE old tasks; changed tasks; BEGIN
 SELECT * INTO old FROM tasks WHERE id='90000000-0000-0000-0000-000000000001';
 BEGIN DELETE FROM tasks WHERE id=old.id; RAISE EXCEPTION 'PHYSICAL_DELETE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN DELETE FROM projects WHERE id=old.project_id; RAISE EXCEPTION 'CASCADE_DELETE_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 changed:=edit_task_fields(old.id,old.organization_id,old.updated_at,'{"archived":true}');
 IF NOT changed.archived OR changed.updated_at<=old.updated_at OR changed.title IS DISTINCT FROM old.title
 OR changed.progress IS DISTINCT FROM old.progress OR changed.status IS DISTINCT FROM old.status THEN RAISE EXCEPTION 'ARCHIVE_FAILED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM activity_events WHERE entity_id=old.id AND metadata->>'new_archived'='true') THEN RAISE EXCEPTION 'ARCHIVE_AUDIT_MISSING'; END IF;
 BEGIN PERFORM edit_task_fields(old.id,old.organization_id,old.updated_at,'{"archived":true}'); RAISE EXCEPTION 'STALE_ARCHIVE_ALLOWED'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN PERFORM edit_task_fields(old.id,old.organization_id,changed.updated_at,'{"archived":false}'); RAISE EXCEPTION 'UNARCHIVE_ALLOWED'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM transition_task_status(old.id,old.organization_id,changed.status,changed.updated_at,'Review',NULL); RAISE EXCEPTION 'ARCHIVED_TRANSITION_ALLOWED'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
