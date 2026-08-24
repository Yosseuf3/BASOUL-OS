"use client";

import { Box, BrainCircuit, FileBox, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { PascalRuntimeViewer } from "@/features/architecture/pascal-runtime-viewer";
import "@/features/dashboard/dashboard-visual-truth.css";

export default function ArchitectureWorkspacePage() {
  const router = useRouter();
  const { locale, text } = useLanguage();

  return (
    <main className="basoul-executive" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="bx-hero">
        <div>
          <span className="bx-kicker">BASOUL · ARCHITECTURE</span>
          <h2>{text("مساحة العمل الهندسية", "Architecture workspace")}</h2>
          <p>{text(
            "محرك العرض ثلاثي الأبعاد يعمل الآن خلف طبقة BASOUL الهندسية، مع بقاء التخزين وIFC وأدوات AI تحت بوابات BASOUL.",
            "The live 3D runtime now runs behind the BASOUL architecture boundary while persistence, IFC and AI remain governed by BASOUL gates.",
          )}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">3D RUNTIME · LIVE</span>
            <span className="bx-chip">IFC GATEWAY · READY</span>
            <span className="bx-chip">AI TOOLS · GUARDED</span>
          </div>
        </div>
      </section>

      <PascalRuntimeViewer />

      <section className="bx-grid-2" aria-label={text("حالة المنظومة الهندسية", "Architecture system status")}>
        <StatusCard icon={<Box size={20} />} kicker="ENGINE" title={text("محرك قابل للاستبدال", "Replaceable engine")} detail={text("Pascal Core/Viewer مثبتان بإصدار محدد ويبقيان خلف BASOUL Adapter.", "Pascal Core/Viewer are pinned and remain behind the BASOUL adapter.")} />
        <StatusCard icon={<ShieldCheck size={20} />} kicker="TENANCY" title={text("عزل المؤسسة والمشروع", "Organization & project isolation")} detail={text("التخزين مصمم بنطاق المؤسسة والمشروع مع RLS إجباري قبل تفعيل قاعدة البيانات.", "Persistence is organization/project scoped with forced RLS before database activation.")} />
        <StatusCard icon={<FileBox size={20} />} kicker="IFC" title={text("بوابة استيراد محكومة", "Governed IFC import")} detail={text("الاستيراد يمر بفحص الحجم وصحة المشهد وتشخيص العناصر المتخطاة.", "Imports are bounded by file size, scene validation and observable skipped-item diagnostics.")} />
        <StatusCard icon={<BrainCircuit size={20} />} kicker="AI" title={text("أدوات AI محددة الصلاحيات", "Permission-scoped AI tools")} detail={text("أداة النافذة تعمل فقط بعد فحص الصلاحية والهندسة والجدار المستهدف.", "The window tool runs only after permission, geometry and target-wall validation.")} />
      </section>

      <section className="bx-panel">
        <header className="bx-panel-head"><div><span className="bx-kicker">PRODUCTION GATE</span><h3>{text("الخطوة التالية", "Next gate")}</h3></div></header>
        <p>{text("بعد اجتياز اختبارات هذا الـRuntime ستكون الخطوة التالية تفعيل تخزين المشاهد على Supabase بعد مراجعة Migration وRLS. لا يتم تطبيق أي Migration من هذه الصفحة.", "After this runtime passes its quality gates, the next step is activating scene persistence in Supabase after migration/RLS review. This page applies no migration.")}</p>
        <div className="bx-actions"><button type="button" onClick={() => router.push("/")}>{text("العودة إلى لوحة القيادة", "Back to dashboard")}</button></div>
      </section>
    </main>
  );
}

function StatusCard({ icon, kicker, title, detail }: { icon: React.ReactNode; kicker: string; title: string; detail: string }) {
  return <article className="bx-card blue"><div className="bx-icon">{icon}</div><span className="bx-kicker">{kicker}</span><h3>{title}</h3><p>{detail}</p></article>;
}
