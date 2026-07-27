"use client";

import { AlertTriangle, CheckCircle2, CloudUpload, FileSearch, FileUp, ListChecks, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createArchitecturalReview, type ArchitecturalReviewReport, type DrawingAsset, type FindingDraft } from "@yosseuf/architectural-intelligence";
import type { Project } from "@/lib/types";
import { deleteProjectDrawing, listProjectDrawings, uploadProjectDrawing, type CloudDrawing } from "@/lib/architecture/drawing-service";
import { convertFindingToTask, listProjectReviews, saveReviewSession, type CloudReview, type CloudReviewFinding } from "@/lib/architecture/review-service";

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
  const [reviews, setReviews] = useState<CloudReview[]>([]);
  const [savedReview, setSavedReview] = useState<CloudReview | null>(null);
  const [convertingFindingId, setConvertingFindingId] = useState("");
  const [cloudState, setCloudState] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [cloudMessage, setCloudMessage] = useState("");
  const loadDrawings = useCallback(async () => {
    setCloudState("loading");
    try {
      const [drawingRows, reviewRows] = await Promise.all([
        listProjectDrawings(projectId || undefined),
        listProjectReviews(projectId || undefined),
      ]);
      setDrawings(drawingRows);
      setReviews(reviewRows);
      setCloudState("idle");
      setCloudMessage("");
    }
    catch (loadError) { setCloudState("error"); setCloudMessage(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل المخططات."); }
  }, [projectId]);
  useEffect(() => { void loadDrawings(); }, [loadDrawings]);
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError(""); setReport(null); setSavedReview(null); setFile(selected);
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
      const drawing = await uploadProjectDrawing({ projectId, file, revision, pageCount: pages });
      const review = await saveReviewSession(drawing.id, report);
      setSavedReview(review);
      setCloudMessage("تم حفظ المخطط وفتح جلسة مراجعة قابلة للتنفيذ.");
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
  const createTask = async (finding: CloudReviewFinding) => {
    if (!projectId) return;
    setConvertingFindingId(finding.id);
    setCloudMessage("");
    try {
      await convertFindingToTask(finding, projectId);
      setCloudMessage("تم تحويل الملاحظة إلى مهمة مرتبطة بالمشروع.");
      const reviewRows = await listProjectReviews(projectId);
      setReviews(reviewRows);
      setSavedReview(reviewRows.find((item) => item.id === savedReview?.id) ?? null);
    } catch (taskError) {
      setCloudState("error");
      setCloudMessage(taskError instanceof Error ? taskError.message : "تعذر إنشاء المهمة.");
    } finally {
      setConvertingFindingId("");
    }
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
        {!report ? <div className="architecture-empty"><FileSearch size={30}/><h3>لم يبدأ الفحص بعد</h3><p>اختر مشروعًا ثم ارفع مخططًا لعرض جاهزية الملف وملاحظات ما قبل المراجعة.</p></div> : <><div className="plan-health"><div><small>جاهزية المخطط</small><strong>{report.planHealth}%</strong></div><span>{report.findings.length} نتائج قابلة للتفسير</span></div><div className="finding-list">{report.findings.map((finding) => {
          const cloudFinding = savedReview?.architectural_review_findings.find((item) => item.code === finding.code);
          return <article key={finding.id} className={`finding finding-${finding.severity}`}><span>{finding.severity === "warning" ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}</span><div><b>{finding.title}</b><p>{finding.description}</p><small>{finding.recommendation}</small>{cloudFinding && <button className="finding-task-action" disabled={cloudFinding.status === "converted_to_task" || convertingFindingId === cloudFinding.id} onClick={() => void createTask(cloudFinding)}><ListChecks size={14}/>{cloudFinding.status === "converted_to_task" ? "تم إنشاء المهمة" : convertingFindingId === cloudFinding.id ? "جارٍ الإنشاء…" : "تحويل إلى مهمة"}</button>}</div><em>{finding.confidence.score}% ثقة</em></article>;
        })}</div><p className="review-disclaimer">{report.disclaimer}</p></>}
      </article>
    </section>
    <section className="panel drawing-history"><div className="panel-head"><div><span className="section-kicker">03 · الذاكرة</span><h2>سجل المخططات والإصدارات</h2></div><span>{drawings.length} ملفات</span></div>
      {cloudState === "loading" ? <div className="architecture-empty compact"><FileSearch size={24}/><p>جارٍ تحميل السجل…</p></div> : drawings.length ? <div className="drawing-history-list">{drawings.map((drawing) => <article key={drawing.id}><FileSearch size={18}/><div><b>{drawing.name}</b><small>الإصدار {drawing.revision} · {formatBytes(drawing.file_size)} · {drawing.page_count ? `${drawing.page_count} صفحة` : drawing.format.toUpperCase()}</small></div><time>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(drawing.created_at))}</time><button aria-label="حذف المخطط" onClick={() => void removeDrawing(drawing)}><Trash2 size={15}/></button></article>)}</div> : <div className="architecture-empty compact"><FileSearch size={24}/><p>لا توجد مخططات محفوظة لهذا المشروع بعد.</p></div>}
    </section>
    <section className="panel review-history"><div className="panel-head"><div><span className="section-kicker">04 · التنفيذ</span><h2>جلسات المراجعة</h2></div><span>{reviews.length} جلسات</span></div>
      {reviews.length ? <div className="review-history-list">{reviews.map((item) => <article key={item.id}><div className="review-score"><strong>{item.plan_health}%</strong><small>صحة المخطط</small></div><div><b>مراجعة قابلة للتفسير</b><small>{item.architectural_review_findings.length} ملاحظات · {item.architectural_review_findings.filter((finding) => finding.status === "converted_to_task").length} مهام منشأة</small></div><span className={`review-status ${item.status}`}>{item.status === "completed" ? "مكتملة" : "جاهزة"}</span><time>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(item.created_at))}</time></article>)}</div> : <div className="architecture-empty compact"><ListChecks size={24}/><p>احفظ مخططًا بعد فحصه لبدء أول جلسة مراجعة.</p></div>}
    </section>
  </div>;
}
