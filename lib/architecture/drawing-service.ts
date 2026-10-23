import {organizationClient} from '../organizations/scoped-client';

export const ARCHITECTURAL_DRAWINGS_BUCKET = "architectural-drawings";

export type CloudDrawing = {
  id: string;
  user_id: string;
  organization_id: string;
  project_id: string;
  name: string;
  format: "pdf" | "image";
  revision: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  page_count: number | null;
  status: "uploaded" | "reviewed" | "archived";
  created_at: string;
  updated_at: string;
};

const safeFileName = (name: string) =>
  name.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").toLowerCase();

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

export async function listProjectDrawings(projectId?: string): Promise<CloudDrawing[]> {
  const supabase=organizationClient();
  let query = supabase.from("architectural_drawings").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CloudDrawing[];
}

export async function uploadProjectDrawing(input: {
  projectId: string;
  file: File;
  revision: string;
  pageCount: number | null;
}): Promise<CloudDrawing> {
  const supabase=organizationClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication is required.");

  const organizationId = await projectOrganizationId(input.projectId);
  const path = `${userData.user.id}/${input.projectId}/${crypto.randomUUID()}-${safeFileName(input.file.name)}`;
  const format = input.file.type === "application/pdf" ? "pdf" : "image";
  const mimeType = input.file.type || "application/octet-stream";
  const { error: uploadError } = await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).upload(path, input.file, {
    cacheControl: "3600",
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from("architectural_drawings").insert({
    user_id: userData.user.id,
    organization_id: organizationId,
    project_id: input.projectId,
    name: input.file.name,
    format,
    revision: input.revision.trim().toUpperCase() || "A",
    storage_path: path,
    file_size: input.file.size,
    mime_type: mimeType,
    page_count: input.pageCount,
  }).select("*").single();
  if (error) {
    await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).remove([path]);
    throw error;
  }
  return data as CloudDrawing;
}

export async function deleteProjectDrawing(drawing: CloudDrawing): Promise<void> {
  organizationClient(drawing.organization_id);
  // Removing bytes first could destroy a source before a converted finding's
  // history guard rejects the later metadata cascade. Retain both instead.
  throw new Error('حُفظ المخطط ومراجعاته. الحذف النهائي يتطلب سياسة احتفاظ واسترداد معتمدة. / Drawing and reviews retained. Physical deletion requires an approved retention and recovery policy.');
}

export async function createDrawingPreviewUrl(drawing: Pick<CloudDrawing, "storage_path"|"organization_id">): Promise<string> {
  const supabase=organizationClient(drawing.organization_id);
  const { data, error } = await supabase.storage
    .from(ARCHITECTURAL_DRAWINGS_BUCKET)
    .createSignedUrl(drawing.storage_path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}
