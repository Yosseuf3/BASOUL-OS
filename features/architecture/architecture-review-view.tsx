"use client";

import { AlertTriangle, CheckCircle2, CloudUpload, FileSearch, FileUp, ListChecks, PencilRuler, RotateCcw, ShieldCheck, Sparkles, Trash2, XCircle } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createArchitecturalReview, type ArchitecturalReviewReport, type DrawingAsset, type FindingDraft } from "@yosseuf/architectural-intelligence";
import type { Project } from "@/lib/types";
import { deleteProjectDrawing, listProjectDrawings, uploadProjectDrawing, type CloudDrawing } from "@/lib/architecture/drawing-service";
import {
  analyzeProjectDrawing,
  convertFindingToTask,
  listProjectReviews,
  updateFindingDecision,
  type CloudReview,
  type CloudReviewFinding,
  type FindingDecision,
} from "@/lib/architecture/review-service";
import {
  correctPlanElement,
  createPlanElement,
  formatPlanElementLocation,
  getPlanElementLocation,
  listPlanElements,
  updatePlanElementStatus,
  type CloudPlanElement,
  type PlanElementType,
} from "@/lib/architecture/plan-understanding-service";
import { PlanOverlayViewer } from "@/features/architecture/plan-overlay-viewer";

type Props = { projects: Project[] };
type AnalysisState = "idle" | "reading" | "ready" | "error";
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function cloudReviewToReport(review: CloudReview): ArchitecturalReviewReport {
  return {
    id: review.id,
    projectId: review.project_id,
    drawingId: review.drawing_id,
    planHealth: review.plan_health,
    generatedAt: review.generated_at,
    disclaimer: "مراجعة هندسية مساعدة بالذكاء الاصطناعي. تبقى المصادقة النهائية مسؤولية الفريق المرخص والجهة المختصة.",
    findings: review.architectural_review_findings.map((finding) => ({
      id: finding.id,
      drawingId: finding.drawing_id,
      code: finding.code,
      title: finding.title,
      description: finding.description,
      recommendation: finding.recommendation,
      category: finding.category as ArchitecturalReviewReport["findings"][number]["category"],
      severity: finding.severity,
      status: finding.status,
      location: {},
      evidence: finding.evidence.map((item, index) => ({
        id: `${finding.id}-evidence-${index + 1}`,
        sourceType: "model_inference",
        title: item.observation,
        reference: item.value == null ? item.source : `${item.source}: ${String(item.value)}`,
        weight: 1,
        verified: true,
      })),
      confidence: {
        score: finding.confidence_score,
        level: finding.confidence_score >= 90 ? "very_high" : finding.confidence_score >= 75 ? "high" : finding.confidence_score >= 50 ? "medium" : "low",
        evidenceCount: finding.evidence.length,
        verifiedEvidenceCount: finding.evidence.length,
        explanation: "محسوبة من الأدلة التقنية المستخرجة من الملف.",
      },
      createdAt: finding.created_at,
    })),
  };
}

async function inspectDrawing(file: File, projectId: string): Promise<{ report: ArchitecturalReviewReport; pages: number | null }> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const format = extension === "pdf" ? "pdf" : "image";
  const drawing: DrawingAsset = { id: `drawing-${crypto.randomUUID()}`, projectId, name: file.name, format, revision: "A", storagePath: `local-preflight/${file.name}`, uploadedAt: new Date().toISOString() };
  let pages: number | null = null;
  if (format === "pdf") {
    const text = new TextDecoder("latin1").decode(await file.arrayBuffer());
    pages = Math.max(1, (text.match(/\/Type\s*\/Page\b/g) ?? []).length);
  }
  const evidence = [{ id: `${drawing.id}-file`, sourceType: "user_input" as const, title: "بيانات الملف المرفوع", reference: `${file.name} · ${formatBytes(file.size)}`, weight: 1, verified: true }];
  const drafts: FindingDraft[] = [];
  if (file.size > 25 * 1024 * 1024) drafts.push({ code: "FILE_SIZE", title: "حجم الملف مرتفع للمراجعة", description: "يتجاوز الملف 25 MB، وقد يبطئ المعالجة والمشاركة.", recommendation: "صدّر نسخة PDF محسنة مع الحفاظ على وضوح النصوص والأبعاد.", category: "constructability", severity: "opportunity", location: {}, evidence });
  if (format === "image") drafts.push({ code: "RASTER_INPUT", title: "المصدر صورة نقطية", description: "الصورة مناسبة للفحص البصري، لكنها أقل دقة في استخراج النصوص والعناصر الهندسية.", recommendation: "استخدم PDF متجهيًا عندما يكون متاحًا لرفع موثوقية التحليل.", category: "constructability", severity: "warning", location: {}, evidence });
  drafts.push({ code: "READY_FOR_REVIEW", title: "المخطط جاهز لمسار المراجعة", description: `تم التحقق من الملف${pages ? ` واكتشاف ${pages} صفحة` : ""}.`, recommendation: "احفظ النسخة في السحابة لتشغيل التحليل المعماري وإنشاء سجل قرار قابل للتتبع.", category: "space_efficiency", severity: "info", location: {}, evidence });
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
  const [planElements, setPlanElements] = useState<CloudPlanElement[]>([]);
  const [elementFilter, setElementFilter] = useState<PlanElementType | "all">("all");
  const [elementPage, setElementPage] = useState<number | "all">("all");
  const [editingElement, setEditingElement] = useState<CloudPlanElement | null>(null);
  const [elementDrawingId, setElementDrawingId] = useState("");
  const [elementType, setElementType] = useState<PlanElementType>("room");
  const [elementLabel, setElementLabel] = useState("");
  const [elementValue, setElementValue] = useState("");
  const [elementUnit, setElementUnit] = useState("");
  const [elementNotes, setElementNotes] = useState("");
  const [savingElementId, setSavingElementId] = useState("");
  const [overlayPage, setOverlayPage] = useState(1);
  const [convertingFindingId, setConvertingFindingId] = useState("");
  const [decidingFindingId, setDecidingFindingId] = useState("");
  const [retryingDrawingId, setRetryingDrawingId] = useState("");
  const [cloudState, setCloudState] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [cloudMessage, setCloudMessage] = useState("");
  const elementPages = useMemo(() => [...new Set(planElements
    .map((element) => getPlanElementLocation(element).page)
    .filter((page): page is number => page != null))]
    .sort((a, b) => a - b), [planElements]);
  const visiblePlanElements = useMemo(() => planElements.filter((element) => {
    const matchesType = elementFilter === "all" || element.element_type === elementFilter;
    const matchesPage = elementPage === "all" || getPlanElementLocation(element).page === elementPage;
    return matchesType && matchesPage;
  }), [elementFilter, elementPage, planElements]);
  const confirmedElementCount = planElements.filter((element) => element.status === "confirmed" || element.status === "corrected").length;
  const pendingElementCount = planElements.filter((element) => element.status === "detected").length;
  const loadDrawings = useCallback(async () => {
    setCloudState("loading");
    try {
      const [drawingRows, reviewRows, elementRows] = await Promise.all([
        listProjectDrawings(projectId || undefined),
        listProjectReviews(projectId || undefined),
        listPlanElements(projectId || undefined),
      ]);
      setDrawings(drawingRows);
      setReviews(reviewRows);
      setPlanElements(elementRows);
      setElementDrawingId((current) => drawingRows.some((drawing) => drawing.id === current) ? current : drawingRows[0]?.id ?? "");
      setCloudState("idle");
      setCloudMessage("");
    }
    catch (loadError) { setCloudState("error"); setCloudMessage(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل المراجعات."); }
  }, [projectId]);
  useEffect(() => { void loadDrawings(); }, [loadDrawings]);
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError(""); setReport(null); setSavedReview(null); setFile(selected);
    if (!projectId) { setState("error"); setError("اختر المشروع قبل رفع المخطط."); return; }
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(selected.type)) { setState("error"); setError("الصيغ المدعومة: PDF وPNG وJPG وWebP."); return; }
    setState("reading");
    try { const result = await inspectDrawing(selected, projectId); setReport(result.report); setPages(result.pages); setState("ready"); }
    catch { setState("error"); setError("تعذر فحص الملف. جرّب ملفًا صالحًا أو نسخة PDF أخرى."); }
  };
  const saveToCloud = async () => {
    if (!file || !projectId || !report) return;
    setCloudState("saving"); setCloudMessage("");
    try {
      const drawing = await uploadProjectDrawing({ projectId, file, revision, pageCount: pages });
      const result = await analyzeProjectDrawing(drawing.id);
      const { review } = result;
      setSavedReview(review);
      setReport(cloudReviewToReport(review));
      const completionMessage = result.analysisStatus === "completed"
        ? `تم تحليل المخطط واستخراج ${result.planElements.length} عنصرًا للمراجعة.`
        : result.failureCode === "quota_exceeded"
          ? "تم حفظ المخطط. فعّل رصيد OpenAI API ثم استخدم «إعادة التحليل» دون رفع الملف مجددًا."
          : "تم حفظ المخطط وإنشاء جلسة مراجعة، لكن المصدر يحتاج معالجة أوضح.";
      await loadDrawings();
      setCloudMessage(completionMessage);
    } catch (uploadError) {
      setCloudState("error");
      setCloudMessage(uploadError instanceof Error ? uploadError.message : "تعذر رفع المخطط.");
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
      const selectedReview = reviewRows.find((item) => item.id === savedReview?.id) ?? null;
      setReviews(reviewRows);
      setSavedReview(selectedReview);
      if (selectedReview) setReport(cloudReviewToReport(selectedReview));
    } catch (taskError) {
      setCloudState("error");
      setCloudMessage(taskError instanceof Error ? taskError.message : "تعذر إنشاء المهمة.");
    } finally {
      setConvertingFindingId("");
    }
  };
  const retryDrawingAnalysis = async (drawing: CloudDrawing) => {
    setRetryingDrawingId(drawing.id);
    setCloudState("saving");
    setCloudMessage("");
    try {
      const result = await analyzeProjectDrawing(drawing.id, { retry: true });
      setSavedReview(result.review);
      setReport(cloudReviewToReport(result.review));
      setElementDrawingId(drawing.id);
      const completionMessage = result.analysisStatus === "completed"
        ? `اكتمل التحليل واكتُشف ${result.planElements.length} عنصرًا يحتاج تحققًا بشريًا.`
        : result.failureCode === "quota_exceeded"
          ? "لا يزال رصيد OpenAI API غير متاح. لم يُرفع الملف مرة أخرى ويمكن إعادة المحاولة لاحقًا."
          : "اكتملت المحاولة، لكن لم تُكتشف عناصر موثوقة بعد.";
      await loadDrawings();
      setCloudMessage(completionMessage);
    } catch (retryError) {
      setCloudState("error");
      setCloudMessage(retryError instanceof Error ? retryError.message : "تعذرت إعادة تحليل المخطط.");
    } finally {
      setRetryingDrawingId("");
    }
  };
  const decideFinding = async (finding: CloudReviewFinding, status: FindingDecision) => {
    setDecidingFindingId(finding.id);
    setCloudMessage("");
    try {
      await updateFindingDecision(finding, status);
      const reviewRows = await listProjectReviews(projectId);
      const selectedReview = reviewRows.find((item) => item.id === finding.review_id) ?? null;
      setReviews(reviewRows);
      setSavedReview(selectedReview);
      if (selectedReview) setReport(cloudReviewToReport(selectedReview));
      setCloudMessage(status === "accepted" ? "تم اعتماد الملاحظة." : status === "rejected" ? "تم رفض الملاحظة وتوثيق القرار." : "تم إغلاق الملاحظة بعد المعالجة.");
      setCloudState("idle");
    } catch (decisionError) {
      setCloudState("error");
      setCloudMessage(decisionError instanceof Error ? decisionError.message : "تعذر حفظ قرار المراجعة.");
    } finally {
      setDecidingFindingId("");
    }
  };
  const resetElementForm = () => {
    setEditingElement(null);
    setElementType("room");
    setElementLabel("");
    setElementValue("");
    setElementUnit("");
    setElementNotes("");
  };
  const editPlanElement = (element: CloudPlanElement) => {
    setEditingElement(element);
    setElementDrawingId(element.drawing_id);
    setElementType(element.element_type);
    setElementLabel(element.label);
    setElementValue(element.value ?? "");
    setElementUnit(element.unit ?? "");
    setElementNotes(element.notes ?? "");
  };
  const inspectPlanElement = (element: CloudPlanElement) => {
    editPlanElement(element);
    const elementPage = getPlanElementLocation(element).page;
    if (elementPage) {
      setElementPage(elementPage);
      setOverlayPage(elementPage);
    }
    document.getElementById("plan-element-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const savePlanElement = async () => {
    if (!projectId || !elementDrawingId || !elementLabel.trim()) {
      setCloudState("error");
      setCloudMessage("اختر المخطط واكتب اسم العنصر.");
      return;
    }
    setSavingElementId(editingElement?.id ?? "new");
    setCloudMessage("");
    try {
      const input = { projectId, drawingId: elementDrawingId, elementType, label: elementLabel, value: elementValue, unit: elementUnit, notes: elementNotes };
      if (editingElement) await correctPlanElement(editingElement, input);
      else await createPlanElement(input);
      resetElementForm();
      setPlanElements(await listPlanElements(projectId));
      setCloudState("idle");
      setCloudMessage(editingElement ? "تم حفظ التصحيح البشري." : "تمت إضافة عنصر مخطط مؤكد.");
    } catch (elementError) {
      setCloudState("error");
      setCloudMessage(elementError instanceof Error ? elementError.message : "تعذر حفظ عنصر المخطط.");
    } finally {
      setSavingElementId("");
    }
  };
  const decidePlanElement = async (element: CloudPlanElement, status: "confirmed" | "rejected") => {
    setSavingElementId(element.id);
    setCloudMessage("");
    try {
      await updatePlanElementStatus(element.id, status);
      setPlanElements(await listPlanElements(projectId));
      setCloudState("idle");
      setCloudMessage(status === "confirmed" ? "تم تأكيد العنصر." : "تم استبعاد العنصر من فهم المخطط.");
    } catch (elementError) {
      setCloudState("error");
      setCloudMessage(elementError instanceof Error ? elementError.message : "تعذر تحديث العنصر.");
    } finally {
      setSavingElementId("");
    }
  };
  return <div className="architecture-review">
    <section className="panel architecture-intro"><div><span className="section-kicker"><Sparkles size={14}/> YOSSEUF Architectural Intelligence</span><h2>المراجعة المعمارية الذكية</h2><p>حوّل تحليل المخطط إلى قرارات موثقة، ثم إلى مهام قابلة للتنفيذ.</p></div><span className="alpha-badge">ALPHA · DECISION WORKFLOW</span></section>
    <section className="architecture-grid">
      <article className="panel drawing-upload-card"><div className="panel-head"><div><span className="section-kicker">01 · الإدخال</span><h2>رفع المخطط</h2></div><FileUp size={22}/></div>
        <label className="field"><span>المشروع</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">اختر المشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <label className={`drawing-dropzone ${state === "reading" ? "reading" : ""}`}><input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(event) => void onFile(event)} /><FileSearch size={34}/><strong>{state === "reading" ? "جارٍ فحص المخطط" : "اختر PDF أو صورة مخطط"}</strong><span>يُجرى فحص محلي أولي قبل الحفظ والتحليل الآمن في السحابة.</span></label>
        {file && <div className="drawing-file-meta"><b>{file.name}</b><span>{formatBytes(file.size)}{pages ? ` · ${pages} صفحة` : ""}</span></div>}
        {report && <div className="cloud-save-row"><label className="field"><span>رمز الإصدار</span><input value={revision} onChange={(event) => setRevision(event.target.value)} maxLength={12}/></label><button className="primary" disabled={cloudState === "saving"} onClick={() => void saveToCloud()}><CloudUpload size={16}/>{cloudState === "saving" ? "جارٍ التحليل" : "حفظ وتحليل"}</button></div>}
        {error && <div className="architecture-error"><AlertTriangle size={16}/>{error}</div>}{cloudMessage && <div className={cloudState === "error" ? "architecture-error" : "architecture-success"}>{cloudState === "error" ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>} {cloudMessage}</div>}
      </article>
      <article className="panel review-result-card"><div className="panel-head"><div><span className="section-kicker">02 · القرار</span><h2>نتيجة المراجعة</h2></div><ShieldCheck size={22}/></div>
        {!report ? <div className="architecture-empty"><FileSearch size={30}/><h3>لا يوجد تحليل بعد</h3><p>اختر مشروعًا وارفع مخططًا لبدء مراجعة قابلة للتفسير والتتبع.</p></div> : <><div className="plan-health"><div><small>صحة المخطط</small><strong>{report.planHealth}%</strong></div><span>{report.findings.filter((finding) => finding.status === "open" || finding.status === "accepted").length} ملاحظة تحتاج متابعة</span></div><div className="finding-list">{report.findings.map((finding) => {
          const cloudFinding = savedReview?.architectural_review_findings.find((item) => item.id === finding.id || item.code === finding.code);
          return <article key={finding.id} className={`finding finding-${finding.severity} finding-status-${finding.status}`}><span>{finding.severity === "warning" || finding.severity === "critical" ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}</span><div><div className="finding-heading"><b>{finding.title}</b><span className={`finding-status status-${finding.status}`}>{findingStatusLabels[finding.status]}</span></div><p>{finding.description}</p><small>{finding.recommendation}</small>{finding.evidence.length > 0 && <small>الأدلة: {finding.evidence.map((item) => item.reference ?? item.title).join(" · ")}</small>}{cloudFinding && <div className="finding-actions">
            {cloudFinding.status === "open" && <><button disabled={decidingFindingId === cloudFinding.id} onClick={() => void decideFinding(cloudFinding, "accepted")}><CheckCircle2 size={14}/>اعتماد</button><button disabled={decidingFindingId === cloudFinding.id} onClick={() => void decideFinding(cloudFinding, "rejected")}><XCircle size={14}/>رفض</button></>}
            {cloudFinding.status === "accepted" && <><button disabled={decidingFindingId === cloudFinding.id} onClick={() => void decideFinding(cloudFinding, "resolved")}><ShieldCheck size={14}/>تمت المعالجة</button><button className="finding-task-action" disabled={convertingFindingId === cloudFinding.id} onClick={() => void createTask(cloudFinding)}><ListChecks size={14}/>{convertingFindingId === cloudFinding.id ? "جارٍ الإنشاء" : "تحويل إلى مهمة"}</button></>}
            {cloudFinding.status === "converted_to_task" && <span className="finding-done"><ListChecks size={14}/>مرتبطة بمهمة</span>}
          </div>}</div><em>{finding.confidence.score}% ثقة</em></article>;
        })}</div><p className="review-disclaimer">{report.disclaimer}</p></>}
      </article>
    </section>
    <section className="panel plan-understanding"><div className="panel-head"><div><span className="section-kicker">03 · فهم المخطط</span><h2>مفتش عناصر المخطط</h2></div><span>{planElements.filter((element) => element.status !== "rejected").length} عنصر</span></div>
      <p className="plan-understanding-intro">راجع الغرف والأبعاد والجدران والفتحات حسب النوع والصفحة، ثم أكد النتائج أو صححها لبناء ذاكرة هندسية موثوقة.</p>
      <PlanOverlayViewer
        drawing={drawings.find((drawing) => drawing.id === elementDrawingId) ?? null}
        elements={visiblePlanElements}
        page={overlayPage}
        onPageChange={(page) => { setOverlayPage(page); setElementPage(page); }}
        onSelectElement={inspectPlanElement}
      />
      <div className="plan-inspector-summary">
        <span><b>{planElements.length}</b> مكتشف</span>
        <span><b>{pendingElementCount}</b> ينتظر التحقق</span>
        <span><b>{confirmedElementCount}</b> مؤكد بشريًا</span>
        <span><b>{elementPages.length || "—"}</b> صفحات منظمة</span>
      </div>
      <div className="plan-inspector-filters">
        <label className="field"><span>نوع العنصر</span><select value={elementFilter} onChange={(event) => setElementFilter(event.target.value as PlanElementType | "all")}><option value="all">كل الأنواع</option>{Object.entries(planElementTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span>صفحة المخطط</span><select value={elementPage} onChange={(event) => setElementPage(event.target.value === "all" ? "all" : Number(event.target.value))}><option value="all">كل الصفحات</option>{elementPages.map((page) => <option key={page} value={page}>الصفحة {page}</option>)}</select></label>
        <span className="plan-filter-result">يعرض {visiblePlanElements.length} من {planElements.length}</span>
      </div>
      <div className="plan-element-form" id="plan-element-editor">
        <label className="field"><span>المخطط</span><select value={elementDrawingId} onChange={(event) => { setElementDrawingId(event.target.value); setOverlayPage(1); setElementPage("all"); }}><option value="">اختر المخطط</option>{drawings.map((drawing) => <option key={drawing.id} value={drawing.id}>{drawing.name} · {drawing.revision}</option>)}</select></label>
        <label className="field"><span>نوع العنصر</span><select value={elementType} onChange={(event) => setElementType(event.target.value as PlanElementType)}>{Object.entries(planElementTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span>الاسم</span><input value={elementLabel} onChange={(event) => setElementLabel(event.target.value)} placeholder="غرفة المعيشة" maxLength={160}/></label>
        <label className="field"><span>القيمة</span><input value={elementValue} onChange={(event) => setElementValue(event.target.value)} placeholder="4.20 × 5.10"/></label>
        <label className="field"><span>الوحدة</span><input value={elementUnit} onChange={(event) => setElementUnit(event.target.value)} placeholder="م" maxLength={24}/></label>
        <button className="primary plan-element-save" disabled={Boolean(savingElementId)} onClick={() => void savePlanElement()}><PencilRuler size={16}/>{editingElement ? "حفظ التصحيح" : "إضافة عنصر"}</button>
        {editingElement && <button className="plan-element-cancel" onClick={resetElementForm}>إلغاء</button>}
      </div>
      {visiblePlanElements.length ? <div className="plan-element-list">{visiblePlanElements.map((element) => <article key={element.id} className={`plan-element status-${element.status}`}><PencilRuler size={18}/><div><div className="plan-element-heading"><b>{element.label}</b><span>{planElementTypeLabels[element.element_type]}</span></div><small>{[element.value, element.unit].filter(Boolean).join(" " ) || "بلا قيمة رقمية"} · {element.source === "manual" ? "إدخال بشري" : `${element.confidence_score}% ثقة`}</small><small className="plan-element-location">{formatPlanElementLocation(element)}</small><em>{planElementStatusLabels[element.status]}</em></div><div className="plan-element-actions"><button disabled={savingElementId === element.id} onClick={() => inspectPlanElement(element)}>عرض وتصحيح</button>{element.status === "detected" && <button disabled={savingElementId === element.id} onClick={() => void decidePlanElement(element, "confirmed")}>تأكيد</button>}{element.status !== "rejected" && <button disabled={savingElementId === element.id} onClick={() => void decidePlanElement(element, "rejected")}>استبعاد</button>}</div></article>)}</div> : planElements.length ? <div className="architecture-empty compact"><FileSearch size={24}/><p>لا توجد عناصر مطابقة للفلاتر الحالية.</p></div> : <div className="architecture-empty compact"><PencilRuler size={24}/><p>لا توجد عناصر مسجلة. ابدأ بإضافة غرفة أو بُعد مؤكد.</p></div>}
    </section>
    <section className="panel drawing-history"><div className="panel-head"><div><span className="section-kicker">04 · الإصدارات</span><h2>سجل المخططات المحفوظة</h2></div><span>{drawings.length} ملف</span></div>
      {cloudState === "loading" ? <div className="architecture-empty compact"><FileSearch size={24}/><p>جارٍ تحميل السجل</p></div> : drawings.length ? <div className="drawing-history-list">{drawings.map((drawing) => <article key={drawing.id}><FileSearch size={18}/><div><b>{drawing.name}</b><small>الإصدار {drawing.revision} · {formatBytes(drawing.file_size)} · {drawing.page_count ? `${drawing.page_count} صفحة` : drawing.format.toUpperCase()}</small></div><time>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(drawing.created_at))}</time><button aria-label={`إعادة تحليل ${drawing.name}`} disabled={Boolean(retryingDrawingId)} onClick={() => void retryDrawingAnalysis(drawing)}><RotateCcw size={15}/>{retryingDrawingId === drawing.id ? "جارٍ التحليل" : "إعادة التحليل"}</button><button aria-label="حذف المخطط" disabled={Boolean(retryingDrawingId)} onClick={() => void removeDrawing(drawing)}><Trash2 size={15}/></button></article>)}</div> : <div className="architecture-empty compact"><FileSearch size={24}/><p>لا توجد مخططات محفوظة لهذا المشروع.</p></div>}
    </section>
    <section className="panel review-history"><div className="panel-head"><div><span className="section-kicker">05 · القرارات</span><h2>سجل المراجعات</h2></div><span>{reviews.length} جلسة</span></div>
      {reviews.length ? <div className="review-history-list">{reviews.map((item) => <article key={item.id}><div className="review-score"><strong>{item.plan_health}%</strong><small>صحة المخطط</small></div><div><b>مراجعة قابلة للتنفيذ</b><small>{item.architectural_review_findings.filter((finding) => finding.status === "open" || finding.status === "accepted").length} قيد المتابعة · {item.architectural_review_findings.filter((finding) => finding.status === "converted_to_task").length} مهمة منشأة</small></div><span className={`review-status ${item.status}`}>{item.status === "completed" ? "مكتملة" : "جاهزة"}</span><time>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(item.created_at))}</time></article>)}</div> : <div className="architecture-empty compact"><ListChecks size={24}/><p>ارفع مخططًا لإنشاء أول جلسة مراجعة.</p></div>}
    </section>
  </div>;
}

const findingStatusLabels: Record<ArchitecturalReviewReport["findings"][number]["status"], string> = {
  open: "بانتظار القرار",
  accepted: "معتمدة",
  rejected: "مرفوضة",
  resolved: "تمت المعالجة",
  converted_to_task: "تحولت إلى مهمة",
};

const planElementTypeLabels: Record<PlanElementType, string> = {
  wall: "جدار",
  opening: "فتحة",
  room: "غرفة",
  label: "تسمية",
  dimension: "بُعد",
};

const planElementStatusLabels: Record<CloudPlanElement["status"], string> = {
  detected: "بانتظار التحقق",
  confirmed: "مؤكد",
  corrected: "مصحح بشريًا",
  rejected: "مستبعد",
};
