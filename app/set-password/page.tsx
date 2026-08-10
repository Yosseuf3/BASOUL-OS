"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/i18n/language-provider";
import "./set-password.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function SetPasswordPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "error" | "success">("info");

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(Boolean(data.session));
      setEmail(data.session?.user.email ?? "");
      setChecking(false);
      if (!data.session) {
        setTone("error");
        setMessage(text("لا توجد جلسة دخول صالحة على هذا النطاق. افتح هذه الصفحة من المتصفح الذي أنت مسجل الدخول فيه بالفعل.", "There is no valid signed-in session on this domain. Open this page in the browser where you are already signed in."));
      }
    });
    return () => { mounted = false; };
  }, [text]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSession || busy) return;
    if (password.length < 8) {
      setTone("error");
      setMessage(text("استخدم كلمة مرور مكونة من 8 أحرف على الأقل.", "Use a password with at least 8 characters."));
      return;
    }
    if (password !== confirmPassword) {
      setTone("error");
      setMessage(text("كلمتا المرور غير متطابقتين.", "The passwords do not match."));
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setTone("success");
      setMessage(text("تم تعيين كلمة المرور بنجاح. يمكنك الآن استخدام تسجيل الدخول بالبريد وكلمة المرور في BASOUL Beta.", "Password set successfully. You can now use email and password sign-in in BASOUL Beta."));
      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1200);
    } catch (error) {
      const raw = error instanceof Error ? error.message.toLowerCase() : "";
      setTone("error");
      if (raw.includes("same password")) setMessage(text("اختر كلمة مرور مختلفة عن كلمة المرور الحالية.", "Choose a password different from your current password."));
      else if (raw.includes("session") || raw.includes("jwt")) setMessage(text("انتهت جلسة الدخول. سجّل الدخول من جديد ثم أعد المحاولة.", "Your session has expired. Sign in again, then retry."));
      else setMessage(text("تعذر تعيين كلمة المرور. لم يتم تغيير أي بيانات أخرى.", "Unable to set the password. No other data was changed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-set-password" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="basoul-set-password-card">
        <div className="brand">
          <img src={BASOUL_SYMBOL} width="68" height="82" alt="BASOUL symbol" />
          <span>SECURE ACCOUNT SETUP</span>
          <img className="wordmark" src={BASOUL_WORDMARK} width="250" height="64" alt="BASOUL" />
        </div>
        <div className="copy">
          <h1>{text("تعيين كلمة مرور", "Set password")}</h1>
          <p>{text("استخدم جلسة الدخول الحالية لتعيين كلمة مرور جديدة مباشرة، دون إرسال بريد أو Magic Link.", "Use your current signed-in session to set a new password directly, without email or Magic Link.")}</p>
          {email && <small>{email}</small>}
        </div>

        {checking ? <div className="status info">{text("جارٍ التحقق من جلسة الدخول…", "Checking signed-in session…")}</div> : (
          <form onSubmit={submit}>
            <label><span>{text("كلمة المرور الجديدة", "New password")}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!hasSession || busy} /></label>
            <label><span>{text("تأكيد كلمة المرور", "Confirm password")}</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!hasSession || busy} /></label>
            <button type="submit" disabled={!hasSession || busy || password.length < 8 || !confirmPassword}>{busy ? text("جارٍ حفظ كلمة المرور…", "Saving password…") : text("حفظ كلمة المرور الجديدة", "Save new password")}</button>
          </form>
        )}

        {message && <div className={`status ${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</div>}
        <Link href="/">{text("العودة إلى لوحة القيادة", "Back to dashboard")}</Link>
      </section>
    </main>
  );
}
