"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../login/login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("جارٍ التحقق من رابط الاستعادة…");
  const [tone, setTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setReady(true);
        setMessage("تم التحقق من رابط الاستعادة. اختر كلمة مرور جديدة.");
        setTone("info");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setReady(true);
        setMessage("تم التحقق من رابط الاستعادة. اختر كلمة مرور جديدة.");
        setTone("info");
      }
    });
    const timer = window.setTimeout(() => {
      if (!mounted) return;
      setReady((current) => {
        if (!current) {
          setTone("error");
          setMessage("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة الاستعادة.");
        }
        return current;
      });
    }, 6000);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;
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
      setMessage("تم تحديث كلمة المرور بنجاح. سيتم نقلك إلى BASOUL الآن.");
      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 800);
    } catch (error) {
      const raw = error instanceof Error ? error.message.toLowerCase() : "";
      setTone("error");
      setMessage(raw.includes("same password") ? "اختر كلمة مرور مختلفة عن كلمة المرور الحالية." : "تعذر تحديث كلمة المرور. اطلب رابط استعادة جديدًا وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir="rtl">
      <section className="basoul-password-card" aria-labelledby="basoul-reset-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>SECURE PASSWORD RESET</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>
        <div className="basoul-password-copy">
          <h1 id="basoul-reset-title">تعيين كلمة مرور جديدة</h1>
          <p>اختر كلمة مرور جديدة لحسابك. لن يتم حفظها في GitHub أو Vercel أو داخل كود BASOUL.</p>
        </div>
        <form onSubmit={submit} className="basoul-password-form">
          <label>
            <span>كلمة المرور الجديدة</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!ready || busy} />
          </label>
          <label>
            <span>تأكيد كلمة المرور</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!ready || busy} />
          </label>
          <button type="submit" disabled={!ready || busy || password.length < 8 || !confirmPassword}>{busy ? "جارٍ تحديث كلمة المرور…" : "حفظ كلمة المرور الجديدة"}</button>
        </form>
        {message && <div className={`basoul-password-${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</div>}
        {tone === "error" && <div className="basoul-password-tools" style={{ marginTop: 18, justifyContent: "center" }}><Link href="/forgot-password">طلب رابط استعادة جديد</Link></div>}
        <small>BASOUL · SECURE RECOVERY</small>
      </section>
    </main>
  );
}
