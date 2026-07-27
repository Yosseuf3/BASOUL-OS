import { buildDashboardDecision } from "../intelligence";
import type { ExecutiveContext, ExecutiveEngine, ExecutiveReport } from "../contracts";

export class ExecutiveOrchestrator implements ExecutiveEngine {
  async analyze(context: ExecutiveContext): Promise<ExecutiveReport> {
    const state = buildDashboardDecision(context, context.userName ?? "Yosseuf");

    return {
      generatedAt: (context.now ?? new Date()).toISOString(),
      workspaceId: context.workspaceId,
      confidence: calculateConfidence(context),
      overview: state.brief,
      priorities: state.focus,
      criticalRisks: state.alerts,
      metrics: state.stats,
      period: {
        today: state.today,
        inSevenDays: state.inSevenDays,
      },
    };
  }
}

export const executiveOrchestrator = new ExecutiveOrchestrator();

function calculateConfidence(context: ExecutiveContext): number {
  const sources = [
    context.projects.length,
    context.tasks.length,
    context.clients.length,
    context.financeItems.length,
    context.activityEvents.length,
    context.notifications.length,
  ];
  const populatedSources = sources.filter((count) => count > 0).length;
  const recordCount = sources.reduce((total, count) => total + count, 0);
  const sourceCoverage = populatedSources / sources.length;
  const volumeCoverage = Math.min(recordCount / 25, 1);

  return Math.round((0.55 + sourceCoverage * 0.3 + volumeCoverage * 0.15) * 100);
}
