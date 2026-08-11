"use client";

import type { Session } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AdministrationView } from "@/features/administration/administration-view";
import { Button, EmptyState, LoadingState, Panel } from "@/components/ui/yvl-primitives";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/i18n/language-provider";
import { loadAdministration } from "@/lib/organizations/administration";
import { hasOrganizationPermission, type OrganizationRole } from "@/lib/organizations/rbac";

export default function AdministrationPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [canAdminister, setCanAdminister] = useState(false);
  const { text } = useLanguage();

  useEffect(() => {
    let active = true;

    const evaluateAccess = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setAccessLoading(true);
      if (!nextSession) {
        setCanAdminister(false);
        setAccessLoading(false);
        return;
      }
      try {
        const administration = await loadAdministration(nextSession);
        const allowed = Boolean(
          administration && hasOrganizationPermission(administration.current.role as OrganizationRole, "membership.manage"),
        );
        if (active) setCanAdminister(allowed);
      } catch {
        if (active) setCanAdminister(false);
      } finally {
        if (active) setAccessLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => { void evaluateAccess(data.session); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { void evaluateAccess(nextSession); });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (accessLoading) {
    return <main className="main"><Panel><LoadingState title={text("جارٍ التحقق من صلاحية الإدارة", "Checking administration access")} /></Panel></main>;
  }

  if (!session) {
    return <main className="main"><Panel><EmptyState title={text("يلزم تسجيل الدخول", "Sign in required")} detail={text("سجّل الدخول للوصول إلى BASOUL.", "Sign in to access BASOUL.")} /></Panel></main>;
  }

  if (!canAdminister) {
    return <main className="main">
      <header className="topbar">
        <div>
          <span className="eyebrow">BASOUL · ADMINISTRATION</span>
          <h1>{text("إدارة المؤسسة", "Organization Administration")}</h1>
        </div>
        <div className="topbar-actions">
          <Button type="button" className="ghost" onClick={() => window.location.assign("/")}><ArrowRight size={17}/> {text("العودة إلى BASOUL", "Back to BASOUL")}</Button>
        </div>
      </header>
      <Panel><EmptyState title={text("لا تملك صلاحية الإدارة", "Administration access unavailable")} detail={text("تتطلب إدارة المؤسسة دور المالك أو المسؤول. تظل صلاحياتك التشغيلية الأخرى كما هي.", "Organization administration requires an Owner or Admin role. Your other operational permissions remain unchanged.")} /></Panel>
    </main>;
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
