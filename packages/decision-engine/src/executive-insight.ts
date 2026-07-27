import type { DecisionInput, DecisionSignal, ExecutiveDecision } from "./types";

export type ExecutiveInsight = {
  status: "stable" | "attention" | "critical";
  title: string;
  summary: string;
  nextAction: DecisionSignal["action"];
  nextActionLabel: string;
  confidence: number;
  evidence: string[];
};

export function buildExecutiveInsight(input: DecisionInput, decision: ExecutiveDecision): ExecutiveInsight {
  const primary = decision.alerts[0] ?? decision.priorities[0] ?? decision.recommendations[0];
  const status = decision.alerts.some((item) => item.severity === "critical") ? "critical" : primary ? "attention" : "stable";
  const evidence = [
    `${decision.stats.overdueTasks} مهام متأخرة`,
    `${decision.stats.overdueProjects} مشاريع متأخرة`,
    `${decision.stats.pendingPayments} معاملات معلقة`,
    `${decision.health.score}% صحة مساحة العمل`,
  ];
  const dataPoints = input.projects.length + input.tasks.length + input.clients.length + input.financeItems.length + input.activityEvents.length + input.notifications.length;
  const confidence = Math.min(96, 60 + Math.min(30, dataPoints * 2) + (primary ? 6 : 0));

  if (!primary) {
    return {
      status,
      title: "مساحة العمل مستقرة",
      summary: "لا توجد مخاطر أو قرارات عاجلة وفق البيانات الحالية.",
      nextAction: { label: "فتح لوحة القيادة", target: "dashboard" },
      nextActionLabel: "مراجعة لوحة القيادة",
      confidence,
      evidence,
    };
  }

  return {
    status,
    title: primary.title,
    summary: `${primary.detail} ${primary.reason}`,
    nextAction: primary.action,
    nextActionLabel: primary.action.label,
    confidence,
    evidence,
  };
}
