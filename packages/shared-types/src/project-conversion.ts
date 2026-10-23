export type ProjectConversion = {userId:string;organizationId:string;projectId:string;sourceKind:'note'|'finding';sourceId:string;updatedAt:string};
export function conversionArguments(input:ProjectConversion) {
  if(!input.updatedAt)throw new Error('حدّث المصدر قبل التحويل. / Refresh the source before converting.');
  return {p_organization_id:input.organizationId,p_project_id:input.projectId,p_source_kind:input.sourceKind,p_source_id:input.sourceId,p_expected_updated_at:input.updatedAt};
}
export function confirmedConversion(data:unknown,input:ProjectConversion):string {
  const row=Array.isArray(data)?data[0]:data;
  if(!row||typeof row!=='object')throw new Error('لم يتأكد التحويل. حدّث المصدر؛ لا تنشئ مهمة بديلة. / Conversion unconfirmed. Refresh the source; do not create a replacement task.');
  const task=row as {id?:unknown;user_id?:unknown;organization_id?:unknown;project_id?:unknown};
  if(typeof task.id!=='string'||!task.id||task.user_id!==input.userId||task.organization_id!==input.organizationId||task.project_id!==input.projectId)throw new Error('نتيجة التحويل غير مؤكدة. / Conversion result is unconfirmed.');
  return task.id;
}
export function conversionFailure(error:{code?:string}|null):Error {
  return new Error(error?.code==='PGRST202'?'يتطلب التحويل الآمن تحديث قاعدة البيانات. / Safe conversion requires the reviewed database update.':error?.code==='PT409'?'تغير المصدر. حدّث البيانات قبل التحويل. / Source changed. Refresh before converting.':'تعذر تأكيد التحويل. حدّث المصدر ثم أعد نفس العملية بأمان. / Conversion unconfirmed. Refresh and retry the same source safely.');
}
