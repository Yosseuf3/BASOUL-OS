import type { DashboardDecisionState } from "./types";
export function buildBrief(stats: DashboardDecisionState["stats"], focus: DashboardDecisionState["focus"], userName: string, now: Date = new Date()) {
  const headline = `${greeting(now)}، ${userName}`;
  if (!stats.activeProjects && !stats.dueToday && !stats.overdueTasks) return { headline, message:"مساحة العمل جاهزة. ابدأ بإنشاء مشروعك الأول لتتحول اللوحة إلى مركز قيادة حي.", priorityLine:"الخطوة التالية: إنشاء أول مشروع وربطه بعميل." };
  const parts = [] as string[];
  if (stats.overdueTasks) parts.push(`${stats.overdueTasks} متأخرة`);
  if (stats.dueToday) parts.push(`${stats.dueToday} مستحقة اليوم`);
  if (stats.pendingPayments) parts.push(`${stats.pendingPayments} دفعات معلقة`);
  const message = parts.length ? `لديك ${parts.join("، ")} وتحتاج إلى ترتيب يومك قبل التوسع في أعمال جديدة.` : `الوضع مستقر عبر ${stats.activeProjects} مشاريع نشطة، ولا توجد عناصر حرجة الآن.`;
  return { headline, message, priorityLine: focus[0] ? `أولوية اليوم: ${focus[0].title}.` : "أولوية اليوم: حافظ على إيقاع التنفيذ الحالي." };
}
function greeting(now: Date){const h=now.getHours();return h<12?"صباح الخير":h<18?"مساء الخير":"مساء النور";}
