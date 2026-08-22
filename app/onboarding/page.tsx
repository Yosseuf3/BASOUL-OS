"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createOwnedOrganization, resolveOrganizationAccess } from "@/lib/organizations/onboarding";
import { useLanguage } from "@/components/i18n/language-provider";
import "../login/login.css";

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/login"); return; }
      setContactEmail(data.session.user.email ?? "");
      try {
        const access = await resolveOrganizationAccess();
        if (access.kind === "member") { router.replace("/"); return; }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : text("تعذر التحقق من المؤسسة.", "Unable to verify organization access."));
      } finally { setChecking(false); }
    })();
  }, [router, text]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await createOwnedOrganization({ name, legalName, countryCode, region, city, addressLine, phone, contactEmail, taxNumber });
      router.replace("/"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("تعذر إنشاء المؤسسة.", "Unable to create organization."));
    } finally { setBusy(false); }
  }

  if (checking) return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}><section className="basoul-password-card"><p>{text("جارٍ التحقق من مساحة العمل…", "Checking workspace access…")}</p></section></main>;

  return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
    <section className="basoul-password-card" aria-labelledby="organization-onboarding-title">
      <div className="basoul-password-copy">
        <span>BASOUL · ORGANIZATION</span>
        <h1 id="organization-onboarding-title">{text("إنشاء مؤسستك", "Create your organization")}</h1>
        <p>{text("ستصبح المالك الأول للمؤسسة. بيانات مؤسستك وبيانات فريقك ستبقى معزولة عن المؤسسات الأخرى.", "You will become the initial Owner. Your organization and team data remain isolated from every other organization.")}</p>
      </div>
      <form onSubmit={submit} className="basoul-password-form">
        <label><span>{text("اسم المؤسسة", "Organization name")}</span><input required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></label>
        <label><span>{text("الاسم القانوني", "Legal name")}</span><input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></label>
        <label><span>{text("رمز الدولة", "Country code")}</span><input required value={countryCode} onChange={(e) => setCountryCode(e.target.value)} maxLength={2} /></label>
        <label><span>{text("المنطقة", "Region")}</span><input value={region} onChange={(e) => setRegion(e.target.value)} /></label>
        <label><span>{text("المدينة", "City")}</span><input value={city} onChange={(e) => setCity(e.target.value)} /></label>
        <label><span>{text("العنوان", "Address")}</span><input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></label>
        <label><span>{text("الهاتف", "Phone")}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label><span>{text("بريد المؤسسة", "Organization email")}</span><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label>
        <label><span>{text("الرقم الضريبي — اختياري", "Tax number — optional")}</span><input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} /></label>
        <button type="submit" disabled={busy || !name.trim() || countryCode.trim().length !== 2}>{busy ? text("جارٍ إنشاء المؤسسة…", "Creating organization…") : text("إنشاء المؤسسة والمتابعة", "Create organization and continue")}</button>
      </form>
      {error ? <div className="basoul-password-error" role="alert">{error}</div> : null}
    </section>
  </main>;
}
