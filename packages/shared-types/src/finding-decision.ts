export type FindingDecision = "accepted" | "rejected" | "resolved";

export function requireFindingDecisionVersion(version: unknown, status: unknown): asserts version is string {
  if (status !== "accepted" && status !== "rejected" && status !== "resolved") {
    throw new Error("قرار الملاحظة غير مدعوم. Unsupported finding decision.");
  }
  if (typeof version !== "string" || !version.trim()) {
    throw new Error("حدّث المراجعة قبل الحفظ. Refresh the review before saving.");
  }
}

export function findingDecisionConflict(): Error {
  return Object.assign(new Error("تغيرت الملاحظة أو لم يعد الوصول متاحًا. حدّث المراجعة. Finding changed or access is unavailable. Refresh the review."), {code:"PT409"});
}
