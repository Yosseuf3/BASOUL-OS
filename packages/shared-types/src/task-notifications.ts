import { TASK_WORKFLOW_WRITES_ENABLED } from './task-status-contract';

/** Separate from mutation confirmation: delivery failure never retries a task write. */
export async function deliverTaskNotifications(
  database: { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{error: unknown}> },
  organizationId: string,
) {
  if (!TASK_WORKFLOW_WRITES_ENABLED || !organizationId) return;
  try { await database.rpc('deliver_task_transition_notifications', {p_organization_id:organizationId,p_limit:10}); }
  catch { /* Durable audit remains pending for the next authorized refresh. */ }
}

export function taskNotificationTarget(notification: {module?: unknown;entity_id?: unknown}, taskIds: readonly string[]) {
  return notification.module==='tasks' && typeof notification.entity_id==='string' && taskIds.includes(notification.entity_id)
    ? notification.entity_id : null;
}
