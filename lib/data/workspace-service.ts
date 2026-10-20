import type { ActivityEvent, Client, ContentItem, FinanceTransaction, KnowledgeItem, Notification, Project, Task } from "@/lib/types";
import { listRows } from "@/lib/data/os-repository";
import { deliverTaskNotifications } from '../../packages/shared-types/src/task-notifications';
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

export type WorkspaceLoadResult = { data: WorkspaceData; errors: string[]; loadedAt: string; organizationId:string; role:string; organizations:{id:string;name:string}[] };
type RowResult<T> = { data: T[]; error: string | null };

async function safeRows<T>(label: string, request: Promise<RowResult<T>>): Promise<RowResult<T>> {
  try { return await request; }
  catch (error) { return { data: [], error: `${label}: ${error instanceof Error ? error.message : "تعذر الاتصال بالخدمة"}` }; }
}

export async function loadWorkspaceData(requestedOrganizationId?:string): Promise<WorkspaceLoadResult> {
  // Tenant creation is an explicit Owner onboarding action. Workspace reads must never create tenants.
  const {data:identity,error:identityError}=await supabase.auth.getUser();
  if(identityError || !identity.user) throw new Error('AUTH_REQUIRED');
  const { data: memberships, error: membershipError } = await supabase.from("organization_memberships")
    .select("organization_id,role,status,organizations(name)")
    .eq('user_id',identity.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (membershipError) throw new Error(`organization: ${membershipError.message}`);
  const membership=requestedOrganizationId ? memberships?.find(row=>row.organization_id===requestedOrganizationId) : memberships?.[0];
  if (!membership) throw new Error(requestedOrganizationId?'ORGANIZATION_ACCESS_REVOKED':'ORGANIZATION_ONBOARDING_REQUIRED');

  await deliverTaskNotifications(supabase,membership.organization_id);
  const [projects, tasks, clients, contentItems, knowledgeItems, financeItems, activityEvents, notifications] = await Promise.all([
    safeRows("projects", listRows<Project>("projects",membership.organization_id,identity.user.id)),
    safeRows("tasks", listRows<Task>("tasks",membership.organization_id,identity.user.id)),
    safeRows("clients", listRows<Client>("clients",membership.organization_id,identity.user.id)),
    safeRows("content", listRows<ContentItem>("content_items",membership.organization_id,identity.user.id)),
    safeRows("knowledge", listRows<KnowledgeItem>("knowledge_items",membership.organization_id,identity.user.id)),
    safeRows("finance", listRows<FinanceTransaction>("finance_transactions",membership.organization_id,identity.user.id)),
    safeRows("activity", listRows<ActivityEvent>("activity_events",membership.organization_id,identity.user.id)),
    safeRows("notifications", listRows<Notification>("notifications",membership.organization_id,identity.user.id)),
  ]);

  const errors = [projects.error, tasks.error, clients.error, contentItems.error, knowledgeItems.error, financeItems.error, activityEvents.error, notifications.error].filter((value): value is string => Boolean(value));
  return {
    data: {
      projects: projects.data, tasks: tasks.data.filter(task=>!task.archived), clients: clients.data,
      contentItems: contentItems.data, knowledgeItems: knowledgeItems.data,
      financeItems: financeItems.data, activityEvents: activityEvents.data,
      notifications: notifications.data,
    },
    errors,
    loadedAt: new Date().toISOString(),
    organizationId:membership.organization_id,
    role:membership.role,
    organizations:(memberships??[]).map(row=>{
      const relation=row.organizations as unknown as {name:string}|{name:string}[]|null;
      return {id:row.organization_id,name:(Array.isArray(relation)?relation[0]?.name:relation?.name)??row.organization_id};
    }),
  };
}
