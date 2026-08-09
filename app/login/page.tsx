"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

function authMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const value = raw.toLowerCase();
  if (value.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (value.includes("email not confirmed")) return "البريد الإلكتروني غير مؤكد بعد.";
  if (value.includes("rate limit")) return "تمت محاولات كثيرة خلال فترة قصيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  if (value.includes("failed to fetch") || value.includes("network")) return "تعذر الوصول إلى خدمة تسجيل الدخول. تحقق من الاتصال ثم أعد المحاولة.";
  return "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.";
}

export default function PasswordLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir="rtl">
      <section className="basoul-password-card" aria-labelledby="basoul-login-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>AI-NATIVE ECOSYSTEM</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>

        <div className="basoul-password-copy">
          <h1 id="basoul-login-title">تسجيل الدخول</h1>
          <p>استخدم بريدك وكلمة المرور للوصول إلى مساحة العمل دون الاعتماد على رسائل Magic Link.</p>
        </div>

        <form onSubmit={submit} className="basoul-password-form">
          <label>
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>
          <label>
            <span>كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              minLength={6}
            />
          </label>
          <button type="submit" disabled={busy || !email.trim() || !password}>
            {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
          </button>
        </form>

        {message && <div className="basoul-password-error" role="alert">{message}</div>}
        <small>BASOUL · v4.0.0-rc.1</small>
      </section>
    </main>
  );
}
