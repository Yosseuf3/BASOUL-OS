import type { DashboardDecisionInput, DashboardDecisionState, DecisionItem } from "../intelligence/types";

export type ExecutiveContext = DashboardDecisionInput & {
  userName?: string;
  workspaceId?: string;
};

export type ExecutiveReport = {
  generatedAt: string;
  workspaceId?: string;
  confidence: number;
  overview: DashboardDecisionState["brief"];
  priorities: DecisionItem[];
  criticalRisks: DecisionItem[];
  metrics: DashboardDecisionState["stats"];
  period: {
    today: string;
    inSevenDays: string;
  };
};

export interface ExecutiveEngine {
  analyze(context: ExecutiveContext): Promise<ExecutiveReport>;
}
