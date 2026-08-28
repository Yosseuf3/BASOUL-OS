import { supabase } from "@/lib/supabase";

export const PLAN_ELEMENT_TYPES = ["wall", "opening", "door", "window", "room", "stair", "column", "shaft", "label", "dimension"] as const;
export type KnownPlanElementType = (typeof PLAN_ELEMENT_TYPES)[number];
// Persisted recognition taxonomies evolve independently from a deployed client.
// Keep the transport type forward-compatible while UI/editor surfaces use PLAN_ELEMENT_TYPES for known options.
export type PlanElementType = string;
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

export type PlanElementLocation = {
  page: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  coordinateSystem: string | null;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function isKnownPlanElementType(value: string): value is KnownPlanElementType {
  return (PLAN_ELEMENT_TYPES as readonly string[]).includes(value);
}

export function getPlanElementLocation(element: Pick<CloudPlanElement, "geometry">): PlanElementLocation {
  return {
    page: finiteNumber(element.geometry.page),
    x: finiteNumber(element.geometry.x),
    y: finiteNumber(element.geometry.y),
    width: finiteNumber(element.geometry.width),
    height: finiteNumber(element.geometry.height),
    coordinateSystem: typeof element.geometry.coordinateSystem === "string" ? element.geometry.coordinateSystem : null,
  };
}

export function getPlanElementRecognitionSource(element: Pick<CloudPlanElement, "geometry" | "source">): string {
  const geometrySource = typeof element.geometry.source === "string" ? element.geometry.source : null;
  const focus = typeof element.geometry.focus === "string" ? element.geometry.focus : null;
  if (geometrySource === "vision" && focus) return `Vision · ${focus}`;
  if (geometrySource === "hybrid_vision") return "Hybrid Vision";
  if (geometrySource === "vector") return "Vector";
  return element.source === "manual" ? "Manual" : "Automatic";
}

export function getPlanElementConfidenceBand(element: Pick<CloudPlanElement, "geometry" | "confidence_score">): "detected" | "probable" | "needs_review" {
  const band = element.geometry.confidenceBand;
  if (band === "detected" || band === "probable" || band === "needs_review") return band;
  if (element.confidence_score >= 82) return "detected";
  if (element.confidence_score >= 60) return "probable";
  return "needs_review";
}

export function formatPlanElementLocation(element: Pick<CloudPlanElement, "geometry">): string {
  const location = getPlanElementLocation(element);
  const page = location.page ? `الصفحة ${location.page}` : "صفحة غير محددة";
  if (location.x == null || location.y == null) return page;
  const box = location.width != null && location.height != null
    ? ` · موضع ${Math.round(location.x)}, ${Math.round(location.y)} · حجم ${Math.round(location.width)}×${Math.round(location.height)}`
    : ` · موضع ${Math.round(location.x)}, ${Math.round(location.y)}`;
  return `${page}${box}`;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication is required.");
  return data.user.id;
}

export async function listPlanElements(projectId?: string): Promise<CloudPlanElement[]> {
  let query = supabase.from("architectural_plan_elements").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CloudPlanElement[];
}

export async function createPlanElement(input: PlanElementInput): Promise<CloudPlanElement> {
  const userId = await requireUserId();
  const { data, error } = await supabase.from("architectural_plan_elements").insert({
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
  }).select("*").single();
  if (error) throw error;
  return data as CloudPlanElement;
}

export async function correctPlanElement(element: CloudPlanElement, input: Pick<PlanElementInput, "elementType" | "label" | "value" | "unit" | "notes">): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("architectural_plan_elements").update({
    element_type: input.elementType,
    label: input.label.trim(),
    value: input.value?.trim() || null,
    unit: input.unit?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "corrected",
    updated_at: new Date().toISOString(),
  }).eq("id", element.id).eq("user_id", userId);
  if (error) throw error;
}

export async function updatePlanElementStatus(elementId: string, status: Extract<PlanElementStatus, "confirmed" | "rejected">): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("architectural_plan_elements").update({ status, updated_at: new Date().toISOString() }).eq("id", elementId).eq("user_id", userId);
  if (error) throw error;
}
