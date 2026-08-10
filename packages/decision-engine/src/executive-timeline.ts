import type { ActivityEvent } from "@basoul/shared-types";
import type { DecisionInput, DecisionLocale, DecisionTarget } from "./types";

export type ExecutiveTimelineItem = {
  id: string;
  at: string;
  title: string;
  detail: string;
  kind: "activity" | "deadline" | "finance" | "alert";
  target: DecisionTarget;
  entityId?: string;
};

const moduleTarget = (module: ActivityEvent["module"]): DecisionTarget =>
  module === "system" || module === "content" || module === "knowledge" ? "activity" : module;

export function buildExecutiveTimeline(input: DecisionInput, locale: DecisionLocale = "ar"): ExecutiveTimelineItem[] {
  const en = locale === "en";
  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const items: ExecutiveTimelineItem[] = input.activityEvents.map((event) => ({
    id: `activity-${event.id}`,
    at: event.created_at,
    title: event.title,
    detail: event.description ?? (en ? `Update in ${event.module}` : `تحديث في ${event.module}`),
    kind: "activity",
    target: moduleTarget(event.module),
    entityId: event.entity_id ?? undefined,
  }));

  input.tasks.filter((task) => task.status !== "Done" && task.due_date).forEach((task) => items.push({
    id: `deadline-${task.id}`,
    at: `${task.due_date}T12:00:00.000Z`,
    title: task.due_date! < today ? (en ? `Overdue task: ${task.title}` : `مهمة متأخرة: ${task.title}`) : (en ? `Due: ${task.title}` : `استحقاق: ${task.title}`),
    detail: task.due_date! < today ? (en ? "Past due date" : "تجاوزت موعد الاستحقاق") : (en ? "Upcoming due date needs attention" : "موعد قادم يحتاج متابعة"),
    kind: "deadline",
    target: "tasks",
    entityId: task.id,
  }));

  input.financeItems.filter((item) => item.status === "Pending").forEach((item) => items.push({
    id: `finance-${item.id}`,
    at: `${item.transaction_date}T12:00:00.000Z`,
    title: en ? `Pending transaction: ${item.description}` : `معاملة معلقة: ${item.description}`,
    detail: `${item.amount} ${item.currency}`,
    kind: "finance",
    target: "finance",
    entityId: item.id,
  }));

  input.notifications.filter((item) => !item.is_read && item.priority === "high").forEach((item) => items.push({
    id: `alert-${item.id}`,
    at: item.created_at,
    title: item.title,
    detail: item.message ?? (en ? "High-priority alert" : "تنبيه عالي الأولوية"),
    kind: "alert",
    target: "notifications",
    entityId: item.entity_id ?? undefined,
  }));

  return items.sort((a, b) => Math.abs(new Date(a.at).getTime() - now.getTime()) - Math.abs(new Date(b.at).getTime() - now.getTime())).slice(0, 8);
}
