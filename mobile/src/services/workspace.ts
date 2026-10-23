import {requireFindingDecisionVersion,findingDecisionConflict} from "../../../packages/shared-types/src/finding-decision";
import {conversionArguments,confirmedConversion,conversionFailure} from '../../../packages/shared-types/src/project-conversion';
import {mobileOrganizationClient} from '../organizations/context';
import { fetch } from "expo/fetch";
import type { ArchitecturalDrawing, ArchitecturalFinding, ArchitecturalPlanElement, ArchitecturalReview, ArchitecturalReviewComment, MobileWorkspaceData, Notification, Project, Task } from "../types/domain";
import type { OrganizationContext } from "../organizations/context";
import { requireOrganizationRecord, validateOrganizationContext } from "./organizations";
import { assertLegacyTaskWrite, TASK_WORKFLOW_WRITES_ENABLED } from "../../../packages/shared-types/src/task-status-contract";
import { deliverTaskNotifications } from '../../../packages/shared-types/src/task-notifications';
import { transitionMobileTask } from './task-transitions';

const ARCHITECTURAL_DRAWINGS_BUCKET = "architectural-drawings";

export type MobileDrawingFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export type MobileDrawingAnalysisResult = {
  drawingId: string;
  analysisStatus: "completed" | "needs_better_source";
  detectedElements: number;
  failureCode: string | null;
  retryable: boolean;
};

export type MobileFindingDecision = Extract<
  ArchitecturalFinding["status"],
  "accepted" | "rejected" | "resolved"
>;

const safeFileName = (name: string) =>
  name.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").toLowerCase();

export async function loadMobileWorkspace(context: OrganizationContext): Promise<MobileWorkspaceData> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context);

  await deliverTaskNotifications(supabase,context.organizationId);
  const [projectsResult, tasksResult, notificationsResult, drawingsResult, reviewsResult, planElementsResult, reviewCommentsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,status,priority,progress,client_name,project_number,location,design_phase,due_date,updated_at")
      .eq("organization_id", context.organizationId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("tasks")
        .select("*")
      .eq("organization_id", context.organizationId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("notifications")
      .select("id,title,message,priority,is_read,created_at,module,entity_id,source_kind")
      .eq("organization_id", context.organizationId).eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("architectural_drawings")
      .select("id,project_id,name,revision,format,status,page_count,created_at")
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("architectural_reviews")
      .select("id,drawing_id,project_id,status,plan_health,created_at,architectural_review_findings(id,review_id,drawing_id,analysis_run_id,code,title,description,recommendation,severity,status,confidence_score,evidence,task_id,updated_at)")
      .eq("organization_id", context.organizationId)
      .eq("architectural_review_findings.organization_id", context.organizationId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("architectural_plan_elements")
      .select("id,project_id,drawing_id,element_type,label,value,unit,geometry,confidence_score,source,status,notes,created_at")
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("architectural_review_comments")
      .select("id,project_id,drawing_id,plan_element_id,finding_id,page_number,geometry,body,status,resolved_at,created_at,updated_at")
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const firstError = projectsResult.error ?? tasksResult.error ?? notificationsResult.error ?? drawingsResult.error ?? reviewsResult.error ?? planElementsResult.error ?? reviewCommentsResult.error;
  if (firstError) throw firstError;

  return {
    projects: (projectsResult.data ?? []) as Project[],
    tasks: ((tasksResult.data ?? []) as Task[]).filter(task=>!task.archived),
    notifications: (notificationsResult.data ?? []) as Notification[],
    drawings: (drawingsResult.data ?? []) as ArchitecturalDrawing[],
    reviews: (reviewsResult.data ?? []) as ArchitecturalReview[],
    planElements: (planElementsResult.data ?? []) as ArchitecturalPlanElement[],
    reviewComments: (reviewCommentsResult.data ?? []) as ArchitecturalReviewComment[],
  };
}

export async function updateMobileReviewCommentStatus(
  context: OrganizationContext,
  commentId: string,
  status: ArchitecturalReviewComment["status"],
): Promise<void> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "update");
  const resolvedAt = status === "resolved" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("architectural_review_comments")
    .update({ status, resolved_at: resolvedAt, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("organization_id", context.organizationId).eq("user_id", context.userId)
    .select("id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("تعذر تحديث ملاحظة المراجعة.");
}

export async function updateMobilePlanElementStatus(
  context: OrganizationContext,
  elementId: string,
  status: "confirmed" | "rejected",
): Promise<void> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "update");
  const { error } = await supabase
    .from("architectural_plan_elements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", elementId)
    .eq("organization_id", context.organizationId).eq("user_id", context.userId).select("id").single();
  if (error) throw error;
}

export async function convertMobileFindingToTask(context:OrganizationContext,projectId:string,finding:ArchitecturalFinding):Promise<string> {
  const supabase=mobileOrganizationClient(context);
  await validateOrganizationContext(context,'create');
  await requireOrganizationRecord(context,'projects',projectId);
  const input={userId:context.userId,organizationId:context.organizationId,projectId,sourceKind:'finding' as const,sourceId:finding.id,updatedAt:finding.updated_at};
  const {data,error}=await supabase.rpc('convert_project_source_to_task',conversionArguments(input));
  if(error)throw conversionFailure(error);return confirmedConversion(data,input);
}

export async function updateMobileFindingDecision(
  context: OrganizationContext,
  finding: Pick<ArchitecturalFinding, "id" | "review_id"> & Partial<Pick<ArchitecturalFinding, "updated_at">>,
  status: MobileFindingDecision,
): Promise<void> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "update");
  requireFindingDecisionVersion(finding.updated_at,status);
  const { data: updatedFinding, error } = await supabase
    .from("architectural_review_findings")
    .update({ status })
    .eq("updated_at", finding.updated_at)
    .eq("review_id", finding.review_id)
    .in("status", ["open", "accepted", "rejected", "resolved"])
    .eq("id", finding.id)
    .eq("organization_id", context.organizationId).eq("user_id", context.userId)
    .select("id")
    .single();
  if (error?.code === "PGRST116") throw findingDecisionConflict();
  if (error) throw error;
  if (!updatedFinding) throw findingDecisionConflict();

  // Preserve analysis status; finding decisions must not fabricate completion.
}

export async function uploadMobileDrawing(
  context: OrganizationContext,
  projectId: string,
  revision: string,
  file: MobileDrawingFile,
): Promise<MobileDrawingAnalysisResult> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "create");
  await requireOrganizationRecord(context, "projects", projectId);
  const userId = context.userId;
  const supportedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
  if (!supportedTypes.has(file.mimeType)) throw new Error("نوع الملف غير مدعوم.");
  if (file.size > 50 * 1024 * 1024) throw new Error("حجم الملف يتجاوز الحد المسموح: 50 MB.");
  const response = await fetch(file.uri);
  if (!response.ok) throw new Error("تعذر قراءة الملف المحدد من الجهاز.");
  const body = await response.arrayBuffer();
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${projectId}/${uploadId}-${safeFileName(file.name)}`;
  const format = file.mimeType === "application/pdf" ? "pdf" : "image";

  const { error: uploadError } = await supabase.storage
    .from(ARCHITECTURAL_DRAWINGS_BUCKET)
    .upload(path, body, {
      cacheControl: "3600",
      contentType: file.mimeType,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data: drawing, error: drawingError } = await supabase
    .from("architectural_drawings")
    .insert({
      user_id: userId,
      organization_id: context.organizationId,
      project_id: projectId,
      name: file.name,
      format,
      revision: revision.trim().toUpperCase() || "A",
      storage_path: path,
      file_size: file.size || body.byteLength,
      mime_type: file.mimeType,
      page_count: null,
    })
    .select("id")
    .single();
  if (drawingError) {
    await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).remove([path]);
    throw drawingError;
  }

  const { data: analysis, error: analysisError } = await supabase.functions.invoke(
    "architectural-analyze-v2",
    { body: { drawingId: drawing.id } },
  );
  if (analysisError || !analysis?.review) {
    await supabase.from("architectural_drawings").delete().eq("id", drawing.id).eq("organization_id", context.organizationId).eq("user_id", context.userId);
    await supabase.storage.from(ARCHITECTURAL_DRAWINGS_BUCKET).remove([path]);
    throw analysisError ?? new Error(analysis?.error ?? "فشل تحليل المخطط.");
  }
  return {
    drawingId: drawing.id as string,
    analysisStatus: analysis.analysisStatus === "needs_better_source" ? "needs_better_source" : "completed",
    detectedElements: Array.isArray(analysis.planElements) ? analysis.planElements.length : 0,
    failureCode: typeof analysis.failureCode === "string" ? analysis.failureCode : null,
    retryable: Boolean(analysis.retryable),
  };
}

export async function retryMobileDrawingAnalysis(context: OrganizationContext, drawingId: string): Promise<MobileDrawingAnalysisResult> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "create");
  await requireOrganizationRecord(context, "architectural_drawings", drawingId);
  const { data: analysis, error } = await supabase.functions.invoke(
    "architectural-analyze-v2",
    { body: { drawingId, retry: true } },
  );
  if (error || !analysis?.review) throw error ?? new Error(analysis?.error ?? "فشلت إعادة تحليل المخطط.");
  return {
    drawingId,
    analysisStatus: analysis.analysisStatus === "needs_better_source" ? "needs_better_source" : "completed",
    detectedElements: Array.isArray(analysis.planElements) ? analysis.planElements.length : 0,
    failureCode: typeof analysis.failureCode === "string" ? analysis.failureCode : null,
    retryable: Boolean(analysis.retryable),
  };
}

export async function markMobileNotificationRead(context: OrganizationContext, notificationId: string): Promise<void> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "update");
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId).eq("organization_id", context.organizationId).eq("user_id", context.userId).select("id").single();
  if (error) throw error;
}

export async function createMobileTask(context: OrganizationContext, input: { title: string; project_id: string; priority: string; due_date: string | null }): Promise<void> {
  const supabase=mobileOrganizationClient(context);
  if (!supabase) throw new Error("Supabase is not configured.");
  await validateOrganizationContext(context, "create");
  if (input.project_id) await requireOrganizationRecord(context, "projects", input.project_id);
  const { error } = await supabase.from("tasks").insert({
    user_id: context.userId,
    organization_id: context.organizationId,
    project_id: input.project_id || null,
    title: input.title,
    priority: input.priority,
    due_date: input.due_date,
    status: "To Do",
    progress: 0,
  });
  if (error) throw error;
}

export async function advanceMobileTask(context: OrganizationContext, task: Task): Promise<void> {
  if (!TASK_WORKFLOW_WRITES_ENABLED) throw Object.assign(new Error('TASK_UPDATE_REQUIRED'),{code:'TASK_UPDATE_REQUIRED'});
  await transitionMobileTask(context,task,'In Progress');
}

export async function openMobileMembershipNotification(context:OrganizationContext,id:string):Promise<void>{await validateOrganizationContext(context);const client=mobileOrganizationClient(context);if(!client)throw new Error('Not configured');const {data,error}=await client.rpc('membership_notification_target',{p_organization_id:context.organizationId,p_notification_id:id});if(error||data?.view!=='administration'||data.organization_id!==context.organizationId||typeof data.member_id!=='string')throw Object.assign(new Error('Membership link unavailable'),{code:'MEMBERSHIP_LINK_UNAVAILABLE'});}
