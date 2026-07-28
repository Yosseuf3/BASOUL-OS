import { supabase } from "@/lib/supabase";

export const ARCHITECTURAL_DRAWINGS_BUCKET = "architectural-drawings";

export type CloudDrawing = {
  id: string;
  user_id: string;
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

export async function listProjectDrawings(projectId?: string): Promise<CloudDrawing[]> {
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
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication is required.");
  const path = `${userData.user.id}/${input.projectId}/${crypto.randomUUID()}-${safeFileName(input.file.name)}`;
  const format = input.file.type === "application/pdf" ? "pdf" : "image";
  const { error: uploadError } = await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).upload(path, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from("architectural_drawings").insert({
    user_id: userData.user.id,
    project_id: input.projectId,
    name: input.file.name,
    format,
    revision: input.revision.trim().toUpperCase() || "A",
    storage_path: path,
    file_size: input.file.size,
    mime_type: input.file.type,
    page_count: input.pageCount,
  }).select("*").single();
  if (error) {
    await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).remove([path]);
    throw error;
  }
  return data as CloudDrawing;
}

export async function deleteProjectDrawing(drawing: CloudDrawing): Promise<void> {
  const { error: storageError } = await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).remove([drawing.storage_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("architectural_drawings").delete().eq("id", drawing.id);
  if (error) throw error;
}

export async function createDrawingPreviewUrl(drawing: Pick<CloudDrawing, "storage_path">): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ARCHITECTURAL_DRAWINGS_BUCKET)
    .createSignedUrl(drawing.storage_path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}
