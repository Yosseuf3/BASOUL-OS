export type CognitiveStage =
  | "perception"
  | "understanding"
  | "knowledge"
  | "reasoning"
  | "decision"
  | "recommendation"
  | "execution"
  | "learning";

export type EvidenceSourceType =
  | "building_code"
  | "urban_identity"
  | "company_standard"
  | "previous_project"
  | "best_practice"
  | "user_input"
  | "model_inference";

export type Evidence = {
  id: string;
  sourceType: EvidenceSourceType;
  title: string;
  reference?: string;
  weight: number;
  verified: boolean;
};

export type ConfidenceAssessment = {
  score: number;
  level: "low" | "medium" | "high" | "very_high";
  evidenceCount: number;
  verifiedEvidenceCount: number;
  explanation: string;
};

export type CognitiveContext = {
  requestId: string;
  workspaceId: string;
  projectId?: string;
  actorId: string;
  locale: "ar" | "en";
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type CognitiveEnvelope<T> = {
  stage: CognitiveStage;
  context: CognitiveContext;
  payload: T;
  evidence: Evidence[];
  trace: string[];
};

export interface CognitiveEngine<TInput, TOutput> {
  readonly name: string;
  readonly stage: CognitiveStage;
  process(input: CognitiveEnvelope<TInput>): Promise<CognitiveEnvelope<TOutput>>;
}
