import type { ActivityEvent, Client, FinanceTransaction, Notification, Project, Task } from "@yosseuf/shared-types";

export type DecisionTarget = "dashboard" | "projects" | "tasks" | "clients" | "finance" | "activity" | "notifications";
export type DecisionSeverity = "critical" | "warning" | "info" | "positive";
export type DecisionAction = { label: string; target: DecisionTarget; entityId?: string };
export type DecisionSignal = { id: string; title: string; detail: string; severity: DecisionSeverity; score: number; reason: string; action: DecisionAction };
export type HealthFactor = { id: string; label: string; impact: number; reason: string; tone: "positive" | "negative" | "neutral" };
export type ExecutiveDecision = {
  generatedAt: string;
  brief: { headline: string; message: string; priorityLine: string };
  priorities: DecisionSignal[];
  alerts: DecisionSignal[];
  recommendations: DecisionSignal[];
  health: { score: number; label: "ممتاز" | "جيد" | "يحتاج انتباه" | "حرج"; factors: HealthFactor[] };
  stats: { activeProjects:number; stalledProjects:number; overdueProjects:number; overdueTasks:number; dueToday:number; dueSoon:number; doneTasks:number; completion:number; activeClients:number; followUps:number; income:number; expense:number; net:number; pendingPayments:number; currency:string };
};
export type DecisionInput = { projects:Project[]; tasks:Task[]; clients:Client[]; financeItems:FinanceTransaction[]; activityEvents:ActivityEvent[]; notifications:Notification[]; now?:Date };
