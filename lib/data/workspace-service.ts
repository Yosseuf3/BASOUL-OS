import type { ActivityEvent, Client, ContentItem, FinanceTransaction, KnowledgeItem, Notification, Project, Task } from "@/lib/types";
import { listRows } from "@/lib/data/os-repository";
import { supabase } from "@/lib/supabase";

export type WorkspaceData = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  contentItems: ContentItem[];
  knowledgeItems: KnowledgeItem[];
  financeItems: FinanceTransaction[];
  activityEvents: ActivityEvent[];
  notifications: Notification[];
};

export type WorkspaceLoadResult = { data: WorkspaceData; errors: string[]; loadedAt: string };

type RowResult<T> = { data: T[]; error: string | null };

async function safeRows<T>(label: string, request: Promise<RowResult<T>>): Promise<RowResult<T>> {
  try { return await request; }
  catch (error) { return { data: [], error: `${label}: ${error instanceof Error ? error.message : "تعذر الاتصال بالخدمة"}` }; }
}

export async function loadWorkspaceData(): Promise<WorkspaceLoadResult> {
  const { error: organizationError } = await supabase.rpc("ensure_personal_organization");
  if (organizationError) throw new Error(`organization: ${organizationError.message}`);
  const [projects, tasks, clients, contentItems, knowledgeItems, financeItems, activityEvents, notifications] = await Promise.all([
    safeRows("projects", listRows<Project>("projects")),
    safeRows("tasks", listRows<Task>("tasks")),
    safeRows("clients", listRows<Client>("clients")),
    safeRows("content", listRows<ContentItem>("content_items")),
    safeRows("knowledge", listRows<KnowledgeItem>("knowledge_items")),
    safeRows("finance", listRows<FinanceTransaction>("finance_transactions")),
    safeRows("activity", listRows<ActivityEvent>("activity_events")),
    safeRows("notifications", listRows<Notification>("notifications")),
  ]);

  const errors = [projects.error, tasks.error, clients.error, contentItems.error, knowledgeItems.error, financeItems.error, activityEvents.error, notifications.error].filter((value): value is string => Boolean(value));
  return {
    data: {
      projects: projects.data, tasks: tasks.data, clients: clients.data,
      contentItems: contentItems.data, knowledgeItems: knowledgeItems.data,
      financeItems: financeItems.data, activityEvents: activityEvents.data,
      notifications: notifications.data,
    },
    errors,
    loadedAt: new Date().toISOString(),
  };
}
