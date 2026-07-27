import { assessEngineeringConfidence } from "@yosseuf/cognitive-core";
import type { ArchitecturalFinding, ArchitecturalReviewReport, DrawingAsset } from "./types";

export type FindingDraft = Omit<ArchitecturalFinding, "id" | "drawingId" | "confidence" | "createdAt" | "status">;

export function createArchitecturalReview(
  drawing: DrawingAsset,
  drafts: FindingDraft[],
  now = new Date(),
): ArchitecturalReviewReport {
  const createdAt = now.toISOString();
  const findings: ArchitecturalFinding[] = drafts.map((draft, index) => ({
    ...draft,
    id: `${drawing.id}-finding-${index + 1}`,
    drawingId: drawing.id,
    status: "open",
    confidence: assessEngineeringConfidence(draft.evidence),
    createdAt,
  }));

  const severityPenalty = findings.reduce((sum, finding) => {
    if (finding.severity === "critical") return sum + 18;
    if (finding.severity === "warning") return sum + 8;
    if (finding.severity === "opportunity") return sum + 3;
    return sum + 1;
  }, 0);

  return {
    id: `${drawing.id}-review-${drawing.revision}`,
    projectId: drawing.projectId,
    drawingId: drawing.id,
    planHealth: Math.max(0, Math.min(100, 100 - severityPenalty)),
    findings,
    generatedAt: createdAt,
    disclaimer: "AI-assisted engineering review. Final validation remains the responsibility of the licensed project team and approving authority.",
  };
}
