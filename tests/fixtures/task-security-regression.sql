-- Disposable synthetic database only, after the existing transition matrix.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ DECLARE event_id uuid; affected integer; BEGIN
  IF has_table_privilege(current_user,'tasks','TRUNCATE')
    OR has_table_privilege(current_user,'tasks','TRIGGER')
    OR has_table_privilege(current_user,'activity_events','TRUNCATE') THEN
    RAISE EXCEPTION 'DANGEROUS_EFFECTIVE_GRANT';
  END IF;
  BEGIN TRUNCATE tasks CASCADE; RAISE EXCEPTION 'TRUNCATE_BYPASS';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN TRUNCATE activity_events; RAISE EXCEPTION 'AUDIT_TRUNCATE_BYPASS';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE TRIGGER malicious BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
    RAISE EXCEPTION 'TRIGGER_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  SELECT id INTO STRICT event_id FROM activity_events WHERE metadata ? '_basoul_task_transition' LIMIT 1;
  BEGIN UPDATE activity_events SET metadata='{}' WHERE id=event_id;
    RAISE EXCEPTION 'AUDIT_UPDATE_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN DELETE FROM activity_events WHERE id=event_id;
    RAISE EXCEPTION 'AUDIT_DELETE_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO activity_events(user_id,organization_id,module,action,title,metadata)
    VALUES(auth.uid(),'10000000-0000-0000-0000-000000000001','tasks','updated','forged',
      '{"_basoul_task_transition":true}');
    RAISE EXCEPTION 'AUDIT_FORGERY_BYPASS'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  -- Unrelated supported activity remains editable/deletable.
  INSERT INTO activity_events(user_id,organization_id,module,action,title)
    VALUES(auth.uid(),'10000000-0000-0000-0000-000000000001','projects','updated','synthetic ordinary activity') RETURNING id INTO event_id;
  UPDATE activity_events SET title='ordinary edit' WHERE id=event_id;
  DELETE FROM activity_events WHERE id=event_id;
  -- Attempt to take over another creator's task in the same organization.
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
  BEGIN UPDATE tasks SET user_id=auth.uid() WHERE id='20000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'CREATOR_TAKEOVER'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
  INSERT INTO tasks(id,user_id,organization_id,project_id,title,status,progress)
    VALUES('60000000-0000-0000-0000-000000000001',auth.uid(),'10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001','Synthetic creation','To Do',NULL);
  UPDATE tasks SET title='Valid ordinary edit' WHERE id='60000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'AUTHORIZED_UPDATE_BROKEN'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS production-shaped privileges, audit immutability, creator takeover rejection, ordinary activity and task writes';
