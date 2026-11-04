export const DELETION_SUPPORT_EMAIL = "yosseuf.radwan@gmail.com";

/** Builds an email draft only. Never sends, stores or verifies a request. */
export function buildDeletionRequestEmail(email: string, scope: string): string {
  const account = email.trim();
  if (account.length > 254 || !/^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(account)) {
    throw new Error("Enter a valid account email / أدخل بريد الحساب الصحيح");
  }
  if (scope !== "account-and-personal-data" && scope !== "specific-personal-data") {
    throw new Error("Select a request scope / اختر نطاق الطلب");
  }
  const subject = "BASOUL OS account and data deletion request";
  const body = [
    `Account email / بريد الحساب: ${account}`,
    `Scope / النطاق: ${scope}`,
    "I request review of deletion of my account/personal data within this scope.",
    "أطلب مراجعة حذف حسابي/بياناتي الشخصية ضمن هذا النطاق.",
    "I understand that account ownership must be verified separately and shared organization records require review.",
    "أفهم ضرورة التحقق المستقل من ملكية الحساب ومراجعة سجلات المؤسسة المشتركة.",
    "Do not include passwords, login codes, identity documents or customer files.",
  ].join("\n");
  return `mailto:${DELETION_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
