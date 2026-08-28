"use client";

import { Box, BrainCircuit, FileBox, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import { ArchitectureEditorPanel } from "@/features/architecture/architecture-editor-panel";
import { CadReviewPanel } from "@/features/architecture/cad-review-panel";
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
  const [selectedElementId, setSelectedElementId] = useState("");
  const [scene, setScene] = useState<ArchitectureScene | null>(null);
  const [sceneName, setSceneName] = useState("Architecture scene");
  const [status, setStatus] = useState<PersistenceStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [sceneRevision, setSceneRevision] = useState(0);

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) ?? null, [projects, selectedProjectId]);

  useEffect(() => {
    let cancelled = false;
    void loadArchitectureProjects().then((rows) => {
      if (cancelled) return;
      setProjects(rows);
      setSelectedProjectId((current) => current || rows[0]?.id || "");
      if (!rows.length) setStatusMessage(text("لا توجد مشاريع متاحة لهذه المؤسسة.", "No projects are available for this organization."));
    }).catch((error: unknown) => {
      if (cancelled) return;
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "architecture.projects.load_failed");
    });
    return () => { cancelled = true; };
  }, [text]);

  useEffect(() => {
    if (!selectedProjectId) {
      setScene(null);
      setSelectedElementId("");
      return;
    }
    let cancelled = false;
    setSelectedElementId("");
    setStatus("loading");
    setStatusMessage(text("جارٍ تحميل المشهد…", "Loading scene…"));
    void loadArchitectureScene(selectedProjectId).then((record) => {
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
        setStatusMessage(text("لا يوجد مشهد محفوظ بعد. تم تجهيز مشهد بداية محلي.", "No saved scene exists yet. A local starter scene is ready."));
      }
      setSceneRevision((value) => value + 1);
    }).catch((error: unknown) => {
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
    setSelectedElementId("");
    setSceneRevision((value) => value + 1);
    setStatus("unsaved");
    setStatusMessage(text("تم إنشاء نسخة بداية محلية. اضغط حفظ لتخزينها للمشروع.", "A local starter scene was created. Save it to persist it for this project."));
  }

  function applyEditedScene(next: ArchitectureScene, message: string) {
    setScene(next);
    setStatus("unsaved");
    setStatusMessage(message);
  }

  function applyDirectManipulation(next: ArchitectureScene) {
    applyEditedScene(next, text("تم تحريك العنصر مباشرة داخل المشهد ثلاثي الأبعاد.", "The selected element was moved directly in the 3D scene."));
  }

  function applyCadScene(next: ArchitectureScene, message: string) {
    setScene(next);
    setSelectedElementId("");
    setSceneRevision((value) => value + 1);
    setStatus("unsaved");
    setStatusMessage(message);
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
          <p>{text("DWG/DXF أصبح المصدر الهندسي عالي الدقة: مراجعة 2D أولًا، ثم فتح Pascal فقط بعد نجاح CAD Geometry Gate.", "DWG/DXF is now the high-fidelity geometry source: review in 2D first, then open Pascal only after the CAD Geometry Gate passes.")}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">ENGINE BOUNDARY · READY</span>
            <span className="bx-chip">IFC GATEWAY · READY</span>
            <span className="bx-chip">AI TOOLS · GUARDED</span>
            <span className="bx-chip">CAD INGESTION · READY</span>
            <span className="bx-chip">FLOOR GRAPH · LIVE</span>
            <span className="bx-chip">2D REVIEW · LIVE</span>
            <span className="bx-chip">3D RUNTIME · LIVE</span>
            <span className="bx-chip">3D SAFETY GATE · ACTIVE</span>
            <span className="bx-chip">PERSISTENCE · PRODUCTION</span>
          </div>
        </div>
      </section>

      <section className="bx-panel" aria-label={text("حفظ المشهد", "Scene persistence")}>
        <header className="bx-panel-head"><div><span className="bx-kicker">PROJECT SCENE</span><h3>{text("المشروع والحفظ", "Project & persistence")}</h3></div><span className="bx-chip">{statusLabel(status)}</span></header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 8 }}><span className="bx-kicker">{text("المشروع", "PROJECT")}</span><select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={!projects.length || status === "saving"} style={{ minHeight: 44, borderRadius: 12, padding: "0 12px", background: "transparent", color: "inherit" }}>{!projects.length && <option value="">{text("لا توجد مشاريع", "No projects")}</option>}{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label style={{ display: "grid", gap: 8 }}><span className="bx-kicker">{text("اسم المشهد", "SCENE NAME")}</span><input value={sceneName} onChange={(event) => { setSceneName(event.target.value); if (status === "saved") setStatus("unsaved"); }} maxLength={120} disabled={!selectedProjectId || status === "loading" || status === "saving"} style={{ minHeight: 44, borderRadius: 12, padding: "0 12px", background: "transparent", color: "inherit" }} /></label>
          <div className="bx-actions" style={{ margin: 0 }}><button type="button" onClick={resetStarterScene} disabled={!selectedProjectId || status === "loading" || status === "saving"}>{text("مشهد بداية جديد", "New starter scene")}</button><button type="button" onClick={() => void saveScene()} disabled={!selectedProjectId || !scene || status === "loading" || status === "saving"}><Save size={16} /> {text("حفظ المشهد", "Save scene")}</button></div>
        </div>
        <p aria-live="polite">{statusMessage}</p>
      </section>

      <CadReviewPanel projectId={selectedProjectId} text={text} onSceneReady={applyCadScene} />

      {scene && <ArchitectureEditorPanel scene={scene} selectedId={selectedElementId} onSelectionChange={setSelectedElementId} onSceneChange={applyEditedScene} text={text} />}
      {scene && <PascalRuntimeViewer scene={scene} sceneKey={`${selectedProjectId}:${sceneRevision}`} selectedId={selectedElementId} onSelectionChange={setSelectedElementId} onSceneChange={applyDirectManipulation} />}

      <section className="bx-grid-2" aria-label={text("حالة المنظومة الهندسية", "Architecture system status")}>
        <StatusCard icon={<Box size={20} />} kicker="CAD" title={text("هندسة أصلية من DWG/DXF", "Native DWG/DXF geometry")} detail={text("يتم بناء Floor Graph من إحداثيات CAD الأصلية وليس من تخمين بصري.", "The Floor Graph is built from native CAD coordinates rather than visual guessing.")} />
        <StatusCard icon={<ShieldCheck size={20} />} kicker="GATE" title={text("بوابة أمان قبل 3D", "3D safety gate")} detail={text("Pascal لا يستقبل مشهد CAD إلا بعد نجاح topology وhost ratio والفراغات المغلقة.", "Pascal receives no CAD scene until topology, host ratio and bounded-space checks pass.")} />
        <StatusCard icon={<FileBox size={20} />} kicker="IFC" title={text("بوابة IFC محفوظة", "IFC gateway retained")} detail={text("مسار IFC يبقى مستقلًا بجانب CAD وPDF fallback.", "The IFC path remains independent alongside CAD and the PDF fallback.")} />
        <StatusCard icon={<BrainCircuit size={20} />} kicker="AI" title={text("AI للدلالة لا للهندسة", "AI for semantics, not geometry")} detail={text("يستخدم AI لاحقًا فقط لفك الغموض الدلالي وأسماء الطبقات والعناصر.", "AI is reserved for semantic ambiguity and layer/entity interpretation.")} />
      </section>

      <section className="bx-panel"><header className="bx-panel-head"><div><span className="bx-kicker">PRODUCTION STATUS</span><h3>{text("حالة قاعدة البيانات", "Database status")}</h3></div><span className="bx-chip">PERSISTENCE · LIVE</span></header><p>{text("يبقى كل مشهد CAD محليًا حتى الضغط على حفظ المشهد؛ الحفظ الحالي يستمر عبر architecture_scenes على Production مع Forced RLS وعزل المؤسسة والمشروع.", "Every CAD scene remains local until Save scene is pressed; persistence continues through Production architecture_scenes with Forced RLS and organization/project isolation.")}</p><div className="bx-actions"><button type="button" onClick={() => router.push("/")}>{text("العودة إلى لوحة القيادة", "Back to dashboard")}</button></div></section>
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
