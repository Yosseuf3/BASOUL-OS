INSERT INTO tasks(id,user_id,organization_id,project_id,title,status,progress,updated_at)
SELECT ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
'00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',
'40000000-0000-0000-0000-000000000001','Matrix '||s,s::task_status,37,'2026-10-11T00:00:00Z'
FROM unnest(ARRAY['To Do','In Progress','Waiting','Review','Done']) WITH ORDINALITY AS x(s,n);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ DECLARE a text; b text; tid uuid; ok boolean; got boolean; r tasks; e activity_events;
BEGIN
 FOR a IN SELECT unnest(ARRAY['To Do','In Progress','Waiting','Review','Done']) LOOP
 SELECT id INTO tid FROM tasks WHERE status::text=a AND id::text LIKE '30000000%';
 FOR b IN SELECT unnest(ARRAY['To Do','In Progress','Waiting','Review','Done']) LOOP
 ok := (a='To Do' AND b='In Progress') OR (a='In Progress' AND b IN ('Waiting','Review')) OR (a='Waiting' AND b='In Progress') OR (a='Review' AND b IN ('In Progress','Done'));
 got:=false;
 BEGIN
 r:=transition_task_status(tid,'10000000-0000-0000-0000-000000000001',a::task_status,'2026-10-11T00:00:00Z',b::task_status,'synthetic reason');
 IF r.progress<>37 OR r.status::text<>b THEN RAISE EXCEPTION 'WRONG_RESULT'; END IF;
 SELECT * INTO STRICT e FROM activity_events WHERE entity_id=tid;
 IF e.user_id<>auth.uid() OR e.organization_id<>r.organization_id OR e.metadata->>'old_status'<>a
 OR e.metadata->>'new_status'<>b OR e.metadata->>'reason'<>'synthetic reason'
 OR e.metadata->>'actor_id'<>auth.uid()::text OR e.metadata->>'task_id'<>tid::text
 OR e.metadata->>'occurred_at' IS NULL THEN RAISE EXCEPTION 'BAD_AUDIT'; END IF;
 RAISE EXCEPTION 'ROLLBACK_SUCCESS' USING ERRCODE='P0002';
 EXCEPTION WHEN SQLSTATE 'P0002' THEN got:=true; WHEN SQLSTATE '22023' THEN got:=false;
 END;
 IF got<>ok THEN RAISE EXCEPTION 'MATRIX_FAILURE % -> %',a,b; END IF;
 IF EXISTS(SELECT 1 FROM activity_events WHERE entity_id=tid) THEN RAISE EXCEPTION 'REJECTED_OR_ROLLED_BACK_AUDIT'; END IF;
 END LOOP; END LOOP;
 IF EXISTS(SELECT 1 FROM tasks WHERE organization_id='10000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'RLS_LEAK'; END IF;
 BEGIN
 UPDATE tasks SET status='In Progress',progress=37 WHERE id='30000000-0000-0000-0000-000000000001';
 RAISE EXCEPTION 'LEGACY_WRITE_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN
 PERFORM transition_task_status('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Waiting','2026-10-10','In Progress');
 RAISE EXCEPTION 'STALE_VERSION_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN
 PERFORM transition_task_status('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','To Do','2026-10-11','In Progress');
 RAISE EXCEPTION 'STALE_STATUS_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN PERFORM 'Unknown'::task_status; RAISE EXCEPTION 'UNKNOWN_BYPASS'; EXCEPTION WHEN SQLSTATE '22P02' THEN NULL; END;
 BEGIN
 PERFORM transition_task_status('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','To Do','2026-10-11','In Progress',repeat('x',1001));
 RAISE EXCEPTION 'REASON_LIMIT_BYPASS'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 IF (SELECT status::text FROM tasks WHERE id='30000000-0000-0000-0000-000000000001')<>'To Do' THEN RAISE EXCEPTION 'AUDIT_FAILURE_NOT_ATOMIC'; END IF;
END $$;
DO $$ DECLARE actor uuid; BEGIN
 FOREACH actor IN ARRAY ARRAY['00000000-0000-0000-0000-000000000002'::uuid,'00000000-0000-0000-0000-000000000003'::uuid,'00000000-0000-0000-0000-000000000004'::uuid] LOOP
 PERFORM set_config('request.jwt.claim.sub',actor::text,false);
 BEGIN
 PERFORM transition_task_status('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Waiting','2026-10-11','In Progress');
 RAISE EXCEPTION 'UNAUTHORIZED_BYPASS'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 END LOOP;
END $$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ DECLARE original_version timestamptz; BEGIN
 SELECT updated_at INTO original_version FROM tasks WHERE id='30000000-0000-0000-0000-000000000004';
 UPDATE tasks SET title=title||' edited',updated_at='2000-01-01' WHERE id='30000000-0000-0000-0000-000000000004';
 IF (SELECT updated_at FROM tasks WHERE id='30000000-0000-0000-0000-000000000004')<=original_version THEN RAISE EXCEPTION 'NONSTATUS_VERSION_NOT_ADVANCED'; END IF;
 BEGIN
 PERFORM transition_task_status('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','Review',original_version,'Done');
 RAISE EXCEPTION 'NONSTATUS_STALE_VERSION_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
END $$;
RESET ROLE;
-- Actual audit INSERT permission failure must roll back the task write.
REVOKE INSERT ON activity_events FROM authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ BEGIN
 BEGIN
 PERFORM transition_task_status('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','To Do','2026-10-11','In Progress');
 RAISE EXCEPTION 'AUDIT_PERMISSION_BYPASS'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 IF (SELECT status::text FROM tasks WHERE id='30000000-0000-0000-0000-000000000001')<>'To Do' THEN RAISE EXCEPTION 'PARTIAL_COMMIT'; END IF;
END $$;
RESET ROLE;
GRANT INSERT ON activity_events TO authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT id FROM transition_task_status('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','To Do','2026-10-11','In Progress');
DO $$ BEGIN
 BEGIN
 PERFORM transition_task_status('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','To Do','2026-10-11','In Progress');
 RAISE EXCEPTION 'REPEATED_WRITE_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 IF (SELECT count(*) FROM activity_events WHERE entity_id='30000000-0000-0000-0000-000000000001')<>1 THEN RAISE EXCEPTION 'DUPLICATE_AUDIT'; END IF;
END $$;
DO $$ DECLARE first_version timestamptz; r tasks; BEGIN
 -- Old Android In Progress -> Review payload fabricates minimum 80, no CAS.
 BEGIN
 UPDATE tasks SET status='Review',progress=80 WHERE id='30000000-0000-0000-0000-000000000001';
 RAISE EXCEPTION 'OLD_REVIEW_PAYLOAD_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 IF (SELECT progress FROM tasks WHERE id='30000000-0000-0000-0000-000000000001')<>37 THEN RAISE EXCEPTION 'LEGACY_PROGRESS_CHANGED'; END IF;
 -- ABA within one transaction must not reuse transaction-stable now() versions.
 SELECT updated_at INTO first_version FROM tasks WHERE id='30000000-0000-0000-0000-000000000002';
 r:=transition_task_status('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','In Progress',first_version,'Waiting');
 r:=transition_task_status(r.id,r.organization_id,r.status,r.updated_at,'In Progress');
 IF r.updated_at<=first_version OR r.progress<>37 THEN RAISE EXCEPTION 'VERSION_OR_PROGRESS_FAILURE'; END IF;
 BEGIN
 PERFORM transition_task_status(r.id,r.organization_id,'In Progress',first_version,'Review');
 RAISE EXCEPTION 'ABA_VERSION_BYPASS'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 IF (SELECT count(*) FROM activity_events WHERE entity_id=r.id)<>2 THEN RAISE EXCEPTION 'ABA_AUDIT_DUPLICATE'; END IF;
END $$;
RESET ROLE;
