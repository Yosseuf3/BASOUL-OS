"use client";

import { Box, BrainCircuit, FileBox, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  loadArchitectureProjects,
  loadArchitectureScene,
  saveArchitectureScene,
  type ArchitectureProject,
} from "@/features/architecture/architecture-persistence-client";
import { PascalRuntimeViewer, createBasoulStarterScene } from "@/features/architecture/pascal-runtime-viewer";
import type { ArchitectureScene } from "@/packages/architecture-engine/src";
import "@/features/dashboard/dashboard-visual-truth.css";

type PersistenceStatus = "idle" | "loading" | "unsaved" | "saving" | "saved" | "error";

export default function ArchitectureWorkspacePage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [projects, setProjects] = useState<ArchitectureProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [scene, setScene] = useState<ArchitectureScene | null>(null);
  const [sceneName, setSceneName] = useState("Architecture scene");
  const [status, setStatus] = useState<PersistenceStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [sceneRevision, setSceneRevision] = useState(0);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    let cancelled = false;
    void loadArchitectureProjects()
      .then((rows) => {
        if (cancelled) return;
        setProjects(rows);
        setSelectedProjectId((current) => current || rows[0]?.id || "");
        if (!rows.length) {
          setStatus("idle");
          setStatusMessage(text("لا توجد مشاريع متاحة لهذه المؤسسة.", "No projects are available for this organization."));
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "architecture.projects.load_failed");
      });
    return () => { cancelled = true; };
  }, [text]);

  useEffect(() => {
    if (!selectedProjectId) {
      setScene(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setStatusMessage(text("جارٍ تحميل المشهد…", "Loading scene…"));

    void loadArchitectureScene(selectedProjectId)
      .then((record) => {
        if (cancelled) return;
        if (record) {
          setScene(record.scene);
          setSceneName(record.name);
          setStatus("saved");
          setStatusMessage(text("تم تحميل آخر مشهد محفوظ.", "Latest saved scene loaded."));
        } else {
          setScene(createBasoulStarterScene());
          setSceneName(selectedProject ? `${selectedProject.name} · Architecture` : "Architecture scene");
          setStatus("unsaved");
          setStatusMessage(text("لا يوجد مشهد محفوظ بعد. تم تجهيز مشهد بداية محلي دون كتابة أي بيانات.", "No saved scene exists yet. A local starter scene is ready without writing data."));
        }
        setSceneRevision((value) => value + 1);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setScene(createBasoulStarterScene());
        setSceneRevision((value) => value + 1);
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "architecture.scene.load_failed");
      });

    return () => { cancelled = true; };
  }, [selectedProjectId, selectedProject, text]);

  function resetStarterScene() {
    setScene(createBasoulStarterScene());
    setSceneRevision((value) => value + 1);
    setStatus("unsaved");
    setStatusMessage(text("تم إنشاء نسخة بداية محلية. اضغط حفظ لتخزينها للمشروع.", "A local starter scene was created. Save it to persist it for this project."));
  }

  async function saveScene() {
    if (!selectedProjectId || !scene || status === "saving") return;
    setStatus("saving");
    setStatusMessage(text("جارٍ الحفظ…", "Saving…"));
    try {
      const saved = await saveArchitectureScene({ projectId: selectedProjectId, name: sceneName, scene });
      setScene(saved.scene);
      setSceneName(saved.name);
      setSceneRevision((value) => value + 1);
      setStatus("saved");
      setStatusMessage(text("تم حفظ المشهد بنجاح.", "Scene saved successfully."));
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "architecture.scene.save_failed");
    }
  }

  return (
    <main className="basoul-executive" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="bx-hero">
        <div>
          <span className="bx-kicker">BASOUL · ARCHITECTURE</span>
          <h2>{text("مساحة العمل الهندسية", "Architecture workspace")}</h2>
          <p>{text(
            "محرك العرض ثلاثي الأبعاد يعمل خلف طبقة BASOUL الهندسية، وأصبحت واجهة المشروع جاهزة لتحميل وحفظ المشاهد عبر بوابة عزل المؤسسة والمشروع.",
            "The live 3D runtime runs behind the BASOUL architecture boundary, and the workspace is now wired to load and save scenes through the organization/project isolation gate.",
          )}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">ENGINE BOUNDARY · READY</span>
            <span className="bx-chip">3D RUNTIME · LIVE</span>
            <span className="bx-chip">PERSISTENCE UI · WIRED</span>
            <span className="bx-chip">IFC GATEWAY · READY</span>
            <span className="bx-chip">AI TOOLS · GUARDED</span>
          </div>
        </div>
      </section>

      <section className="bx-panel" aria-label={text("حفظ المشهد", "Scene persistence")}>
        <header className="bx-panel-head">
          <div><span className="bx-kicker">PROJECT SCENE</span><h3>{text("المشروع والحفظ", "Project & persistence")}</h3></div>
          <span className="bx-chip">{statusLabel(status)}</span>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="bx-kicker">{text("المشروع", "PROJECT")}</span>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={!projects.length || status === "saving"}
              style={{ minHeight: 44, borderRadius: 12, padding: "0 12px", background: "transparent", color: "inherit" }}
            >
              {!projects.length && <option value="">{text("لا توجد مشاريع", "No projects")}</option>}
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="bx-kicker">{text("اسم المشهد", "SCENE NAME")}</span>
            <input
              value={sceneName}
              onChange={(event) => { setSceneName(event.target.value); if (status === "saved") setStatus("unsaved"); }}
              maxLength={120}
              disabled={!selectedProjectId || status === "loading" || status === "saving"}
              style={{ minHeight: 44, borderRadius: 12, padding: "0 12px", background: "transparent", color: "inherit" }}
            />
          </label>
          <div className="bx-actions" style={{ margin: 0 }}>
            <button type="button" onClick={resetStarterScene} disabled={!selectedProjectId || status === "loading" || status === "saving"}>
              {text("مشهد بداية جديد", "New starter scene")}
            </button>
            <button type="button" onClick={() => void saveScene()} disabled={!selectedProjectId || !scene || status === "loading" || status === "saving"}>
              <Save size={16} /> {text("حفظ المشهد", "Save scene")}
            </button>
          </div>
        </div>
        <p aria-live="polite">{statusMessage}</p>
      </section>

      {scene && <PascalRuntimeViewer scene={scene} sceneKey={`${selectedProjectId}:${sceneRevision}`} />}

      <section className="bx-grid-2" aria-label={text("حالة المنظومة الهندسية", "Architecture system status")}>
        <StatusCard icon={<Box size={20} />} kicker="ENGINE" title={text("محرك قابل للاستبدال", "Replaceable engine")} detail={text("Pascal Core/Viewer مثبتان بإصدار محدد ويبقيان خلف BASOUL Adapter.", "Pascal Core/Viewer are pinned and remain behind the BASOUL adapter.")} />
        <StatusCard icon={<ShieldCheck size={20} />} kicker="TENANCY" title={text("عزل المؤسسة والمشروع", "Organization & project isolation")} detail={text("كل تحميل أو حفظ يمر عبر تحقق المؤسسة والمشروع وهوية المستخدم الموثوقة من الخادم.", "Every load/save passes server-side organization/project validation and trusted user identity.")} />
        <StatusCard icon={<FileBox size={20} />} kicker="IFC" title={text("بوابة استيراد محكومة", "Governed IFC import")} detail={text("الاستيراد يمر بفحص الحجم وصحة المشهد وتشخيص العناصر المتخطاة.", "Imports are bounded by file size, scene validation and observable skipped-item diagnostics.")} />
        <StatusCard icon={<BrainCircuit size={20} />} kicker="AI" title={text("أدوات AI محددة الصلاحيات", "Permission-scoped AI tools")} detail={text("أداة النافذة تعمل فقط بعد فحص الصلاحية والهندسة والجدار المستهدف.", "The window tool runs only after permission, geometry and target-wall validation.")} />
      </section>

      <section className="bx-panel">
        <header className="bx-panel-head"><div><span className="bx-kicker">PRODUCTION GATE</span><h3>{text("بوابة قاعدة البيانات", "Database gate")}</h3></div></header>
        <p>{text("واجهة الحفظ أصبحت مرتبطة بالـAPI، لكن Migration الخاصة بجدول architecture_scenes لا تُطبق من هذه الصفحة ولم يتم تشغيلها على Supabase Production. تفعيل قاعدة البيانات يظل قرارًا مستقلاً بعد المراجعة.", "The persistence UI is now wired to the API, but the architecture_scenes migration is never applied from this page and has not been executed on Supabase Production. Database activation remains a separate reviewed decision.")}</p>
        <div className="bx-actions"><button type="button" onClick={() => router.push("/")}>{text("العودة إلى لوحة القيادة", "Back to dashboard")}</button></div>
      </section>
    </main>
  );
}

function statusLabel(status: PersistenceStatus) {
  if (status === "loading") return "SCENE · LOADING";
  if (status === "saving") return "SCENE · SAVING";
  if (status === "saved") return "SCENE · SAVED";
  if (status === "unsaved") return "SCENE · UNSAVED";
  if (status === "error") return "SCENE · ERROR";
  return "SCENE · IDLE";
}

function StatusCard({ icon, kicker, title, detail }: { icon: React.ReactNode; kicker: string; title: string; detail: string }) {
  return <article className="bx-card blue"><div className="bx-icon">{icon}</div><span className="bx-kicker">{kicker}</span><h3>{title}</h3><p>{detail}</p></article>;
}
