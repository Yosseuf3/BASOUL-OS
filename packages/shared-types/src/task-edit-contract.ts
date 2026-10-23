/** Transport metadata is never part of a task's editable business fields. */
export function taskEditExpectation(input: Record<string, unknown>) {
  if (typeof input.expectedUpdatedAt !== 'string' || !input.expectedUpdatedAt.trim()) return null;
  return input.expectedUpdatedAt;
}
export const TASK_EDIT_CONFLICT = {
  code: 'TASK_EDIT_CONFLICT',
  error: 'تغيرت المهمة. حدّث البيانات قبل المحاولة. / Task changed. Refresh before trying again.',
};
export const TASK_CLIENT_UPDATE_REQUIRED = {
  code: 'TASK_UPDATE_REQUIRED',
  error: 'حدّث التطبيق لاستخدام تعديل المهام الآمن. / Update the app to edit tasks safely.',
};
