import type { DashboardDecisionInput, DecisionItem } from "./types";
const day = 86400000;
export function buildPriorityItems(input: DashboardDecisionInput, today: string, inSevenDays: string, now: Date = input.now ?? new Date()): DecisionItem[] {
  const items: DecisionItem[] = [];
  for (const task of input.tasks) {
    if (task.status === "Done") continue;
    const overdue = Boolean(task.due_date && task.due_date < today);
    const dueToday = task.due_date === today;
    const dueSoon = Boolean(task.due_date && task.due_date > today && task.due_date <= inSevenDays);
    const priorityWeight = { Low: 5, Medium: 15, High: 30, Critical: 45 }[task.priority];
    const dateWeight = overdue ? 70 : dueToday ? 55 : dueSoon ? 25 : 0;
    const age = Math.min(15, Math.floor((now.getTime() - new Date(task.updated_at).getTime()) / day));
    items.push({ id: `task-${task.id}`, entityId: task.id, title: task.title, detail: overdue ? `متأخرة منذ ${task.due_date}` : dueToday ? "مستحقة اليوم" : dueSoon ? `موعدها ${task.due_date}` : "مهمة مفتوحة", score: priorityWeight + dateWeight + age, tone: overdue || task.priority === "Critical" ? "critical" : dueToday || task.priority === "High" ? "warning" : "neutral", target: "tasks" });
  }
  for (const project of input.projects) {
    if (project.status === "Completed") continue;
    const overdue = Boolean(project.due_date && project.due_date < today);
    const stalled = project.status === "On Hold";
    const score = (overdue ? 70 : 0) + (stalled ? 45 : 0) + ({ Low: 5, Medium: 12, High: 25, Critical: 40 }[project.priority]);
    if (score >= 35) items.push({ id: `project-${project.id}`, entityId: project.id, title: `متابعة مشروع ${project.name}`, detail: overdue ? "تجاوز موعده المستهدف" : stalled ? "متوقف مؤقتًا ويحتاج قرارًا" : `${project.progress}% مكتمل`, score, tone: overdue || project.priority === "Critical" ? "critical" : "warning", target: "projects" });
  }
  for (const client of input.clients) {
    if (client.next_follow_up && client.next_follow_up <= today && client.status !== "Inactive") items.push({ id: `client-${client.id}`, entityId: client.id, title: `متابعة ${client.name}`, detail: client.next_follow_up < today ? "موعد المتابعة متأخر" : "موعد المتابعة اليوم", score: client.next_follow_up < today ? 62 : 48, tone: client.next_follow_up < today ? "critical" : "warning", target: "clients" });
  }
  for (const item of input.financeItems) {
    if (item.status === "Pending") items.push({ id: `finance-${item.id}`, entityId: item.id, title: item.type === "Income" ? `تحصيل: ${item.description}` : `اعتماد مصروف: ${item.description}`, detail: `${Number(item.amount).toLocaleString("en-US")} ${item.currency}`, score: item.type === "Income" ? 50 : 32, tone: "warning", target: "finance" });
  }
  return items.sort((a, b) => b.score - a.score);
}
