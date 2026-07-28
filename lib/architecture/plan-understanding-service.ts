import { supabase } from "@/lib/supabase";

export type PlanElementType = "wall" | "opening" | "room" | "label" | "dimension";
export type PlanElementStatus = "detected" | "confirmed" | "corrected" | "rejected";

export type CloudPlanElement = {
  id: string;
  user_id: string;
  project_id: string;
  drawing_id: string;
  analysis_run_id: string | null;
  element_type: PlanElementType;
  label: string;
  value: string | null;
  unit: string | null;
  geometry: Record<string, unknown>;
  confidence_score: number;
  source: "automatic" | "manual";
  status: PlanElementStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanElementInput = {
  projectId: string;
  drawingId: string;
  elementType: PlanElementType;
  label: string;
  value?: string;
  unit?: string;
  notes?: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication is required.");
  return data.user.id;
}

export async function listPlanElements(projectId?: string): Promise<CloudPlanElement[]> {
  let query = supabase
    .from("architectural_plan_elements")
    .select("*")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CloudPlanElement[];
}

export async function createPlanElement(input: PlanElementInput): Promise<CloudPlanElement> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("architectural_plan_elements")
    .insert({
      user_id: userId,
      project_id: input.projectId,
      drawing_id: input.drawingId,
      element_type: input.elementType,
      label: input.label.trim(),
      value: input.value?.trim() || null,
      unit: input.unit?.trim() || null,
      notes: input.notes?.trim() || null,
      confidence_score: 100,
      source: "manual",
      status: "confirmed",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CloudPlanElement;
}

export async function correctPlanElement(
  element: CloudPlanElement,
  input: Pick<PlanElementInput, "elementType" | "label" | "value" | "unit" | "notes">,
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("architectural_plan_elements")
    .update({
      element_type: input.elementType,
      label: input.label.trim(),
      value: input.value?.trim() || null,
      unit: input.unit?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "corrected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", element.id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updatePlanElementStatus(
  elementId: string,
  status: Extract<PlanElementStatus, "confirmed" | "rejected">,
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("architectural_plan_elements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", elementId)
    .eq("user_id", userId);
  if (error) throw error;
}
