export type AccessFailure = "revoked" | "account_changed" | "permission" | "unverified";

export class OrganizationAccessError extends Error {
  constructor(public readonly reason: AccessFailure, message: string, public readonly original?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "OrganizationAccessError";
  }
}

export function losesOrganizationAccess(cause: unknown): boolean {
  return cause instanceof OrganizationAccessError && (cause.reason === "revoked" || cause.reason === "account_changed");
}

export function accountChanged(previous: string | null, next: string | null): boolean {
  return previous !== next;
}

export function safeOperationError(cause: unknown): { message: string; code?: string } {
  const original = cause instanceof OrganizationAccessError ? cause.original ?? cause : cause;
  const fields = original && typeof original === "object" ? original as { code?: unknown; message?: unknown } : {};
  // Never render backend details/hints, arbitrary messages, identities or payloads.
  const code = typeof fields.code === "string" && /^(?:[0-9A-Z]{5}|PGRST\d{3}|AUTH_[A-Z_]{1,40})$/.test(fields.code) ? fields.code : undefined;
  let message = "تعذر إكمال العملية. تحقق من البيانات قبل المحاولة مجدداً.";
  if (cause instanceof OrganizationAccessError) {
    message = cause.reason === "unverified" ? "تعذر التحقق من الصلاحيات. حدّث المؤسسة قبل الكتابة؛ لا تفترض أن العملية لم تُحفظ."
      : cause.reason === "account_changed" ? "تغير الحساب. أعد التحقق من الجلسة."
      : cause.reason === "revoked" ? "لم تعد عضوية المؤسسة نشطة."
      : "لا يملك دورك الحالي صلاحية هذه العملية.";
  } else if (code?.startsWith("22") || code === "23514") {
    message = "رفضت المنصة قيمة غير مدعومة. لم تُعد المحاولة تلقائياً.";
  } else if (code === "42501") {
    message = "رفضت المنصة صلاحية العملية. حدّث المؤسسة للتحقق من دورك.";
  } else if (typeof fields.message === "string" && /network|fetch|timeout|connection/i.test(fields.message)) {
    message = "تعذر الاتصال. قد تكون العملية حُفظت؛ حدّث البيانات للتحقق قبل إعادة المحاولة.";
  }
  return { message: code ? `${message} (${code})` : message, code };
}

// One attempt only. Late failures cannot clear a newer tenant/account selection.
export async function runOrganizationOperation<T>(
  operation: () => Promise<T>,
  current: () => boolean,
  succeeded: () => Promise<void>,
  failed: (cause: unknown, invalidate: boolean) => void,
): Promise<T> {
  try {
    const result = await operation();
    if (current()) await succeeded();
    return result;
  } catch (cause) {
    if (current()) failed(cause, losesOrganizationAccess(cause));
    throw cause;
  }
}
