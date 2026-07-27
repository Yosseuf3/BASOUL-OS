import { supabase } from "../config/supabase";
import type { ArchitecturalDrawing, ArchitecturalFinding, ArchitecturalReview, MobileWorkspaceData, Notification, Project, Task } from "../types/domain";

export async function loadMobileWorkspace(userId: string): Promise<MobileWorkspaceData> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const [projectsResult, tasksResult, notificationsResult, drawingsResult, reviewsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,status,priority,progress,client_name,project_number,location,design_phase,due_date,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id,project_id,title,status,priority,progress,due_date")
      .eq("user_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("notifications")
      .select("id,title,message,priority,is_read,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("architectural_drawings")
      .select("id,project_id,name,revision,format,status,page_count,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("architectural_reviews")
      .select("id,drawing_id,project_id,status,plan_health,created_at,architectural_review_findings(id,review_id,drawing_id,code,title,description,recommendation,severity,status,confidence_score,task_id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const firstError = projectsResult.error ?? tasksResult.error ?? notificationsResult.error ?? drawingsResult.error ?? reviewsResult.error;
  if (firstError) throw firstError;

  return {
    projects: (projectsResult.data ?? []) as Project[],
    tasks: (tasksResult.data ?? []) as Task[],
    notifications: (notificationsResult.data ?? []) as Notification[],
    drawings: (drawingsResult.data ?? []) as ArchitecturalDrawing[],
    reviews: (reviewsResult.data ?? []) as ArchitecturalReview[],
  };
}

export async function convertMobileFindingToTask(
  userId: string,
  projectId: string,
  finding: ArchitecturalFinding,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const priority =
    finding.severity === "critical" ? "Critical" :
    finding.severity === "warning" ? "High" : "Medium";
  const { data: task, error } = await supabase.from("tasks").insert({
    user_id: userId,
    project_id: projectId,
    title: finding.title,
    description: `${finding.description}\n\nالتوصية: ${finding.recommendation}`,
    priority,
    status: "To Do",
    progress: 0,
  }).select("id").single();
  if (error) throw error;
  const { error: findingError } = await supabase
    .from("architectural_review_findings")
    .update({ status: "converted_to_task", task_id: task.id })
    .eq("id", finding.id);
  if (findingError) throw findingError;
}

export async function markMobileNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function createMobileTask(userId: string, input: { title: string; project_id: string; priority: string; due_date: string | null }): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    project_id: input.project_id,
    title: input.title,
    priority: input.priority,
    due_date: input.due_date,
    status: "To Do",
    progress: 0,
  });
  if (error) throw error;
}

export async function advanceMobileTask(task: Task): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const next: Record<Task["status"], { status: Task["status"]; progress: number }> = {
    "To Do": { status: "In Progress", progress: Math.max(15, task.progress) },
    "In Progress": { status: "Review", progress: Math.max(80, task.progress) },
    Review: { status: "Done", progress: 100 },
    Done: { status: "Done", progress: 100 },
  };
  const { error } = await supabase.from("tasks").update(next[task.status]).eq("id", task.id);
  if (error) throw error;
}
