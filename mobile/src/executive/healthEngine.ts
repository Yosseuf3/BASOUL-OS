import type { MobileWorkspaceData, Task } from "../types/domain";
import type { HealthFactor, WorkspaceHealth } from "./types";

function isOpen(task: Task): boolean {
  return task.status !== "Done";
}

function isOverdue(task: Task, now: number): boolean {
  return Boolean(task.due_date && isOpen(task) && new Date(task.due_date).getTime() < now);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateWorkspaceHealth(data: MobileWorkspaceData, now = Date.now()): WorkspaceHealth {
  const openTasks = data.tasks.filter(isOpen);
  const overdue = openTasks.filter((task) => isOverdue(task, now));
  const criticalOpen = openTasks.filter((task) => task.priority === "Critical");
  const activeProjects = data.projects.filter((project) => project.status === "Active");
  const pausedProjects = data.projects.filter((project) => project.status === "On Hold");
  const unread = data.notifications.filter((item) => !item.is_read);

  const deliveryScore = openTasks.length === 0 ? 100 : clamp(100 - (overdue.length / openTasks.length) * 100);
  const priorityScore = openTasks.length === 0 ? 100 : clamp(100 - (criticalOpen.length / openTasks.length) * 65);
  const flowScore = data.projects.length === 0 ? 100 : clamp(100 - (pausedProjects.length / data.projects.length) * 100);
  const awarenessScore = clamp(100 - unread.length * 7);
  const progressScore = activeProjects.length === 0
    ? 100
    : clamp(activeProjects.reduce((sum, project) => sum + (project.progress ?? 0), 0) / activeProjects.length);

  const factors: HealthFactor[] = [
    { id: "delivery", label: "الالتزام بالمواعيد", score: deliveryScore, weight: 0.3, explanation: `${overdue.length} مهام متأخرة من ${openTasks.length} مهام مفتوحة.` },
    { id: "priority", label: "ضغط الأولويات", score: priorityScore, weight: 0.2, explanation: `${criticalOpen.length} مهام حرجة ما زالت مفتوحة.` },
    { id: "flow", label: "تدفق المشاريع", score: flowScore, weight: 0.2, explanation: `${pausedProjects.length} مشاريع متوقفة من ${data.projects.length}.` },
    { id: "progress", label: "تقدم التنفيذ", score: progressScore, weight: 0.2, explanation: `متوسط تقدم المشاريع النشطة ${progressScore}%.` },
    { id: "awareness", label: "وضوح التنبيهات", score: awarenessScore, weight: 0.1, explanation: `${unread.length} تنبيهات غير مقروءة.` },
  ];

  const score = clamp(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0));
  const status: WorkspaceHealth["status"] = score < 45 ? "critical" : score < 65 ? "at-risk" : score < 82 ? "stable" : "healthy";

  return { score, status, factors };
}
