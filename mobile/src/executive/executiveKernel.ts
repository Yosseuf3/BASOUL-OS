import type { MobileWorkspaceData } from "../types/domain";
import { buildDecisionSignals } from "./decisionEngine";
import { calculateWorkspaceHealth } from "./healthEngine";
import { predictWorkspaceRisks } from "./predictiveEngine";
import type { ExecutiveOperatingSnapshot } from "./types";

export function runExecutiveKernel(data: MobileWorkspaceData, now = Date.now()): ExecutiveOperatingSnapshot {
  const health = calculateWorkspaceHealth(data, now);
  const signals = buildDecisionSignals(data, now);
  const risks = predictWorkspaceRisks(data, now);
  const top = signals[0];
  const evidence = data.tasks.length + data.projects.length + data.notifications.length;
  const confidence = Math.max(55, Math.min(98, 60 + Math.min(30, evidence * 2)));

  return {
    generatedAt: new Date(now).toISOString(),
    headline: top.title,
    brief: `${health.score}% صحة مساحة العمل · ${signals.length} قرارات · ${risks.length} مخاطر متوقعة`,
    confidence,
    health,
    signals,
    risks,
  };
}
