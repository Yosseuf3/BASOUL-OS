import type { MobileWorkspaceData, PriorityLevel, Task } from "../types/domain";

export type ExecutiveRecommendation = {
  id: string;
  title: string;
  reason: string;
  action: string;
  severity: "critical" | "warning" | "opportunity";
  taskId?: string;
};

export type ExecutiveSnapshot = {
  health: number;
  confidence: number;
  headline: string;
  summary: string;
  openTasks: number;
  overdueTasks: number;
  activeProjects: number;
  unreadAlerts: number;
  recommendations: ExecutiveRecommendation[];
  focusTasks: Task[];
};

const priorityScore: Record<PriorityLevel, number> = { Low: 5, Medium: 15, High: 28, Critical: 45 };

function dayDifference(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`).getTime();
  return Math.ceil((target - Date.now()) / 86400000);
}

function taskScore(task: Task): number {
  if (task.status === "Done") return -1000;
  const days = dayDifference(task.due_date);
  let score = priorityScore[task.priority] + Math.max(0, 100 - task.progress) * 0.15;
  if (days !== null && days < 0) score += 70 + Math.min(30, Math.abs(days) * 4);
  else if (days !== null && days <= 2) score += 45;
  else if (days !== null && days <= 7) score += 20;
  if (task.status === "Review") score += 12;
  if (task.status === "In Progress") score += 8;
  return score;
}

export function buildExecutiveSnapshot(data: MobileWorkspaceData): ExecutiveSnapshot {
  const openTasks = data.tasks.filter((task) => task.status !== "Done");
  const overdue = openTasks.filter((task) => {
    const days = dayDifference(task.due_date);
    return days !== null && days < 0;
  });
  const activeProjects = data.projects.filter((project) => project.status === "Active");
  const onHold = data.projects.filter((project) => project.status === "On Hold");
  const unread = data.notifications.filter((notification) => !notification.is_read);
  const focusTasks = [...openTasks].sort((a, b) => taskScore(b) - taskScore(a)).slice(0, 3);

  const healthPenalty = overdue.length * 8 + onHold.length * 6 + unread.filter((item) => item.priority === "high").length * 4;
  const health = Math.max(20, Math.min(100, Math.round(94 - healthPenalty)));
  const confidence = Math.max(55, Math.min(96, 58 + Math.min(18, data.tasks.length * 2) + Math.min(12, data.projects.length * 2) + Math.min(8, data.notifications.length)));

  const recommendations: ExecutiveRecommendation[] = [];
  if (focusTasks[0]) {
    const top = focusTasks[0];
    const days = dayDifference(top.due_date);
    recommendations.push({
      id: `task-${top.id}`,
      title: `ابدأ بمهمة: ${top.title}`,
      reason: days !== null && days < 0 ? `متأخرة ${Math.abs(days)} يوم/أيام وأولويتها ${top.priority}.` : `هي أعلى مهمة حسب الأولوية والموعد ونسبة الإنجاز.`,
      action: top.status === "Review" ? "أكمل المراجعة واتخذ قرار الاعتماد." : "خصص لها أول جلسة عمل مركزة اليوم.",
      severity: days !== null && days < 0 ? "critical" : "warning",
      taskId: top.id,
    });
  }
  if (onHold.length > 0) recommendations.push({ id: "on-hold", title: `راجع ${onHold.length} مشروع متوقف`, reason: "المشروعات المتوقفة تقلل صحة مساحة العمل وقد تخفي عائقًا يحتاج قرارًا.", action: "حدد سبب التوقف ومالك الإجراء التالي وموعد استئناف واضح.", severity: "warning" });
  if (unread.length > 0) recommendations.push({ id: "alerts", title: `راجع ${unread.length} تنبيه غير مقروء`, reason: "قد تتضمن التنبيهات تغييرات تؤثر على الأولويات الحالية.", action: "راجع التنبيهات العالية أولًا ثم حدّث القرار التنفيذي.", severity: "warning" });
  if (recommendations.length === 0) recommendations.push({ id: "momentum", title: "حافظ على إيقاع التنفيذ", reason: "لا توجد مؤشرات حرجة في البيانات الحالية.", action: "حدّث تقدم المشاريع وأغلق مهمة واحدة مفتوحة اليوم.", severity: "opportunity" });

  const headline = overdue.length > 0
    ? `لديك ${overdue.length} مهمة متأخرة تحتاج تدخلاً الآن.`
    : focusTasks[0]
      ? `أهم تركيز الآن: ${focusTasks[0].title}`
      : activeProjects.length > 0
        ? "مساحة العمل مستقرة؛ حافظ على سرعة التنفيذ."
        : "ابدأ بإنشاء مشروع ومهمة قابلة للتنفيذ.";

  return {
    health,
    confidence,
    headline,
    summary: `تم تحليل ${data.projects.length} مشروع و${data.tasks.length} مهمة و${data.notifications.length} تنبيه.`,
    openTasks: openTasks.length,
    overdueTasks: overdue.length,
    activeProjects: activeProjects.length,
    unreadAlerts: unread.length,
    recommendations: recommendations.slice(0, 4),
    focusTasks,
  };
}
