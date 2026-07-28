import { supabase } from "@/lib/supabase";
import type { CloudPlanElement } from "@/lib/architecture/plan-understanding-service";

export type ReviewComment = {
  id: string;
  user_id: string;
  project_id: string;
  drawing_id: string;
  plan_element_id: string | null;
  finding_id: string | null;
  page_number: number | null;
  geometry: Record<string, unknown>;
  body: string;
  status: "open" | "resolved";
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication is required.");
  return data.user.id;
}

export async function listReviewComments(projectId?: string): Promise<ReviewComment[]> {
  let query = supabase
    .from("architectural_review_comments")
    .select("*")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ReviewComment[];
}

export async function createReviewComment(input: {
  projectId: string;
  drawingId: string;
  element: CloudPlanElement;
  body: string;
  findingId?: string | null;
}): Promise<ReviewComment> {
  const userId = await requireUserId();
  const page = typeof input.element.geometry.page === "number" ? input.element.geometry.page : null;
  const { data, error } = await supabase
    .from("architectural_review_comments")
    .insert({
      user_id: userId,
      project_id: input.projectId,
      drawing_id: input.drawingId,
      plan_element_id: input.element.id,
      finding_id: input.findingId ?? null,
      page_number: page,
      geometry: input.element.geometry,
      body: input.body.trim(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ReviewComment;
}

export async function setReviewCommentStatus(commentId: string, status: "open" | "resolved"): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("architectural_review_comments")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteReviewComment(commentId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("architectural_review_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  if (error) throw error;
}
