import type { MobileWorkspaceData, Task } from "../types/domain";
import type { PredictiveRisk } from "./types";

function isOpen(task: Task): boolean {
  return task.status !== "Done";
}

export function predictWorkspaceRisks(data: MobileWorkspaceData, now = Date.now()): PredictiveRisk[] {
  const risks: PredictiveRisk[] = [];
  const openTasks = data.tasks.filter(isOpen);

  const dueSoon = openTasks.filter((task) => {
    if (!task.due_date) return false;
    const days = (new Date(task.due_date).getTime() - now) / 86400000;
    return days >= 0 && days <= 7 && task.progress < 60;
  });

  if (dueSoon.length > 0) {
    const averageProgress = dueSoon.reduce((sum, task) => sum + task.progress, 0) / dueSoon.length;
    risks.push({
      id: "delivery-next-seven-days",
      title: "خطر تأخير خلال الأسبوع القادم",
      probability: Math.min(92, Math.round(55 + dueSoon.length * 7 + Math.max(0, 50 - averageProgress) / 2)),
      horizonDays: 7,
      reason: `${dueSoon.length} مهام موعدها خلال 7 أيام ومتوسط تقدمها ${Math.round(averageProgress)}%.`,
      mitigation: "قسّم المهام إلى نتائج يومية وحدد عائقًا واحدًا يجب إزالته اليوم.",
    });
  }

  const stalled = data.projects.filter((project) => project.status === "Active" && (project.progress ?? 0) < 20);
  if (stalled.length > 0) {
    risks.push({
      id: "low-project-momentum",
      title: "زخم تنفيذ منخفض في مشاريع نشطة",
      probability: Math.min(88, 48 + stalled.length * 10),
      horizonDays: 14,
      reason: `${stalled.length} مشاريع نشطة ما زالت أقل من 20% تقدمًا.`,
      mitigation: "عرّف الخطوة التالية القابلة للقياس لكل مشروع وحدد مالكًا وموعدًا.",
    });
  }

  return risks.sort((a, b) => b.probability - a.probability).slice(0, 4);
}
