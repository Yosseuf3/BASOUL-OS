import type { Client, FinanceTransaction, Notification, Project, Task } from "@/lib/types";

export type WorkspaceHealth = { score: number; label: "ممتاز" | "جيد" | "يحتاج انتباه" | "حرج"; issues: number };

export function calculateWorkspaceHealth(input: { projects: Project[]; tasks: Task[]; clients: Client[]; financeItems: FinanceTransaction[]; notifications: Notification[]; now?: Date }): WorkspaceHealth {
  const today = (input.now ?? new Date()).toISOString().slice(0, 10);
  const overdue = input.tasks.filter((task) => task.status !== "Done" && task.due_date && task.due_date < today).length;
  const stalled = input.projects.filter((project) => project.status === "On Hold").length;
  const highNotifications = input.notifications.filter((notification) => !notification.is_read && notification.priority === "high").length;
  const pendingFinance = input.financeItems.filter((item) => item.status === "Pending").length;
  const activeProjects = input.projects.filter((project) => project.status === "Active").length;
  const activeClients = input.clients.filter((client) => client.status === "Active").length;
  const positive = Math.min(12, activeProjects * 2) + Math.min(8, activeClients);
  const penalty = overdue * 5 + stalled * 6 + highNotifications * 4 + pendingFinance * 2;
  const score = Math.max(0, Math.min(100, 82 + positive - penalty));
  const issues = overdue + stalled + highNotifications + pendingFinance;
  const label = score >= 90 ? "ممتاز" : score >= 75 ? "جيد" : score >= 55 ? "يحتاج انتباه" : "حرج";
  return { score, label, issues };
}
