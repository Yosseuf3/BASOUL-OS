import { recordActivity } from "@/lib/events/activity-service";
import { supabase } from "@/lib/supabase";

export type ProjectNoteType = "decision" | "meeting" | "review" | "general";
export type ProjectNoteStatus = "open" | "done" | "archived";

export type ProjectNote = {
  id: string;
  user_id: string;
  project_id: string;
  project_file_id: string | null;
  type: ProjectNoteType;
  title: string;
  content: string | null;
  status: ProjectNoteStatus;
  assigned_to: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectNoteInput = Pick<ProjectNote, "project_id" | "project_file_id" | "type" | "title" | "content" | "assigned_to" | "follow_up_date">;

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("يلزم تسجيل الدخول.");
  return data.user.id;
}

export async function listProjectNotes(projectId: string): Promise<ProjectNote[]> {
  const { data, error } = await supabase.from("project_notes").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectNote[];
}

export async function createProjectNote(input: ProjectNoteInput): Promise<ProjectNote> {
  const userId = await currentUserId();
  const { data, error } = await supabase.from("project_notes").insert({ ...input, user_id: userId }).select("*").single();
  if (error) throw error;
  await recordActivity({
    userId, module: "projects", action: "created", title: `ملاحظة مشروع: ${input.title}`,
    entityId: input.project_id, description: input.type, metadata: { project_note_id: data.id },
  });
  return data as ProjectNote;
}

export async function setProjectNoteStatus(note: ProjectNote, status: ProjectNoteStatus): Promise<void> {
  const { error } = await supabase.from("project_notes").update({ status }).eq("id", note.id);
  if (error) throw error;
}

export async function deleteProjectNote(note: ProjectNote): Promise<void> {
  const { error } = await supabase.from("project_notes").delete().eq("id", note.id);
  if (error) throw error;
}

export async function convertProjectNoteToTask(note: ProjectNote): Promise<void> {
  const userId = await currentUserId();
  const { data, error } = await supabase.from("tasks").insert({
    user_id: userId,
    project_id: note.project_id,
    title: note.title,
    description: note.content,
    status: "To Do",
    priority: note.type === "decision" || note.type === "review" ? "High" : "Medium",
    progress: 0,
    due_date: note.follow_up_date,
  }).select("id").single();
  if (error) throw error;
  await setProjectNoteStatus(note, "done");
  await recordActivity({
    userId, module: "tasks", action: "created", title: `تم تحويل الملاحظة إلى مهمة: ${note.title}`,
    entityId: data.id, description: note.type, metadata: { project_note_id: note.id, project_id: note.project_id },
  });
}
