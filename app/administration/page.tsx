"use client";

import type { Session } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AdministrationView } from "@/features/administration/administration-view";
import { Button, LoadingState, Panel } from "@/components/ui/yvl-primitives";
import { supabase } from "@/lib/supabase";

export default function AdministrationPage() {
  const [session, setSession] = useState<Session | null>(null);

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
    return <main className="main"><Panel><LoadingState title="جارٍ تحميل إدارة المؤسسة" /></Panel></main>;
  }

  return <main className="main">
    <header className="topbar">
      <div>
        <span className="eyebrow">BASOUL · ADMINISTRATION</span>
        <h1>إدارة المؤسسة</h1>
        <p>إدارة الأعضاء ومستويات الصلاحية والدعوات وفق دورك المعتمد.</p>
      </div>
      <div className="topbar-actions">
        <Button type="button" className="ghost" onClick={() => window.location.assign("/")}><ArrowRight size={17}/> العودة إلى BASOUL</Button>
      </div>
    </header>
    <AdministrationView session={session} />
  </main>;
}
