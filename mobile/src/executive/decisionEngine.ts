import type { MobileWorkspaceData, Task } from "../types/domain";
import type { ExecutiveSignal } from "./types";

const priorityWeight: Record<Task["priority"], number> = { Critical: 50, High: 34, Medium: 20, Low: 8 };

function open(task: Task): boolean {
  return task.status !== "Done";
}

function daysLate(task: Task, now: number): number {
  if (!task.due_date || !open(task)) return 0;
  return Math.max(0, Math.ceil((now - new Date(task.due_date).getTime()) / 86400000));
}

function scoreTask(task: Task, now: number): number {
  const late = daysLate(task, now);
  const progressGap = Math.max(0, 100 - task.progress) / 5;
  return priorityWeight[task.priority] + late * 14 + progressGap;
}

export function buildDecisionSignals(data: MobileWorkspaceData, now = Date.now()): ExecutiveSignal[] {
  const signals: ExecutiveSignal[] = data.tasks
    .filter(open)
    .map((task) => {
      const late = daysLate(task, now);
      return {
        id: `task:${task.id}`,
        title: late > 0 ? `استعد السيطرة على: ${task.title}` : `نفّذ الآن: ${task.title}`,
        explanation: late > 0
          ? `المهمة متأخرة ${late} ${late === 1 ? "يوم" : "أيام"} وأولويتها ${task.priority}.`
          : `أولويتها ${task.priority} ونسبة تقدمها ${task.progress}%.`,
        recommendedAction: late > 0 ? "حدد العائق والمالك والموعد الجديد قبل نهاية اليوم." : "خصص أول كتلة عمل مركزة لهذه المهمة.",
        severity: late > 0 || task.priority === "Critical" ? "critical" as const : "warning" as const,
        score: Math.round(scoreTask(task, now)),
        entityType: "task" as const,
        entityId: task.id,
      };
    });

  const paused = data.projects.filter((project) => project.status === "On Hold");
  if (paused.length > 0) {
    signals.push({
      id: "projects:on-hold",
      title: `اتخذ قرارًا بشأن ${paused.length} مشروع متوقف`,
      explanation: "المشاريع المتوقفة تستهلك الانتباه دون تدفق إنجاز واضح.",
      recommendedAction: "استأنف أو أغلق أو حدد شرطًا واضحًا لإعادة التفعيل.",
      severity: "warning",
      score: 62 + paused.length * 4,
      entityType: "workspace",
    });
  }

  const unread = data.notifications.filter((item) => !item.is_read).length;
  if (unread > 0) {
    signals.push({
      id: "notifications:unread",
      title: `صنّف ${unread} تنبيهات جديدة`,
      explanation: "التنبيهات غير المصنفة قد تخفي تغييرًا يؤثر على خطة اليوم.",
      recommendedAction: "حوّل كل تنبيه إلى إجراء أو متابعة أو أرشفة.",
      severity: unread >= 5 ? "warning" : "info",
      score: 35 + unread * 3,
      entityType: "notification",
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "workspace:stable",
      title: "مساحة العمل مستقرة",
      explanation: "لا توجد مهام مفتوحة أو مخاطر تشغيلية ظاهرة حاليًا.",
      recommendedAction: "خطط للخطوة التالية وحدّث البيانات قبل نهاية اليوم.",
      severity: "positive",
      score: 10,
      entityType: "workspace",
    });
  }

  return signals.sort((a, b) => b.score - a.score).slice(0, 8);
}
