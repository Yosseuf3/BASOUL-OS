import { supabase } from '../config/supabase';
import type { Task } from '../types/domain';
import type { OrganizationContext } from '../organizations/context';
import { validateOrganizationContext } from './organizations';
import { TASK_WORKFLOW_WRITES_ENABLED, type CanonicalTaskStatus } from '../../../packages/shared-types/src/task-status-contract';
import { confirmedTaskTransition, taskTransitionRpcArgs, type TaskTransitionRequest } from '../../../packages/shared-types/src/task-transition-client';

export async function transitionMobileTask(context: OrganizationContext, task: Task, target: CanonicalTaskStatus, reason?: string) {
  if (!TASK_WORKFLOW_WRITES_ENABLED) throw {code:'TASK_UPDATE_REQUIRED'};
  if (!supabase) throw new Error('Supabase is not configured.');
  await validateOrganizationContext(context,'update');
  const input: TaskTransitionRequest = {
    taskId:task.id,organizationId:context.organizationId,expectedStatus:task.status,
    expectedUpdatedAt:task.updated_at,targetStatus:target,reason,
  };
  const {data,error}=await supabase.rpc('transition_task_status',taskTransitionRpcArgs(input));
  if (error) throw error; // Existing operation boundary sanitizes and retains tenant context.
  if (!confirmedTaskTransition(data,input)) throw {code:'TASK_TRANSITION_UNCONFIRMED'};
}
