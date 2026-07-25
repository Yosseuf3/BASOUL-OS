import type { DashboardDecisionInput, DashboardDecisionState } from "./types";
import { buildPriorityItems } from "./priority-engine";
import { buildAlerts } from "./alert-engine";
import { buildBrief } from "./summary-engine";
export function buildDashboardDecision(input: DashboardDecisionInput, userName="Yosseuf"): DashboardDecisionState {
  const now=input.now??new Date(); const today=now.toISOString().slice(0,10); const next=new Date(now.getTime()+7*86400000).toISOString().slice(0,10);
  const paid=input.financeItems.filter(i=>i.status==="Paid"); const currency=paid[0]?.currency??input.financeItems[0]?.currency??"SAR"; const same=paid.filter(i=>i.currency===currency);
  const income=same.filter(i=>i.type==="Income").reduce((s,i)=>s+Number(i.amount),0); const expense=same.filter(i=>i.type==="Expense").reduce((s,i)=>s+Number(i.amount),0);
  const done=input.tasks.filter(t=>t.status==="Done").length;
  const stats={ activeProjects:input.projects.filter(p=>p.status==="Active").length, stalledProjects:input.projects.filter(p=>p.status==="On Hold").length, overdueTasks:input.tasks.filter(t=>t.status!=="Done"&&t.due_date&&t.due_date<today).length, dueToday:input.tasks.filter(t=>t.status!=="Done"&&t.due_date===today).length, dueSoon:input.tasks.filter(t=>t.status!=="Done"&&t.due_date&&t.due_date>today&&t.due_date<=next).length, doneTasks:done, completion:input.tasks.length?Math.round(done/input.tasks.length*100):0, activeClients:input.clients.filter(c=>c.status==="Active").length, followUps:input.clients.filter(c=>c.next_follow_up&&c.next_follow_up<=today&&c.status!=="Inactive").length, unreadNotifications:input.notifications.filter(n=>!n.is_read).length, highNotifications:input.notifications.filter(n=>!n.is_read&&n.priority==="high").length, income, expense, net:income-expense, pendingPayments:input.financeItems.filter(i=>i.status==="Pending").length, currency };
  const focus=buildPriorityItems(input,today,next,now).slice(0,5); const alerts=buildAlerts(input,today); return {today,inSevenDays:next,focus,alerts,stats,brief:buildBrief(stats,focus,userName,now)};
}
