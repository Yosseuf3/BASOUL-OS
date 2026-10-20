-- LOCAL/REVIEW ONLY. Install after notification foundation, IAM and task audit.
-- The immutable committed transition audit is the durable outbox. Delivery is
-- a separate transaction, never part of the task update. No scheduler activated.
-- Tighten recipient privacy: existing tenant-wide notification SELECT/UPDATE
-- policies are too broad for a private inbox, even within one organization.
REVOKE TRUNCATE,TRIGGER,REFERENCES,MAINTAIN ON public.notifications FROM PUBLIC,anon,authenticated;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notifications' LOOP
    EXECUTE format('DROP POLICY %I ON public.notifications',p.policyname);
  END LOOP;
END $$;
CREATE POLICY task_inbox_read ON public.notifications FOR SELECT TO authenticated
 USING(user_id=auth.uid() AND private.has_permission(organization_id,'read'));
CREATE POLICY task_inbox_insert ON public.notifications FOR INSERT TO authenticated
 WITH CHECK(user_id=auth.uid() AND private.has_permission(organization_id,'create'));
CREATE POLICY task_inbox_update ON public.notifications FOR UPDATE TO authenticated
 USING(user_id=auth.uid() AND private.has_permission(organization_id,'read'))
 WITH CHECK(user_id=auth.uid() AND private.has_permission(organization_id,'read'));
CREATE POLICY task_inbox_delete ON public.notifications FOR DELETE TO authenticated
 USING(user_id=auth.uid() AND private.has_permission(organization_id,'read'));
CREATE TABLE IF NOT EXISTS private.task_notification_receipts (
  activity_event_id uuid NOT NULL REFERENCES public.activity_events(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  delivered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (activity_event_id,user_id)
);
ALTER TABLE private.task_notification_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.task_notification_receipts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON private.task_notification_receipts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON private.task_notification_receipts TO authenticated;
CREATE POLICY task_receipt_own_read ON private.task_notification_receipts FOR SELECT TO authenticated
  USING (user_id=auth.uid() AND private.has_permission(organization_id,'read'));
CREATE POLICY task_receipt_own_insert ON private.task_notification_receipts FOR INSERT TO authenticated
  WITH CHECK (user_id=auth.uid() AND private.has_permission(organization_id,'read') AND EXISTS (
    SELECT 1 FROM public.activity_events e JOIN public.tasks t ON t.id=e.entity_id
    WHERE e.id=activity_event_id AND e.user_id IS DISTINCT FROM auth.uid() AND t.user_id=auth.uid()
      AND e.organization_id=task_notification_receipts.organization_id
      AND t.organization_id=e.organization_id AND e.metadata->>'_basoul_task_transition'='true'));

CREATE OR REPLACE FUNCTION public.deliver_task_transition_notifications(p_organization_id uuid,p_limit integer DEFAULT 10)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e record; delivered integer:=0; failed integer:=0;
BEGIN
  IF auth.uid() IS NULL OR private.has_permission(p_organization_id,'read') IS NOT TRUE THEN
    RAISE EXCEPTION 'TASK_NOTIFICATION_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'TASK_NOTIFICATION_LIMIT' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM private.task_workflow_activation a WHERE a.organization_id=p_organization_id AND a.enabled) THEN
    RETURN jsonb_build_object('delivered',0,'failed',0);
  END IF;
  FOR e IN SELECT a.*,t.title AS task_title FROM public.activity_events a
    JOIN public.tasks t ON t.id=a.entity_id AND t.organization_id=a.organization_id
    WHERE a.organization_id=p_organization_id AND a.user_id IS DISTINCT FROM auth.uid() AND t.user_id=auth.uid()
      AND a.module='tasks' AND a.metadata->>'_basoul_task_transition'='true'
      AND NOT EXISTS (SELECT 1 FROM private.task_notification_receipts r WHERE r.activity_event_id=a.id AND r.user_id=auth.uid())
    ORDER BY a.created_at,a.id LIMIT p_limit
  LOOP
    BEGIN
      -- Unique receipt arbitrates concurrent deliveries; block rollback removes
      -- it if inbox INSERT fails. Deleting an inbox row does not cause re-delivery.
      INSERT INTO private.task_notification_receipts(activity_event_id,user_id,organization_id)
      VALUES(e.id,auth.uid(),p_organization_id) ON CONFLICT DO NOTHING;
      IF FOUND THEN
        INSERT INTO public.notifications(user_id,organization_id,activity_event_id,module,priority,title,message,entity_id)
        VALUES(auth.uid(),p_organization_id,e.id,'tasks','info',e.task_title,
          'تحديث حالة المهمة / Task status updated: ' || (e.metadata->>'old_status') || ' → ' || (e.metadata->>'new_status'),e.entity_id);
        delivered:=delivered+1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- No raw errors/recipient details escape. Pending audit remains retryable.
      failed:=failed+1;
    END;
  END LOOP;
  RETURN jsonb_build_object('delivered',delivered,'failed',failed);
END;
$$;
REVOKE ALL ON FUNCTION public.deliver_task_transition_notifications(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.deliver_task_transition_notifications(uuid,integer) TO authenticated;
