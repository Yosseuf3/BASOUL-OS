"use client";

import { Save } from "lucide-react";
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
import { PascalRuntimeViewer, isCadPascalScene } from "@/features/architecture/pascal-runtime-viewer";
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
  const cadSceneReady = isCadPascalScene(scene);

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
      if (record && isCadPascalScene(record.scene)) {
        setScene(record.scene);
        setSceneName(record.name);
        setStatus("saved");
        setStatusMessage(text("تم تحميل آخر مشهد CAD ثلاثي الأبعاد محفوظ.", "Latest saved CAD 3D scene loaded."));
      } else {
        setScene(null);
        setSceneName(selectedProject ? `${selectedProject.name} · Architecture` : "Architecture scene");
        setStatus("idle");
        setStatusMessage(record
          ? text("المشهد المحفوظ قديم وغير مشتق من CAD؛ ارفع DWG/DXF لإعادة بناء المصدر الحقيقي.", "The saved scene is legacy/non-CAD; upload DWG/DXF to rebuild the verified source.")
          : text("لا يوجد مشهد CAD محفوظ. ارفع DWG/DXF لبدء المسار الموحد 2D → 3D.", "No saved CAD scene exists. Upload DWG/DXF to start the unified 2D → 3D flow."));
      }
      setSceneRevision((value) => value + 1);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setScene(null);
      setSceneRevision((value) => value + 1);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "architecture.scene.load_failed");
    });
    return () => { cancelled = true; };
  }, [selectedProjectId, selectedProject, text]);

  function applyEditedScene(next: ArchitectureScene, message: string) {
    if (!isCadPascalScene(next)) return;
    setScene(next);
    setStatus("unsaved");
    setStatusMessage(message);
  }

  function applyDirectManipulation(next: ArchitectureScene) {
    applyEditedScene(next, text("تم تحريك العنصر مباشرة داخل المشهد ثلاثي الأبعاد.", "The selected element was moved directly in the 3D scene."));
  }

  function applyCadScene(next: ArchitectureScene, message: string) {
    if (!isCadPascalScene(next)) {
      setStatus("error");
      setStatusMessage(text("رفض المشهد: المصدر ليس CAD/Pascal موثقًا.", "Scene rejected: source is not a verified CAD/Pascal scene."));
      return;
    }
    setScene(next);
    setSelectedElementId("");
    setSceneRevision((value) => value + 1);
    setStatus("unsaved");
    setStatusMessage(message);
  }

  async function saveScene() {
    if (!selectedProjectId || !scene || !cadSceneReady || status === "saving") return;
    setStatus("saving");
    setStatusMessage(text("جارٍ الحفظ…", "Saving…"));
    try {
      const saved = await saveArchitectureScene({ projectId: selectedProjectId, name: sceneName, scene });
      if (!isCadPascalScene(saved.scene)) throw new Error("architecture.scene.invalid_cad_runtime")
      setScene(saved.scene);
      setSceneName(saved.name);
      setSceneRevision((value) => value + 1);
      setStatus("saved");
      setStatusMessage(text("تم حفظ مشهد CAD/Pascal بنجاح.", "CAD/Pascal scene saved successfully."));
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
          <p>{text("مسار واحد من DWG/DXF: قراءة 2D، بناء Floor Graph، ثم إنشاء Pascal 3D من نفس المصدر دون مشاهد بديلة.", "One DWG/DXF pipeline: 2D parsing, Floor Graph construction, then Pascal 3D from the same source with no substitute scenes.")}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">CAD SOURCE · SINGLE</span>
            <span className="bx-chip">FLOOR GRAPH · LIVE</span>
            <span className="bx-chip">2D → 3D · UNIFIED</span>
            <span className="bx-chip">PERSISTENCE · PRODUCTION</span>
          </div>
        </div>
      </section>

      <section className="bx-panel" aria-label={text("حفظ المشهد", "Scene persistence")}>
        <header className="bx-panel-head"><div><span className="bx-kicker">PROJECT SCENE</span><h3>{text("المشروع والحفظ", "Project & persistence")}</h3></div><span className="bx-chip">{statusLabel(status)}</span></header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 8 }}><span className="bx-kicker">{text("المشروع", "PROJECT")}</span><select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={!projects.length || status === "saving"} style={{ minHeight: 44, borderRadius: 12, padding: "0 12px", background: "transparent", color: "inherit" }}>{!projects.length && <option value="">{text("لا توجد مشاريع", "No projects")}</option>}{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label style={{ display: "grid", gap: 8 }}><span className="bx-kicker">{text("اسم المشهد", "SCENE NAME")}</span><input value={sceneName} onChange={(event) => { setSceneName(event.target.value); if (status === "saved") setStatus("unsaved"); }} maxLength={120} disabled={!selectedProjectId || status === "loading" || status === "saving"} style={{ minHeight: 44, borderRadius: 12, padding: "0 12px", background: "transparent", color: "inherit" }} /></label>
          <div className="bx-actions" style={{ margin: 0 }}><button type="button" onClick={() => void saveScene()} disabled={!selectedProjectId || !cadSceneReady || status === "loading" || status === "saving"}><Save size={16} /> {text("حفظ مشهد CAD", "Save CAD scene")}</button></div>
        </div>
        <p aria-live="polite">{statusMessage}</p>
      </section>

      <CadReviewPanel projectId={selectedProjectId} text={text} onSceneReady={applyCadScene} />

      {cadSceneReady && scene && <ArchitectureEditorPanel scene={scene} selectedId={selectedElementId} onSelectionChange={setSelectedElementId} onSceneChange={applyEditedScene} text={text} />}
      {cadSceneReady && scene && <div id="architecture-3d-runtime"><PascalRuntimeViewer scene={scene} sceneKey={`${selectedProjectId}:${sceneRevision}`} selectedId={selectedElementId} onSelectionChange={setSelectedElementId} onSceneChange={applyDirectManipulation} /></div>}

      <section className="bx-panel"><header className="bx-panel-head"><div><span className="bx-kicker">PRODUCTION STATUS</span><h3>{text("حالة قاعدة البيانات", "Database status")}</h3></div><span className="bx-chip">PERSISTENCE · LIVE</span></header><p>{text("لا يتم حفظ أي مشهد بديل؛ الحفظ مخصص فقط لمشهد CAD/Pascal المشتق من الملف المرفوع.", "No substitute scene is persisted; saving is restricted to the CAD/Pascal scene derived from the uploaded file.")}</p><div className="bx-actions"><button type="button" onClick={() => router.push("/")}>{text("العودة إلى لوحة القيادة", "Back to dashboard")}</button></div></section>
    </main>
  );
}

function statusLabel(status: PersistenceStatus) {
  if (status === "loading") return "SCENE · LOADING";
  if (status === "saving") return "SCENE · SAVING";
  if (status === "saved") return "SCENE · SAVED";
  if (status === "unsaved") return "SCENE · CAD READY";
  if (status === "error") return "SCENE · ERROR";
  return "SCENE · EMPTY";
}
