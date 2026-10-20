import { canTransitionTask } from './task-status-contract';

export const TASK_REASON_COPY = {
  title: 'تأكيد انتقال المهمة / Confirm task transition',
  label: 'السبب (اختياري) / Reason (optional)',
  hint: 'حتى 1000 حرف. لا تتغير نسبة التقدم. / Up to 1000 characters. Progress is unchanged.',
  confirm: 'تأكيد / Confirm', cancel: 'إلغاء / Cancel',
  invalid: 'الانتقال غير مدعوم. / Unsupported transition.',
  tooLong: 'السبب يتجاوز 1000 حرف. / Reason exceeds 1000 characters.',
  uncertain: 'لم يتأكد الحفظ. حدّث البيانات قبل أي محاولة أخرى. / Save unconfirmed. Refresh before trying again.',
};
/** Existing SQL accepts optional reasons on every supported edge. No new policy. */
export function taskTransitionReason(from: unknown, to: unknown, value: unknown) {
  if (!canTransitionTask(from, to)) return { valid: false as const, error: TASK_REASON_COPY.invalid };
  if (typeof value !== 'string' || value.length > 1000) return { valid: false as const, error: TASK_REASON_COPY.tooLong };
  return { valid: true as const, reason: value.trim() || undefined };
}
