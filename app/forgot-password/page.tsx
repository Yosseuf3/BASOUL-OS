"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/i18n/language-provider";
import "../login/login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/BASOUL-OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function ForgotPasswordPage() {
  const { locale, text } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error" | "info">("info");

  const recoveryMessage = (error: unknown) => {
    const raw = error instanceof Error ? error.message : String(error ?? "");
    const value = raw.toLowerCase();
    if (value.includes("rate limit")) return text("تم بلوغ حد إرسال البريد مؤقتًا. انتظر حتى تتجدد نافذة الإرسال ثم أرسل طلبًا واحدًا فقط.", "The email sending limit has been reached temporarily. Wait for the window to reset, then send one request.");
    if (value.includes("failed to fetch") || value.includes("network")) return text("تعذر الوصول إلى خدمة الاستعادة. تحقق من الاتصال ثم أعد المحاولة.", "Unable to reach the recovery service. Check your connection and try again.");
    return text("تعذر إرسال رسالة الاستعادة الآن. حاول لاحقًا.", "Unable to send the recovery email right now. Try again later.");
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setTone("info");
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setTone("success");
      setMessage(text("تم إرسال رابط استعادة كلمة المرور. افتح الرسالة واضغط الرابط مرة واحدة لتعيين كلمة مرور جديدة.", "Password recovery link sent. Open the email and use the link once to set a new password."));
    } catch (error) {
      setTone("error");
      setMessage(recoveryMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="basoul-password-card" aria-labelledby="basoul-recovery-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>SECURE ACCOUNT RECOVERY</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>
        <div className="basoul-password-copy">
          <h1 id="basoul-recovery-title">{text("استعادة كلمة المرور", "Password recovery")}</h1>
          <p>{text("سنرسل رابطًا آمنًا إلى بريدك لتعيين كلمة مرور جديدة. لا تكرر الطلب أثناء انتظار الرسالة.", "We will send a secure link to your email to set a new password. Do not repeat the request while waiting for the message.")}</p>
        </div>
        <form onSubmit={submit} className="basoul-password-form">
          <label><span>{text("البريد الإلكتروني", "Email")}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" required /></label>
          <button type="submit" disabled={busy || !email.trim()}>{busy ? text("جارٍ إرسال رابط الاستعادة…", "Sending recovery link…") : text("إرسال رابط الاستعادة", "Send recovery link")}</button>
        </form>
        {message && <div className={`basoul-password-${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</div>}
        <div className="basoul-password-tools" style={{ marginTop: 18, justifyContent: "center" }}><Link href="/login">{text("العودة إلى تسجيل الدخول", "Back to sign in")}</Link></div>
        <small>BASOUL · ACCOUNT RECOVERY</small>
      </section>
    </main>
  );
}
