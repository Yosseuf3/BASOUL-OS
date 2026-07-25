import type { ActivityEvent, Client, FinanceTransaction, Notification, Project, Task } from "@/lib/types";

export type DecisionTarget = "dashboard" | "projects" | "tasks" | "clients" | "finance" | "activity" | "notifications";
export type DecisionTone = "critical" | "warning" | "positive" | "neutral";
export type DecisionItem = { id: string; title: string; detail: string; score: number; tone: DecisionTone; target: DecisionTarget; entityId?: string };
export type DashboardDecisionInput = { projects: Project[]; tasks: Task[]; clients: Client[]; financeItems: FinanceTransaction[]; activityEvents: ActivityEvent[]; notifications: Notification[]; now?: Date };
export type DashboardDecisionState = {
  today: string; inSevenDays: string; focus: DecisionItem[]; alerts: DecisionItem[];
  brief: { headline: string; message: string; priorityLine: string };
  stats: { activeProjects: number; stalledProjects: number; overdueTasks: number; dueToday: number; dueSoon: number; doneTasks: number; completion: number; activeClients: number; followUps: number; unreadNotifications: number; highNotifications: number; income: number; expense: number; net: number; pendingPayments: number; currency: string };
};
