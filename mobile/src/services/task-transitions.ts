import { supabase } from '../config/supabase';
import type { Task } from '../types/domain';
import type { OrganizationContext } from '../organizations/context';
import { validateOrganizationContext } from './organizations';
import { TASK_WORKFLOW_WRITES_ENABLED, type CanonicalTaskStatus } from '../../../packages/shared-types/src/task-status-contract';
import { taskTransitionRpcArgs } from '../../../packages/shared-types/src/task-transition-client';

export async function transitionMobileTask(context: OrganizationContext, task: Task, target: CanonicalTaskStatus, reason?: string) {
  if (!TASK_WORKFLOW_WRITES_ENABLED) throw new Error('TASK_WORKFLOW_NOT_ACTIVATED');
  if (!supabase) throw new Error('Supabase is not configured.');
  await validateOrganizationContext(context,'update');
  const {error}=await supabase.rpc('transition_task_status',taskTransitionRpcArgs({
    taskId:task.id,organizationId:context.organizationId,expectedStatus:task.status,
    expectedUpdatedAt:task.updated_at,targetStatus:target,reason,
  }));
  if (error) throw error; // Existing operation boundary sanitizes and retains tenant context.
}
