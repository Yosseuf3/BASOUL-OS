import type { ArchitecturalReviewReport } from "@yosseuf/architectural-intelligence";
import { supabase } from "@/lib/supabase";

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
  created_at: string;
};

export type FindingDecision = Extract<
  CloudReviewFinding["status"],
  "accepted" | "rejected" | "resolved"
>;

export type DrawingAnalysisResult = {
  runId: string;
  metadata: Record<string, unknown>;
  review: CloudReview;
};

export type CloudReview = {
  id: string;
  drawing_id: string;
  project_id: string;
  user_id: string;
  status: "draft" | "ready" | "completed";
  plan_health: number;
  generated_at: string;
  created_at: string;
  architectural_review_findings: CloudReviewFinding[];
};

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication is required.");
  return data.user;
}

async function syncReviewCompletion(reviewId: string, userId: string): Promise<void> {
  const { data: remaining, error: remainingError } = await supabase
    .from("architectural_review_findings")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", userId)
    .in("status", ["open", "accepted"])
    .limit(1);
  if (remainingError) throw remainingError;

  const { error: reviewError } = await supabase
    .from("architectural_reviews")
    .update({ status: remaining?.length ? "ready" : "completed" })
    .eq("id", reviewId)
    .eq("user_id", userId);
  if (reviewError) throw reviewError;
}

export async function saveReviewSession(
  drawingId: string,
  report: ArchitecturalReviewReport,
): Promise<CloudReview> {
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
  let query = supabase
    .from("architectural_reviews")
    .select("*, architectural_review_findings(*)")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CloudReview[];
}

export async function analyzeProjectDrawing(drawingId: string): Promise<DrawingAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("architectural-analyze-v2", {
    body: { drawingId },
  });
  if (error) throw error;
  if (!data?.review) throw new Error(data?.error ?? "لم يُرجع التحليل جلسة مراجعة.");
  return data as DrawingAnalysisResult;
}

export async function updateFindingDecision(
  finding: Pick<CloudReviewFinding, "id" | "review_id">,
  status: FindingDecision,
): Promise<void> {
  const user = await requireUser();
  const { data: updatedFinding, error } = await supabase
    .from("architectural_review_findings")
    .update({ status })
    .eq("id", finding.id)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error) throw error;
  if (!updatedFinding) throw new Error("تعذر تحديث الملاحظة.");

  await syncReviewCompletion(finding.review_id, user.id);
}

export async function convertFindingToTask(
  finding: CloudReviewFinding,
  projectId: string,
): Promise<string> {
  const user = await requireUser();
  const priority =
    finding.severity === "critical" ? "Critical" :
    finding.severity === "warning" ? "High" : "Medium";
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      project_id: projectId,
      title: finding.title,
      description: `${finding.description}\n\nالتوصية: ${finding.recommendation}`,
      status: "To Do",
      priority,
      progress: 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: updateError } = await supabase
    .from("architectural_review_findings")
    .update({ status: "converted_to_task", task_id: task.id })
    .eq("id", finding.id);
  if (updateError) throw updateError;
  await syncReviewCompletion(finding.review_id, user.id);
  return task.id as string;
}

