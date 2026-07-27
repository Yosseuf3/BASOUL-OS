import type { ConfidenceAssessment, Evidence } from "@yosseuf/cognitive-core";

export type DrawingFormat = "pdf" | "image" | "dwg" | "dxf" | "ifc" | "rvt";
export type ReviewCategory = "circulation" | "privacy" | "lighting" | "space_efficiency" | "code" | "identity" | "constructability" | "cost";
export type ReviewSeverity = "info" | "opportunity" | "warning" | "critical";
export type ReviewStatus = "open" | "accepted" | "rejected" | "resolved" | "converted_to_task";

export type DrawingAsset = {
  id: string;
  projectId: string;
  name: string;
  format: DrawingFormat;
  revision: string;
  storagePath: string;
  uploadedAt: string;
};

export type PlanLocation = {
  sheet?: string;
  floor?: string;
  room?: string;
  normalizedX?: number;
  normalizedY?: number;
};

export type ArchitecturalFinding = {
  id: string;
  drawingId: string;
  code: string;
  title: string;
  description: string;
  recommendation: string;
  category: ReviewCategory;
  severity: ReviewSeverity;
  status: ReviewStatus;
  location: PlanLocation;
  evidence: Evidence[];
  confidence: ConfidenceAssessment;
  createdAt: string;
};

export type ArchitecturalReviewReport = {
  id: string;
  projectId: string;
  drawingId: string;
  planHealth: number;
  findings: ArchitecturalFinding[];
  generatedAt: string;
  disclaimer: string;
};
