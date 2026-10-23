import {requireFindingDecisionVersion,findingDecisionConflict} from "../../packages/shared-types/src/finding-decision";
import {conversionArguments,confirmedConversion,conversionFailure} from '../../packages/shared-types/src/project-conversion';
import {requireOrganizationLease} from '../organizations/active-context';
import type { ArchitecturalReviewReport } from "@yosseuf/architectural-intelligence";
import {organizationClient} from "../organizations/scoped-client";

export type CloudReviewFinding = {
  id: string;
  review_id: string;
  drawing_id: string;
  user_id: string;
  code: string;
  title: string;
  description: string;
  recommendation: string;
  category: string;
  severity: "info" | "opportunity" | "warning" | "critical";
  status: "open" | "accepted" | "rejected" | "resolved" | "converted_to_task";
  confidence_score: number;
  evidence: Array<{ source: string; observation: string; value?: string | number | boolean | null }>;
  analysis_run_id: string | null;
  task_id: string | null;
  plan_element_id: string | null;
  geometry: Record<string, unknown>;
  page_number: number | null;
  updated_at: string;
  created_at: string;
};

export type FindingDecision = Extract<
  CloudReviewFinding["status"],
  "accepted" | "rejected" | "resolved"
>;

export type DrawingAnalysisResult = {
  runId: string;
  metadata: Record<string, unknown>;
  analysisStatus: "completed" | "needs_better_source";
  failureCode: string | null;
  retryable: boolean;
  planElements: Array<Record<string, unknown>>;
  review: CloudReview;
};

export type CloudReview = {
  id: string;
  drawing_id: string;
  project_id: string;
  user_id: string;
  status: "draft" | "ready" | "completed" | "processing" | "failed" | "archived";
  plan_health: number;
  generated_at: string;
  created_at: string;
  architectural_review_findings: CloudReviewFinding[];
};

async function requireUser() {
  const supabase=organizationClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication is required.");
  return data.user;
}

export async function saveReviewSession(
  drawingId: string,
  report: ArchitecturalReviewReport,
): Promise<CloudReview> {
  const supabase=organizationClient();
  const user = await requireUser();
  const { data: review, error: reviewError } = await supabase
    .from("architectural_reviews")
    .insert({
      user_id: user.id,
      drawing_id: drawingId,
      project_id: report.projectId,
      status: "ready",
      plan_health: report.planHealth,
      generated_at: report.generatedAt,
      engine_version: 'local-review-v1',
      disclaimer: report.disclaimer,
    })
    .select("*")
    .single();
  if (reviewError) throw reviewError;

  const rows = report.findings.map((finding) => ({
    review_id: review.id,
    drawing_id: drawingId,
    user_id: user.id,
    code: finding.code,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    category: finding.category,
    severity: finding.severity,
    confidence_score: finding.confidence.score,
  }));
  const { data: findings, error: findingsError } = await supabase
    .from("architectural_review_findings")
    .insert(rows)
    .select("*");
  if (findingsError) {
    await supabase.from("architectural_reviews").delete().eq("id", review.id);
    throw findingsError;
  }
  await supabase.from("architectural_drawings").update({ status: "reviewed" }).eq("id", drawingId);
  return { ...review, architectural_review_findings: findings ?? [] } as CloudReview;
}

export async function listProjectReviews(projectId?: string): Promise<CloudReview[]> {
  const supabase=organizationClient();
  let query = supabase
    .from("architectural_reviews")
    .select("*, architectural_review_findings(*)")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CloudReview[];
}

export async function analyzeProjectDrawing(
  drawingId: string,
  options: { retry?: boolean } = {},
): Promise<DrawingAnalysisResult> {
  const supabase=organizationClient();
  const { data, error } = await supabase.functions.invoke("architectural-analyze-v2", {
    body: { drawingId, retry: Boolean(options.retry) },
  });
  if (error) throw error;
  if (!data?.review) throw new Error(data?.error ?? "لم يُرجع التحليل جلسة مراجعة.");
  return data as DrawingAnalysisResult;
}

export async function updateFindingDecision(
  finding: Pick<CloudReviewFinding, "id" | "review_id"> & Partial<Pick<CloudReviewFinding, "updated_at">>,
  status: FindingDecision,
): Promise<void> {
  const supabase=organizationClient();
  const user = await requireUser();
  requireFindingDecisionVersion(finding.updated_at,status);
  const { data: updatedFinding, error } = await supabase
    .from("architectural_review_findings")
    .update({ status })
    .eq("updated_at", finding.updated_at)
    .eq("review_id", finding.review_id)
    .in("status", ["open", "accepted", "rejected", "resolved"])
    .eq("id", finding.id)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error?.code === "PGRST116") throw findingDecisionConflict();
  if (error) throw error;
  if (!updatedFinding) throw findingDecisionConflict();

  // Review status describes analysis, not the count of unresolved findings.
}

export async function linkFindingToPlanElement(
  finding: Pick<CloudReviewFinding, "id" | "drawing_id">,
  element: { id: string; drawing_id: string; geometry: Record<string, unknown> } | null,
): Promise<void> {
  const supabase=organizationClient();
  const user = await requireUser();
  if (element && element.drawing_id !== finding.drawing_id) {
    throw new Error("لا يمكن ربط الملاحظة بعنصر من مخطط مختلف.");
  }
  const page = element && typeof element.geometry.page === "number" ? element.geometry.page : null;
  const { data, error } = await supabase
    .from("architectural_review_findings")
    .update({
      plan_element_id: element?.id ?? null,
      geometry: element?.geometry ?? {},
      page_number: page,
    })
    .eq("id", finding.id)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("تعذر ربط الملاحظة بموضع المخطط.");
}

export async function convertFindingToTask(finding: CloudReviewFinding,projectId:string):Promise<string> {
  const lease=requireOrganizationLease();const supabase=organizationClient();
  const input={userId:lease.userId,organizationId:lease.organizationId,projectId,sourceKind:'finding' as const,sourceId:finding.id,updatedAt:finding.updated_at};
  const {data,error}=await supabase.rpc('convert_project_source_to_task',conversionArguments(input));
  if(error)throw conversionFailure(error);return confirmedConversion(data,input);
}
