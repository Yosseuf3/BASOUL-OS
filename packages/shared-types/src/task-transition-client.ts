import { canTransitionTask, isTaskStatus, type CanonicalTaskStatus } from './task-status-contract';

export type TaskTransitionRequest = {
  taskId: string; organizationId: string; expectedStatus: CanonicalTaskStatus;
  // Opaque PostgreSQL microsecond timestamp. Never round-trip through JS Date.
  expectedUpdatedAt: string; targetStatus: CanonicalTaskStatus; reason?: string;
};
export function taskTransitionRpcArgs(input: TaskTransitionRequest) {
  if (typeof input.taskId!=='string' || typeof input.organizationId!=='string' || !input.taskId || !input.organizationId
    || typeof input.expectedUpdatedAt!=='string' || !input.expectedUpdatedAt
    || !isTaskStatus(input.expectedStatus) || !isTaskStatus(input.targetStatus)
    || !canTransitionTask(input.expectedStatus,input.targetStatus)) throw new Error('TASK_TRANSITION_REJECTED');
  if (input.reason!==undefined && (typeof input.reason!=='string' || input.reason.length>1000)) throw new Error('TASK_REASON_TOO_LONG');
  return { p_task_id: input.taskId, p_organization_id: input.organizationId,
    p_expected_status: input.expectedStatus, p_expected_updated_at: input.expectedUpdatedAt,
    p_target_status: input.targetStatus, p_reason: input.reason ?? null };
}
export function taskTransitionError(cause: unknown) {
  const error = cause && typeof cause==='object' ? cause as {code?:unknown; message?:unknown} : {};
  if (error.code==='PT409' || error.code==='40001') return {code:'TASK_TRANSITION_CONFLICT',status:409,message:'تغيرت المهمة. حدّث البيانات وراجع الحالة قبل المحاولة مجدداً.'};
  if (error.code==='42501') return {code:'TASK_TRANSITION_FORBIDDEN',status:403,message:'ليست لديك صلاحية تحديث هذه المهمة.'};
  if (typeof error.code==='string' && error.code.startsWith('22')) return {code:'TASK_TRANSITION_REJECTED',status:400,message:'رفضت المنصة هذا الانتقال. لم تُعد المحاولة تلقائياً.'};
  return {code:'TASK_TRANSITION_UNCONFIRMED',status:503,message:'لم يتأكد حفظ العملية. حدّث البيانات للتحقق؛ لا تُعد المحاولة تلقائياً.'};
}
