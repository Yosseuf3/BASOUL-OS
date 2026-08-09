"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./set-password.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function SetPasswordPage() {
  const router = useRouter();
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
        setMessage("لا توجد جلسة دخول صالحة على هذا النطاق. افتح هذه الصفحة من المتصفح الذي أنت مسجل الدخول فيه بالفعل.");
      }
    });
    return () => { mounted = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSession || busy) return;
    if (password.length < 8) {
      setTone("error");
      setMessage("استخدم كلمة مرور مكونة من 8 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setTone("error");
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setTone("success");
      setMessage("تم تعيين كلمة المرور بنجاح. يمكنك الآن استخدام تسجيل الدخول بالبريد وكلمة المرور في BASOUL Preview.");
      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1200);
    } catch (error) {
      const raw = error instanceof Error ? error.message.toLowerCase() : "";
      setTone("error");
      if (raw.includes("same password")) setMessage("اختر كلمة مرور مختلفة عن كلمة المرور الحالية.");
      else if (raw.includes("session") || raw.includes("jwt")) setMessage("انتهت جلسة الدخول. سجّل الدخول من جديد ثم أعد المحاولة.");
      else setMessage("تعذر تعيين كلمة المرور. لم يتم تغيير أي بيانات أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-set-password" dir="rtl">
      <section className="basoul-set-password-card">
        <div className="brand">
          <img src={BASOUL_SYMBOL} width="68" height="82" alt="BASOUL symbol" />
          <span>SECURE ACCOUNT SETUP</span>
          <img className="wordmark" src={BASOUL_WORDMARK} width="250" height="64" alt="BASOUL" />
        </div>
        <div className="copy">
          <h1>تعيين كلمة مرور</h1>
          <p>استخدم جلسة الدخول الحالية لتعيين كلمة مرور جديدة مباشرة، دون إرسال بريد أو Magic Link.</p>
          {email && <small>{email}</small>}
        </div>

        {checking ? <div className="status info">جارٍ التحقق من جلسة الدخول…</div> : (
          <form onSubmit={submit}>
            <label><span>كلمة المرور الجديدة</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!hasSession || busy} /></label>
            <label><span>تأكيد كلمة المرور</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!hasSession || busy} /></label>
            <button type="submit" disabled={!hasSession || busy || password.length < 8 || !confirmPassword}>{busy ? "جارٍ حفظ كلمة المرور…" : "حفظ كلمة المرور الجديدة"}</button>
          </form>
        )}

        {message && <div className={`status ${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</div>}
        <Link href="/">العودة إلى لوحة القيادة</Link>
      </section>
    </main>
  );
}
