import {requireOrganizationLease} from '../organizations/active-context';
import {assertOrganizationLease} from '../../packages/shared-types/src/organization-scope';
import {fileDigest,readFileRecovery,writeFileRecovery,recoverFileUpload,type FileRecovery} from './file-recovery';
import {organizationClient} from '../organizations/scoped-client';

export const PROJECT_FILES_BUCKET = "project-files";
export const MAX_PROJECT_FILE_SIZE = 100 * 1024 * 1024;

export type ProjectFile = {
  content_sha256?: string | null;
  id: string;
  user_id: string;
  organization_id: string;
  project_id: string;
  name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  category: "drawing" | "document" | "image" | "model" | "other";
  created_at: string;
  updated_at: string;
};

const safeFileName = (name: string) =>
  name.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").toLowerCase();

const categoryFor = (file: File): ProjectFile["category"] => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (["dwg", "dxf"].includes(extension ?? "")) return "drawing";
  if (["ifc", "rvt", "nwd", "nwc"].includes(extension ?? "")) return "model";
  if (file.type.startsWith("image/")) return "image";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension ?? "")) return "document";
  return "other";
};

async function projectOrganizationId(projectId: string): Promise<string> {
  const supabase=organizationClient();
  const { data, error } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", projectId)
    .single();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("تعذر تحديد مؤسسة المشروع.");
  return data.organization_id as string;
}

export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const supabase=organizationClient();
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectFile[];
}

export async function uploadProjectFile(projectId:string,file:File):Promise<ProjectFile> {
  const lease=requireOrganizationLease();const supabase=organizationClient();
  if(!file.name||file.name.length>255||file.size>MAX_PROJECT_FILE_SIZE)throw new Error('راجع اسم الملف وحجمه (100 MB). / Check file name and size (100 MB).');
  await projectOrganizationId(projectId);assertOrganizationLease(lease);
  const digest=await fileDigest(file);assertOrganizationLease(lease);
  const durable=await supabase.from('project_files').select('*').eq('project_id',projectId).eq('user_id',lease.userId).eq('name',file.name).eq('content_sha256',digest).maybeSingle();
  if(durable.error)throw new Error('يتطلب استرداد الملفات تحديث قاعدة البيانات المراجع. / File recovery requires the reviewed database update.');
  const previous=readFileRecovery(lease.userId,lease.organizationId).find(t=>t.file.project_id===projectId&&t.sha256===digest&&t.file.name===file.name);
  const id=durable.data?.id??previous?.file.id??crypto.randomUUID();
  const ticket:FileRecovery=durable.data?{sha256:digest,phase:'pending',file:durable.data as ProjectFile}:previous??{sha256:digest,phase:'pending',file:{id,content_sha256:digest,user_id:lease.userId,organization_id:lease.organizationId,project_id:projectId,name:file.name,storage_path:lease.userId+'/'+projectId+'/'+id+'-'+safeFileName(file.name),file_size:file.size,mime_type:file.type||'application/octet-stream',category:categoryFor(file),created_at:new Date().toISOString(),updated_at:new Date().toISOString()}};
  return recoverFileUpload(ticket,file,{
    assertCurrent:()=>assertOrganizationLease(lease),persist:writeFileRecovery,
    register:async()=>{
      const existing=await supabase.from('project_files').select('*').eq('id',ticket.file.id).maybeSingle();
      if(existing.error)throw existing.error;if(existing.data)return existing.data as ProjectFile;
      const {created_at,updated_at,...payload}=ticket.file;void created_at;void updated_at;
      const result=await supabase.from('project_files').insert(payload).select('*').single();
      if(result.error){const confirmed=await supabase.from('project_files').select('*').eq('id',ticket.file.id).single();if(confirmed.error)throw result.error;return confirmed.data as ProjectFile;}
      return result.data as ProjectFile;
    },
    upload:()=>supabase.storage.from(PROJECT_FILES_BUCKET).upload(ticket.file.storage_path,file,{contentType:ticket.file.mime_type,upsert:false}),
    download:async()=>{const result=await supabase.storage.from(PROJECT_FILES_BUCKET).download(ticket.file.storage_path);if(result.error)throw result.error;return result.data;},
  });
}
export function pendingProjectFiles(projectId:string){const lease=requireOrganizationLease();return readFileRecovery(lease.userId,lease.organizationId).filter(ticket=>ticket.file.project_id===projectId&&ticket.phase!=='completed');}

export async function createProjectFileDownloadUrl(file: ProjectFile): Promise<string> {
  const lease=requireOrganizationLease(file.organization_id);
  if(file.user_id!==lease.userId)throw new Error('هذا الملف غير مشترك مع حسابك وفق الصلاحيات الحالية. / This file is not shared with your account under the current access policy.');
  const supabase=organizationClient(file.organization_id);
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(file.storage_path, 60, { download: file.name });
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteProjectFile(file:ProjectFile):Promise<void> {
  requireOrganizationLease(file.organization_id);
  throw new Error('حُفظ الملف ومراجعه. الحذف النهائي يتطلب سياسة احتفاظ واسترداد معتمدة. / File and references retained. Physical deletion requires an approved retention and recovery policy.');
}
