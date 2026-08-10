"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/i18n/language-provider";
import "../login/login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => text("جارٍ التحقق من رابط الاستعادة…", "Verifying recovery link…"));
  const [tone, setTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setReady(true);
        setMessage(text("تم التحقق من رابط الاستعادة. اختر كلمة مرور جديدة.", "Recovery link verified. Choose a new password."));
        setTone("info");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setReady(true);
        setMessage(text("تم التحقق من رابط الاستعادة. اختر كلمة مرور جديدة.", "Recovery link verified. Choose a new password."));
        setTone("info");
      }
    });
    const timer = window.setTimeout(() => {
      if (!mounted) return;
      setReady((current) => {
        if (!current) {
          setTone("error");
          setMessage(text("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة الاستعادة.", "The recovery link is invalid or expired. Request a new link from the recovery page."));
        }
        return current;
      });
    }, 6000);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [text]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;
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
      setMessage(text("تم تحديث كلمة المرور بنجاح. سيتم نقلك إلى BASOUL الآن.", "Password updated successfully. You will be taken to BASOUL now."));
      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 800);
    } catch (error) {
      const raw = error instanceof Error ? error.message.toLowerCase() : "";
      setTone("error");
      setMessage(raw.includes("same password") ? text("اختر كلمة مرور مختلفة عن كلمة المرور الحالية.", "Choose a password different from your current password.") : text("تعذر تحديث كلمة المرور. اطلب رابط استعادة جديدًا وحاول مرة أخرى.", "Unable to update the password. Request a new recovery link and try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="basoul-password-card" aria-labelledby="basoul-reset-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>SECURE PASSWORD RESET</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>
        <div className="basoul-password-copy">
          <h1 id="basoul-reset-title">{text("تعيين كلمة مرور جديدة", "Set a new password")}</h1>
          <p>{text("اختر كلمة مرور جديدة لحسابك. لن يتم حفظها في GitHub أو Vercel أو داخل كود BASOUL.", "Choose a new password for your account. It will not be stored in GitHub, Vercel, or BASOUL source code.")}</p>
        </div>
        <form onSubmit={submit} className="basoul-password-form">
          <label><span>{text("كلمة المرور الجديدة", "New password")}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!ready || busy} /></label>
          <label><span>{text("تأكيد كلمة المرور", "Confirm password")}</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!ready || busy} /></label>
          <button type="submit" disabled={!ready || busy || password.length < 8 || !confirmPassword}>{busy ? text("جارٍ تحديث كلمة المرور…", "Updating password…") : text("حفظ كلمة المرور الجديدة", "Save new password")}</button>
        </form>
        {message && <div className={`basoul-password-${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</div>}
        {tone === "error" && <div className="basoul-password-tools" style={{ marginTop: 18, justifyContent: "center" }}><Link href="/forgot-password">{text("طلب رابط استعادة جديد", "Request a new recovery link")}</Link></div>}
        <small>BASOUL · SECURE RECOVERY</small>
      </section>
    </main>
  );
}
