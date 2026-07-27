export type SignalSeverity = "critical" | "warning" | "positive" | "info";

export type ExecutiveSignal = {
  id: string;
  title: string;
  explanation: string;
  recommendedAction: string;
  severity: SignalSeverity;
  score: number;
  entityType?: "task" | "project" | "notification" | "workspace";
  entityId?: string;
};

export type HealthFactor = {
  id: string;
  label: string;
  score: number;
  weight: number;
  explanation: string;
};

export type WorkspaceHealth = {
  score: number;
  status: "critical" | "at-risk" | "stable" | "healthy";
  factors: HealthFactor[];
};

export type PredictiveRisk = {
  id: string;
  title: string;
  probability: number;
  horizonDays: number;
  reason: string;
  mitigation: string;
};

export type ExecutiveOperatingSnapshot = {
  generatedAt: string;
  headline: string;
  brief: string;
  confidence: number;
  health: WorkspaceHealth;
  signals: ExecutiveSignal[];
  risks: PredictiveRisk[];
};
