"use client";

import { AlertTriangle, CheckCircle2, CloudUpload, FileSearch, FileUp, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createArchitecturalReview, type ArchitecturalReviewReport, type DrawingAsset, type FindingDraft } from "@yosseuf/architectural-intelligence";
import type { Project } from "@/lib/types";
import { deleteProjectDrawing, listProjectDrawings, uploadProjectDrawing, type CloudDrawing } from "@/lib/architecture/drawing-service";

type Props = { projects: Project[] };
type AnalysisState = "idle" | "reading" | "ready" | "error";
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function inspectDrawing(file: File, projectId: string): Promise<{ report: ArchitecturalReviewReport; pages: number | null }> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const format = extension === "pdf" ? "pdf" : "image";
  const drawing: DrawingAsset = { id: `drawing-${crypto.randomUUID()}`, projectId, name: file.name, format, revision: "A", storagePath: `local-preflight/${file.name}`, uploadedAt: new Date().toISOString() };
  let pages: number | null = null;
  if (format === "pdf") {
    const text = new TextDecoder("latin1").decode(await file.arrayBuffer());
    pages = Math.max(1, (text.match(/\/Type\s*\/Page\b/g) ?? []).length);
  }
  const evidence = [{ id: `${drawing.id}-file`, sourceType: "user_input" as const, title: "ملف المخطط المرفوع", reference: `${file.name} · ${formatBytes(file.size)}`, weight: 1, verified: true }];
  const drafts: FindingDraft[] = [];
  if (file.size > 25 * 1024 * 1024) drafts.push({ code: "FILE_SIZE", title: "حجم الملف يحتاج تحسينًا", description: "يتجاوز الملف 25 MB، وقد يبطئ المعالجة والمشاركة.", recommendation: "صدّر نسخة PDF محسّنة مع الحفاظ على وضوح الأبعاد والنصوص.", category: "constructability", severity: "opportunity", location: {}, evidence });
  if (format === "image") drafts.push({ code: "RASTER_INPUT", title: "مصدر نقطي محدود الدقة", description: "الصورة مناسبة للفحص الأولي، لكن النصوص والأبعاد قد لا تكون قابلة للاستخراج بدقة.", recommendation: "ارفع ملف PDF متجهيًا عند توفره للحصول على قراءة هندسية أفضل.", category: "constructability", severity: "warning", location: {}, evidence });
  drafts.push({ code: "READY_FOR_REVIEW", title: "المخطط جاهز لمسار المراجعة", description: `تم التحقق من الملف${pages ? ` واكتشاف ${pages} صفحة` : ""}.`, recommendation: "أضف مقياس الرسم ونوع المشروع والمرجع النظامي قبل بدء التحليل الهندسي المتقدم.", category: "space_efficiency", severity: "info", location: {}, evidence });
  return { report: createArchitecturalReview(drawing, drafts), pages };
}

export function ArchitectureReviewView({ projects }: Props) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [state, setState] = useState<AnalysisState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ArchitecturalReviewReport | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState("A");
  const [drawings, setDrawings] = useState<CloudDrawing[]>([]);
  const [cloudState, setCloudState] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [cloudMessage, setCloudMessage] = useState("");
  const loadDrawings = useCallback(async () => {
    setCloudState("loading");
    try { setDrawings(await listProjectDrawings(projectId || undefined)); setCloudState("idle"); setCloudMessage(""); }
    catch (loadError) { setCloudState("error"); setCloudMessage(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل المخططات."); }
  }, [projectId]);
  useEffect(() => { void loadDrawings(); }, [loadDrawings]);
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError(""); setReport(null); setFile(selected);
    if (!projectId) { setState("error"); setError("أنشئ مشروعًا أو اختر مشروعًا قبل رفع المخطط."); return; }
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(selected.type)) { setState("error"); setError("الصيغ المدعومة حاليًا: PDF وPNG وJPG وWebP."); return; }
    setState("reading");
    try { const result = await inspectDrawing(selected, projectId); setReport(result.report); setPages(result.pages); setState("ready"); }
    catch { setState("error"); setError("تعذر فحص الملف. جرّب تصديره مرة أخرى أو ارفع نسخة PDF أخرى."); }
  };
  const saveToCloud = async () => {
    if (!file || !projectId || !report) return;
    setCloudState("saving"); setCloudMessage("");
    try {
      await uploadProjectDrawing({ projectId, file, revision, pageCount: pages });
      setCloudMessage("تم حفظ المخطط وإضافته إلى سجل الإصدارات.");
      await loadDrawings();
    } catch (uploadError) {
      setCloudState("error");
      setCloudMessage(uploadError instanceof Error ? uploadError.message : "تعذر حفظ المخطط.");
    }
  };
  const removeDrawing = async (drawing: CloudDrawing) => {
    setCloudState("saving"); setCloudMessage("");
    try { await deleteProjectDrawing(drawing); await loadDrawings(); }
    catch (deleteError) { setCloudState("error"); setCloudMessage(deleteError instanceof Error ? deleteError.message : "تعذر حذف المخطط."); }
  };
  return <div className="architecture-review">
    <section className="panel architecture-intro"><div><span className="section-kicker"><Sparkles size={14}/> YOSSEUF Architectural Intelligence</span><h2>المراجعة المعمارية الأولية</h2><p>اربط المخطط بالمشروع، افحص جاهزيته، وابدأ سجل مراجعة قابلًا للتفسير.</p></div><span className="alpha-badge">ALPHA · PREFLIGHT</span></section>
    <section className="architecture-grid">
      <article className="panel drawing-upload-card"><div className="panel-head"><div><span className="section-kicker">01 · الإدراك</span><h2>رفع المخطط</h2></div><FileUp size={22}/></div>
        <label className="field"><span>المشروع</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">اختر مشروعًا</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <label className={`drawing-dropzone ${state === "reading" ? "reading" : ""}`}><input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(event) => void onFile(event)} /><FileSearch size={34}/><strong>{state === "reading" ? "جارٍ فحص المخطط…" : "اختر PDF أو صورة مخطط"}</strong><span>فحص محلي أولي، دون رفع الملف إلى السحابة في هذه المرحلة.</span></label>
        {file && <div className="drawing-file-meta"><b>{file.name}</b><span>{formatBytes(file.size)}{pages ? ` · ${pages} صفحة` : ""}</span></div>}
        {report && <div className="cloud-save-row"><label className="field"><span>رقم الإصدار</span><input value={revision} onChange={(event) => setRevision(event.target.value)} maxLength={12}/></label><button className="primary" disabled={cloudState === "saving"} onClick={() => void saveToCloud()}><CloudUpload size={16}/>{cloudState === "saving" ? "جارٍ الحفظ…" : "حفظ في السحابة"}</button></div>}
        {error && <div className="architecture-error"><AlertTriangle size={16}/>{error}</div>}{cloudMessage && <div className={cloudState === "error" ? "architecture-error" : "architecture-success"}>{cloudState === "error" ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>} {cloudMessage}</div>}
      </article>
      <article className="panel review-result-card"><div className="panel-head"><div><span className="section-kicker">02 · الفهم</span><h2>نتيجة الفحص</h2></div><ShieldCheck size={22}/></div>
        {!report ? <div className="architecture-empty"><FileSearch size={30}/><h3>لم يبدأ الفحص بعد</h3><p>اختر مشروعًا ثم ارفع مخططًا لعرض جاهزية الملف وملاحظات ما قبل المراجعة.</p></div> : <><div className="plan-health"><div><small>جاهزية المخطط</small><strong>{report.planHealth}%</strong></div><span>{report.findings.length} نتائج قابلة للتفسير</span></div><div className="finding-list">{report.findings.map((finding) => <article key={finding.id} className={`finding finding-${finding.severity}`}><span>{finding.severity === "warning" ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}</span><div><b>{finding.title}</b><p>{finding.description}</p><small>{finding.recommendation}</small></div><em>{finding.confidence.score}% ثقة</em></article>)}</div><p className="review-disclaimer">{report.disclaimer}</p></>}
      </article>
    </section>
    <section className="panel drawing-history"><div className="panel-head"><div><span className="section-kicker">03 · الذاكرة</span><h2>سجل المخططات والإصدارات</h2></div><span>{drawings.length} ملفات</span></div>
      {cloudState === "loading" ? <div className="architecture-empty compact"><FileSearch size={24}/><p>جارٍ تحميل السجل…</p></div> : drawings.length ? <div className="drawing-history-list">{drawings.map((drawing) => <article key={drawing.id}><FileSearch size={18}/><div><b>{drawing.name}</b><small>الإصدار {drawing.revision} · {formatBytes(drawing.file_size)} · {drawing.page_count ? `${drawing.page_count} صفحة` : drawing.format.toUpperCase()}</small></div><time>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(drawing.created_at))}</time><button aria-label="حذف المخطط" onClick={() => void removeDrawing(drawing)}><Trash2 size={15}/></button></article>)}</div> : <div className="architecture-empty compact"><FileSearch size={24}/><p>لا توجد مخططات محفوظة لهذا المشروع بعد.</p></div>}
    </section>
  </div>;
}
