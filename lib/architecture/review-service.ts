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
  task_id: string | null;
  created_at: string;
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
  return task.id as string;
}
