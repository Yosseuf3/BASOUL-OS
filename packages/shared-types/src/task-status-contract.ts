/** Canonical read contract. New workflow writes remain disabled in Phase 1. */
export const TASK_STATUSES = ["To Do", "In Progress", "Waiting", "Review", "Done"] as const;
export type CanonicalTaskStatus = typeof TASK_STATUSES[number];
export const TASK_WORKFLOW_WRITES_ENABLED = false;
export const TASK_STATUS_LABELS: Record<CanonicalTaskStatus, string> = {
  "To Do": "للعمل", "In Progress": "قيد التنفيذ", Waiting: "بانتظار متطلب خارجي", Review: "بانتظار المراجعة", Done: "مكتملة",
};
export function taskStatusLabel(value: unknown, language: "ar" | "en" = "ar"): string {
  return isTaskStatus(value) ? language === "en" ? value : TASK_STATUS_LABELS[value] : language === "en" ? "Unknown status" : "حالة غير معروفة";
}
export function taskStatusClass(value: unknown): string {
  return isTaskStatus(value) ? value.toLowerCase().replaceAll(" ", "-") : "unknown";
}
export function assertLegacyTaskWrite(value: unknown): asserts value is CanonicalTaskStatus {
  if (!isTaskStatus(value)) throw new Error("TASK_STATUS_UNKNOWN");
  if (value === "Review") throw new Error("TASK_REVIEW_DATABASE_MIGRATION_REQUIRED");
  if (value === "Waiting") throw new Error("TASK_WORKFLOW_NOT_ACTIVATED");
}
export function assertCompatibilityTaskWrite(value: unknown, previous?: unknown): asserts value is CanonicalTaskStatus {
  if (previous !== undefined && !isTaskStatus(previous)) throw new Error("TASK_STATUS_UNKNOWN");
  if (!isTaskStatus(value)) throw new Error("TASK_STATUS_UNKNOWN");
  if (value === "Review") throw new Error("TASK_REVIEW_DATABASE_MIGRATION_REQUIRED");
  if (value === "Waiting" && previous !== "Waiting") throw new Error("TASK_WORKFLOW_NOT_ACTIVATED");
}
export const TASK_STATUS_MEANING: Record<CanonicalTaskStatus, string> = {
  "To Do": "Execution has not started",
  "In Progress": "Execution is active",
  Waiting: "Execution is blocked by an external dependency",
  Review: "Execution is complete and awaiting acceptance",
  Done: "Completion has been accepted",
};
export const TASK_TRANSITIONS: Readonly<Record<CanonicalTaskStatus, readonly CanonicalTaskStatus[]>> = {
  "To Do": ["In Progress"],
  "In Progress": ["Waiting", "Review"],
  Waiting: ["In Progress"],
  Review: ["In Progress", "Done"],
  Done: [],
};

export function isTaskStatus(value: unknown): value is CanonicalTaskStatus {
  return typeof value === "string" && TASK_STATUSES.some((status) => status === value);
}

export function canTransitionTask(from: unknown, to: unknown): boolean {
  return isTaskStatus(from) && isTaskStatus(to) && TASK_TRANSITIONS[from].includes(to);
}

export type TaskTransitionRecord = {
  id: string; organizationId: string; creatorId: string;
  status: unknown; progress: number; updatedAt: string;
};
/** Must be resolved by a trusted authenticated boundary, not accepted from a client. */
export type VerifiedTaskActor = {
  userId: string; organizationId: string; membershipActive: boolean; canUpdate: boolean;
};

export function prepareTaskTransition(
  task: TaskTransitionRecord,
  actor: VerifiedTaskActor,
  expected: { status: unknown; updatedAt: string },
  target: unknown,
): { taskId: string; organizationId: string; creatorId: string; expectedStatus: CanonicalTaskStatus; expectedUpdatedAt: string; status: CanonicalTaskStatus; progress: number } {
  if (!actor.userId || !actor.organizationId || !actor.membershipActive || !actor.canUpdate
      || actor.organizationId !== task.organizationId || actor.userId !== task.creatorId) {
    throw new Error("TASK_TRANSITION_FORBIDDEN");
  }
  if (!isTaskStatus(task.status) || !isTaskStatus(target)) throw new Error("TASK_STATUS_UNKNOWN");
  if (!task.updatedAt || !expected.updatedAt || task.status !== expected.status || task.updatedAt !== expected.updatedAt) {
    throw new Error("TASK_TRANSITION_CONFLICT");
  }
  if (!canTransitionTask(task.status, target)) throw new Error("TASK_TRANSITION_REJECTED");
  if (!Number.isFinite(task.progress) || !Number.isInteger(task.progress) || task.progress < 0 || task.progress > 100) {
    throw new Error("TASK_PROGRESS_INVALID");
  }
  // No status transition fabricates, resets or normalizes recorded execution.
  return { taskId: task.id, organizationId: task.organizationId, creatorId: task.creatorId,
    expectedStatus: task.status, expectedUpdatedAt: task.updatedAt, status: target, progress: task.progress };
}
