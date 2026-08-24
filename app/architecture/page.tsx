"use client";

import { Box, BrainCircuit, FileBox, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
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
            "طبقة BASOUL الهندسية أصبحت مستقلة عن المحرك الخارجي، مع عزل المؤسسة والمشروع وبوابات IFC وأدوات AI المقيدة.",
            "BASOUL now owns the architecture boundary, organization/project isolation, IFC gateway and constrained AI tools independently from the external engine.",
          )}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">ENGINE BOUNDARY · READY</span>
            <span className="bx-chip">IFC GATEWAY · READY</span>
            <span className="bx-chip">AI TOOLS · GUARDED</span>
          </div>
        </div>
      </section>

      <section className="bx-grid-2" aria-label={text("حالة المنظومة الهندسية", "Architecture system status")}>
        <StatusCard icon={<Box size={20} />} kicker="ENGINE" title={text("محرك قابل للاستبدال", "Replaceable engine")} detail={text("Pascal يبقى خلف BASOUL Adapter ولا تتسرب أنواعه إلى نطاق المنتج.", "Pascal stays behind a BASOUL adapter and its types do not leak into the product domain.")} />
        <StatusCard icon={<ShieldCheck size={20} />} kicker="TENANCY" title={text("عزل المؤسسة والمشروع", "Organization & project isolation")} detail={text("التخزين مصمم بنطاق المؤسسة والمشروع مع RLS إجباري قبل تفعيل قاعدة البيانات.", "Persistence is organization/project scoped with forced RLS before database activation.")} />
        <StatusCard icon={<FileBox size={20} />} kicker="IFC" title={text("بوابة استيراد محكومة", "Governed IFC import")} detail={text("الاستيراد يمر بفحص الحجم وصحة المشهد وتشخيص العناصر المتخطاة.", "Imports are bounded by file size, scene validation and observable skipped-item diagnostics.")} />
        <StatusCard icon={<BrainCircuit size={20} />} kicker="AI" title={text("أدوات AI محددة الصلاحيات", "Permission-scoped AI tools")} detail={text("أول أداة هندسية تضيف نافذة فقط بعد فحص الصلاحية والهندسة والجدار المستهدف.", "The first architecture tool can add a window only after permission, geometry and target-wall validation.")} />
      </section>

      <section className="bx-panel">
        <header className="bx-panel-head">
          <div>
            <span className="bx-kicker">NEXT RUNTIME GATE</span>
            <h3>{text("ربط العرض ثلاثي الأبعاد", "3D runtime wiring")}</h3>
          </div>
        </header>
        <p>{text(
          "واجهة المنتج جاهزة لاستقبال Pascal Core/Viewer عبر الـAdapter. لن يتم تفعيل التخزين الفعلي أو ترحيل Supabase من هذه الصفحة.",
          "The product surface is ready for Pascal Core/Viewer through the adapter. This page does not activate persistence or apply any Supabase migration.",
        )}</p>
        <div className="bx-actions">
          <button type="button" onClick={() => router.push("/")}>{text("العودة إلى لوحة القيادة", "Back to dashboard")}</button>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ icon, kicker, title, detail }: { icon: React.ReactNode; kicker: string; title: string; detail: string }) {
  return (
    <article className="bx-card blue">
      <div className="bx-icon">{icon}</div>
      <span className="bx-kicker">{kicker}</span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </article>
  );
}
