import type { ActivityEvent } from "@yosseuf/shared-types";
import type { DecisionInput, DecisionTarget } from "./types";

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

export function buildExecutiveTimeline(input: DecisionInput): ExecutiveTimelineItem[] {
  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const items: ExecutiveTimelineItem[] = input.activityEvents.map((event) => ({
    id: `activity-${event.id}`,
    at: event.created_at,
    title: event.title,
    detail: event.description ?? `تحديث في ${event.module}`,
    kind: "activity",
    target: moduleTarget(event.module),
    entityId: event.entity_id ?? undefined,
  }));

  input.tasks.filter((task) => task.status !== "Done" && task.due_date).forEach((task) => items.push({
    id: `deadline-${task.id}`,
    at: `${task.due_date}T12:00:00.000Z`,
    title: task.due_date! < today ? `مهمة متأخرة: ${task.title}` : `استحقاق: ${task.title}`,
    detail: task.due_date! < today ? "تجاوزت موعد الاستحقاق" : "موعد قادم يحتاج متابعة",
    kind: "deadline",
    target: "tasks",
    entityId: task.id,
  }));

  input.financeItems.filter((item) => item.status === "Pending").forEach((item) => items.push({
    id: `finance-${item.id}`,
    at: `${item.transaction_date}T12:00:00.000Z`,
    title: `معاملة معلقة: ${item.description}`,
    detail: `${item.amount} ${item.currency}`,
    kind: "finance",
    target: "finance",
    entityId: item.id,
  }));

  input.notifications.filter((item) => !item.is_read && item.priority === "high").forEach((item) => items.push({
    id: `alert-${item.id}`,
    at: item.created_at,
    title: item.title,
    detail: item.message ?? "تنبيه عالي الأولوية",
    kind: "alert",
    target: "notifications",
    entityId: item.entity_id ?? undefined,
  }));

  return items.sort((a, b) => Math.abs(new Date(a.at).getTime() - now.getTime()) - Math.abs(new Date(b.at).getTime() - now.getTime())).slice(0, 8);
}
