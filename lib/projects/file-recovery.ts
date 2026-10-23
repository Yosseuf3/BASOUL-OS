import type {ProjectFile} from './project-file-service';
export type FileRecovery = {file:ProjectFile;sha256:string;phase:'pending'|'failed'|'completed'};
const prefix='basoul:file-recovery:';
export function recoveryKey(userId:string,organizationId:string){return `${prefix}${userId}:${organizationId}`;}
export function readFileRecovery(userId:string,organizationId:string):FileRecovery[]{
  try {const rows=JSON.parse(localStorage.getItem(recoveryKey(userId,organizationId))??'[]');return Array.isArray(rows)?rows.filter(row=>row?.file?.user_id===userId&&row.file.organization_id===organizationId&&typeof row.sha256==='string'):[];}catch{return [];}
}
export function writeFileRecovery(ticket:FileRecovery){
  const rows=readFileRecovery(ticket.file.user_id,ticket.file.organization_id).filter(row=>row.file.id!==ticket.file.id&&!(row.file.project_id===ticket.file.project_id&&row.file.name===ticket.file.name&&row.sha256===ticket.sha256));
  // Persist before dispatch. If persistence is unavailable, do not upload.
  try{localStorage.setItem(recoveryKey(ticket.file.user_id,ticket.file.organization_id),JSON.stringify(ticket.phase==='completed'?rows:[...rows,ticket]));}
  catch{throw new Error('تعذر حفظ حالة الاسترداد. تحقق من سجل المشروع قبل المحاولة. / Recovery status could not be saved. Check project records before retrying.');}
}
export async function fileDigest(file:Blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');}

/** Register first so accepted uploads always have a durable, scoped reference.
 * Keep the same ID/path across explicit retries; never overwrite or compensate
 * by deleting an object after an ambiguous response.
 */
export async function recoverFileUpload(ticket:FileRecovery,file:Blob,ports:{assertCurrent:()=>void;persist:(ticket:FileRecovery)=>void;register:()=>Promise<ProjectFile>;upload:()=>Promise<{error:unknown}>;download:()=>Promise<Blob>}) {
  ports.assertCurrent();
  if(file.size!==ticket.file.file_size||await fileDigest(file)!==ticket.sha256)throw new Error('اختر نفس الملف للاسترداد. / Select the same file to recover.');
  ports.assertCurrent();ticket={...ticket,phase:'pending'};ports.persist(ticket);
  try {
    const registered=await ports.register();ports.assertCurrent();
    if(registered.id!==ticket.file.id||registered.user_id!==ticket.file.user_id||registered.content_sha256!==ticket.sha256||registered.file_size!==file.size||registered.storage_path!==ticket.file.storage_path||registered.project_id!==ticket.file.project_id||registered.organization_id!==ticket.file.organization_id)throw new Error('File reference mismatch');
    const result=await ports.upload();ports.assertCurrent();
    if(result.error){
      // Covers duplicate upload and lost success responses. Confirm actual bytes
      // before reporting completion; no blind upsert or automatic second write.
      const existing=await ports.download();ports.assertCurrent();
      if(await fileDigest(existing)!==ticket.sha256)throw result.error;
    }
    ports.assertCurrent();ports.persist({...ticket,phase:'completed'});return registered;
  }catch{
    if(ticket.phase!=='completed')ports.persist({...ticket,phase:'failed'});
    throw new Error('لم يتأكد الرفع. احتُفظ بمرجع الاسترداد؛ اختر نفس الملف لإعادة المحاولة. / Upload unconfirmed. Recovery reference retained; select the same file to retry.');
  }
}
