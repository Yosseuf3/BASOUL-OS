"use client";

import { useState } from "react";
import { buildDeletionRequestEmail } from "@/lib/privacy/deletion-request";

export function DeletionRequestForm() {
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("account-and-personal-data");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  return <form onSubmit={(event) => {
    event.preventDefault();
    setDraft(null);
    try { setDraft(buildDeletionRequestEmail(email, scope)); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Invalid request / طلب غير صالح"); }
  }}>
    <h2>Prepare a deletion request / تجهيز طلب حذف</h2>
    <p>No sign-in is required to prepare this request. This form creates an email draft on your device; it does not send or register it. Send from your account email. The operator must verify account ownership separately before action.</p>
    <p dir="rtl" lang="ar">لا يلزم تسجيل الدخول لتجهيز الطلب. يُنشئ النموذج مسودة بريد على جهازك ولا يرسلها أو يسجلها. أرسلها من بريد حسابك؛ ويتحقق المسؤول من ملكية الحساب بشكل مستقل قبل التنفيذ.</p>
    <label htmlFor="deletion-email">Account email / بريد الحساب</label>
    <input id="deletion-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => { setEmail(e.target.value); setDraft(null); }} />
    <label htmlFor="deletion-scope">Scope / النطاق</label>
    <select id="deletion-scope" value={scope} onChange={(e) => { setScope(e.target.value); setDraft(null); }}>
      <option value="account-and-personal-data">Account and associated personal data / الحساب والبيانات الشخصية المرتبطة</option>
      <option value="specific-personal-data">Specific personal data — clarify by email / بيانات شخصية محددة — وضّح بالبريد</option>
    </select>
    <button type="submit">Prepare email / تجهيز البريد</button>
    {error && <p role="alert">{error}</p>}
    {draft && <p role="status"><a href={draft}>Open email draft / فتح مسودة البريد</a> — Not sent or verified. If no email app opens, email yosseuf.radwan@gmail.com directly. / لم يُرسل الطلب أو يُتحقق منه.</p>}
  </form>;
}
