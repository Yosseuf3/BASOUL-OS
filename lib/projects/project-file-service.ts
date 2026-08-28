import { supabase } from "@/lib/supabase";

export const PROJECT_FILES_BUCKET = "project-files";
export const MAX_PROJECT_FILE_SIZE = 100 * 1024 * 1024;

export type ProjectFile = {
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
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectFile[];
}

export async function uploadProjectFile(projectId: string, file: File): Promise<ProjectFile> {
  if (file.size > MAX_PROJECT_FILE_SIZE) throw new Error("حجم الملف يتجاوز الحد المسموح: 100 MB.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("يلزم تسجيل الدخول لرفع الملفات.");

  const organizationId = await projectOrganizationId(projectId);
  const storagePath = `${userData.user.id}/${projectId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const mimeType = file.type || "application/octet-stream";
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", contentType: mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from("project_files").insert({
    user_id: userData.user.id,
    organization_id: organizationId,
    project_id: projectId,
    name: file.name,
    storage_path: storagePath,
    file_size: file.size,
    mime_type: mimeType,
    category: categoryFor(file),
  }).select("*").single();
  if (error) {
    await supabase.storage.from(PROJECT_FILES_BUCKET).remove([storagePath]);
    throw error;
  }
  return data as ProjectFile;
}

export async function createProjectFileDownloadUrl(file: ProjectFile): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(file.storage_path, 60 * 10, { download: file.name });
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteProjectFile(file: ProjectFile): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .remove([file.storage_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("project_files").delete().eq("id", file.id);
  if (error) throw error;
}
