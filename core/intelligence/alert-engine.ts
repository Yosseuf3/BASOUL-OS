import type { DashboardDecisionInput, DecisionItem } from "./types";
export function buildAlerts(input: DashboardDecisionInput, today: string): DecisionItem[] {
  const alerts: DecisionItem[] = [];
  const overdue = input.tasks.filter(t => t.status !== "Done" && t.due_date && t.due_date < today).length;
  const stalled = input.projects.filter(p => p.status === "On Hold").length;
  const highUnread = input.notifications.filter(n => !n.is_read && n.priority === "high").length;
  const pending = input.financeItems.filter(f => f.status === "Pending").length;
  if (overdue) alerts.push({ id:"overdue", title:`${overdue} مهام متأخرة`, detail:"تحتاج إعادة ترتيب أو موعدًا جديدًا.", score:100, tone:"critical", target:"tasks" });
  if (highUnread) alerts.push({ id:"high-notifications", title:`${highUnread} تنبيهات عالية الأولوية`, detail:"راجعها قبل بدء العمل.", score:90, tone:"critical", target:"notifications" });
  if (stalled) alerts.push({ id:"stalled", title:`${stalled} مشاريع متوقفة`, detail:"حدد قرار الاستكمال أو الإغلاق.", score:70, tone:"warning", target:"projects" });
  if (pending) alerts.push({ id:"pending", title:`${pending} معاملات معلقة`, detail:"راجع التحصيلات والمصروفات غير المسددة.", score:55, tone:"warning", target:"finance" });
  return alerts.slice(0,4);
}
