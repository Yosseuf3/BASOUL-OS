import type { ConfidenceAssessment, Evidence } from "./types";

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

export function assessEngineeringConfidence(evidence: Evidence[]): ConfidenceAssessment {
  if (evidence.length === 0) {
    return {
      score: 20,
      level: "low",
      evidenceCount: 0,
      verifiedEvidenceCount: 0,
      explanation: "No supporting evidence is attached; expert review is required.",
    };
  }

  const totalWeight = evidence.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  const verifiedWeight = evidence.reduce(
    (sum, item) => sum + (item.verified ? Math.max(0, item.weight) : 0),
    0,
  );
  const sourceDiversity = new Set(evidence.map((item) => item.sourceType)).size;
  const verificationRatio = totalWeight === 0 ? 0 : verifiedWeight / totalWeight;
  const score = clamp(35 + verificationRatio * 45 + Math.min(15, sourceDiversity * 5));
  const rounded = Math.round(score);
  const level = rounded >= 90 ? "very_high" : rounded >= 75 ? "high" : rounded >= 50 ? "medium" : "low";

  return {
    score: rounded,
    level,
    evidenceCount: evidence.length,
    verifiedEvidenceCount: evidence.filter((item) => item.verified).length,
    explanation: `${rounded}% confidence based on ${evidence.length} evidence item(s) across ${sourceDiversity} source type(s).`,
  };
}
