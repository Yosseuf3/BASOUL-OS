"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { resolveUserIdentity } from "@/lib/auth/user-identity";
import { supabase } from "@/lib/supabase";
import "../../login/login.css";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        router.replace("/login");
        return;
      }
      const identity = resolveUserIdentity(data.session.user);
      setFullName(typeof data.session.user.user_metadata?.full_name === "string" ? data.session.user.user_metadata.full_name.trim() : identity.displayName);
      setEmail(identity.email);
      setLoading(false);
    })();
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = fullName.trim();
    if (!normalizedName || busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ data: { full_name: normalizedName } });
      if (updateError) throw updateError;
      setFullName(normalizedName);
      setMessage(text("تم حفظ اسمك بنجاح.", "Your name was saved successfully."));
    } catch {
      setError(text("تعذر حفظ بيانات الملف الشخصي. حاول مرة أخرى.", "Unable to save your profile. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}><section className="basoul-password-card"><p>{text("جارٍ تحميل ملفك الشخصي…", "Loading your profile…")}</p></section></main>;

  return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
    <section className="basoul-password-card" aria-labelledby="profile-settings-title">
      <div className="basoul-password-copy">
        <span>BASOUL · PERSONAL PROFILE</span>
        <h1 id="profile-settings-title">{text("الملف الشخصي", "Personal profile")}</h1>
        <p>{text("هذه بيانات هويتك الشخصية داخل BASOUL، وهي مستقلة عن بيانات المؤسسة وعضويتك فيها.", "This is your personal BASOUL identity. It is independent from organization data and memberships.")}</p>
      </div>
      <form onSubmit={submit} className="basoul-password-form">
        <label><span>{text("الاسم الكامل", "Full name")}</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required maxLength={120} /></label>
        <label><span>{text("البريد الإلكتروني", "Email")}</span><input type="email" value={email} readOnly /></label>
        <button type="submit" disabled={busy || !fullName.trim()}>{busy ? text("جارٍ الحفظ…", "Saving…") : text("حفظ الملف الشخصي", "Save profile")}</button>
        <button type="button" className="basoul-secondary-button" onClick={() => router.replace("/")}>{text("العودة إلى BASOUL", "Back to BASOUL")}</button>
      </form>
      {message ? <div className="basoul-password-success" role="status">{message}</div> : null}
      {error ? <div className="basoul-password-error" role="alert">{error}</div> : null}
    </section>
  </main>;
}
