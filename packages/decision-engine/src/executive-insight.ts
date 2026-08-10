import type { DecisionInput, DecisionLocale, DecisionSignal, ExecutiveDecision } from "./types";

export type ExecutiveInsight = {
  status: "stable" | "attention" | "critical";
  title: string;
  summary: string;
  nextAction: DecisionSignal["action"];
  nextActionLabel: string;
  confidence: number;
  evidence: string[];
};

export function buildExecutiveInsight(input: DecisionInput, decision: ExecutiveDecision, locale: DecisionLocale = "ar"): ExecutiveInsight {
  const en = locale === "en";
  const primary = decision.alerts[0] ?? decision.priorities[0] ?? decision.recommendations[0];
  const status = decision.alerts.some((item) => item.severity === "critical") ? "critical" : primary ? "attention" : "stable";
  const evidence = en ? [
    `${decision.stats.overdueTasks} overdue tasks`,
    `${decision.stats.overdueProjects} overdue projects`,
    `${decision.stats.pendingPayments} pending transactions`,
    `${decision.health.score}% workspace health`,
  ] : [
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
      title: en ? "Workspace is stable" : "مساحة العمل مستقرة",
      summary: en ? "No urgent risks or decisions are indicated by the current data." : "لا توجد مخاطر أو قرارات عاجلة وفق البيانات الحالية.",
      nextAction: { label: en ? "Open dashboard" : "فتح لوحة القيادة", target: "dashboard" },
      nextActionLabel: en ? "Review dashboard" : "مراجعة لوحة القيادة",
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
