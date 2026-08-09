"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../login/login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

function recoveryMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const value = raw.toLowerCase();
  if (value.includes("rate limit")) return "تم بلوغ حد إرسال البريد مؤقتًا. انتظر حتى تتجدد نافذة الإرسال ثم أرسل طلبًا واحدًا فقط.";
  if (value.includes("failed to fetch") || value.includes("network")) return "تعذر الوصول إلى خدمة الاستعادة. تحقق من الاتصال ثم أعد المحاولة.";
  return "تعذر إرسال رسالة الاستعادة الآن. حاول لاحقًا.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("yosseuf.radwan@gmail.com");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error" | "info">("info");

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
      setMessage("تم إرسال رابط استعادة كلمة المرور. افتح الرسالة واضغط الرابط مرة واحدة لتعيين كلمة مرور جديدة.");
    } catch (error) {
      setTone("error");
      setMessage(recoveryMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir="rtl">
      <section className="basoul-password-card" aria-labelledby="basoul-recovery-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>SECURE ACCOUNT RECOVERY</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>
        <div className="basoul-password-copy">
          <h1 id="basoul-recovery-title">استعادة كلمة المرور</h1>
          <p>سنرسل رابطًا آمنًا إلى بريدك لتعيين كلمة مرور جديدة. لا تكرر الطلب أثناء انتظار الرسالة.</p>
        </div>
        <form onSubmit={submit} className="basoul-password-form">
          <label>
            <span>البريد الإلكتروني</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" required />
          </label>
          <button type="submit" disabled={busy || !email.trim()}>{busy ? "جارٍ إرسال رابط الاستعادة…" : "إرسال رابط الاستعادة"}</button>
        </form>
        {message && <div className={`basoul-password-${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</div>}
        <div className="basoul-password-tools" style={{ marginTop: 18, justifyContent: "center" }}><Link href="/login">العودة إلى تسجيل الدخول</Link></div>
        <small>BASOUL · ACCOUNT RECOVERY</small>
      </section>
    </main>
  );
}
