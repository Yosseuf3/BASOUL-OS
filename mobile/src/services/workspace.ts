import { supabase } from "../config/supabase";
import type { MobileWorkspaceData, Notification, Project, Task } from "../types/domain";

export async function loadMobileWorkspace(userId: string): Promise<MobileWorkspaceData> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const [projectsResult, tasksResult, notificationsResult] = await Promise.all([
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
  ]);

  const firstError = projectsResult.error ?? tasksResult.error ?? notificationsResult.error;
  if (firstError) throw firstError;

  return {
    projects: (projectsResult.data ?? []) as Project[],
    tasks: (tasksResult.data ?? []) as Task[],
    notifications: (notificationsResult.data ?? []) as Notification[],
  };
}

export async function markMobileNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}
