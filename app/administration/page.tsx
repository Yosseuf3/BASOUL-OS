"use client";

import type { Session } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AdministrationView } from "@/features/administration/administration-view";
import { Button, LoadingState, Panel } from "@/components/ui/yvl-primitives";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/i18n/language-provider";

export default function AdministrationPage() {
  const [session, setSession] = useState<Session | null>(null);
  const { text } = useLanguage();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return <main className="main"><Panel><LoadingState title={text("جارٍ تحميل إدارة المؤسسة", "Loading organization administration")} /></Panel></main>;
  }

  return <main className="main">
    <header className="topbar">
      <div>
        <span className="eyebrow">BASOUL · ADMINISTRATION</span>
        <h1>{text("إدارة المؤسسة", "Organization Administration")}</h1>
        <p>{text("إدارة الأعضاء ومستويات الصلاحية والدعوات وفق دورك المعتمد.", "Manage members, permission levels and invitations according to your assigned role.")}</p>
      </div>
      <div className="topbar-actions">
        <Button type="button" className="ghost" onClick={() => window.location.assign("/")}><ArrowRight size={17}/> {text("العودة إلى BASOUL", "Back to BASOUL")}</Button>
      </div>
    </header>
    <AdministrationView session={session} />
  </main>;
}
