"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Focus, Pencil, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { tokens } from "@yosseuf/ui-tokens";
import type { CloudDrawing } from "@/lib/architecture/drawing-service";
import { createDrawingPreviewUrl } from "@/lib/architecture/drawing-service";
import {
  getPlanElementLocation,
  type CloudPlanElement,
  type PlanElementType,
} from "@/lib/architecture/plan-understanding-service";
import type { CloudReviewFinding } from "@/lib/architecture/review-service";
import type { ReviewComment } from "@/lib/architecture/review-comment-service";

type Props = {
  drawing: CloudDrawing | null;
  elements: CloudPlanElement[];
  page: number;
  onPageChange: (page: number) => void;
  onEditElement: (element: CloudPlanElement) => void;
  onDecideElement: (element: CloudPlanElement, status: "confirmed" | "rejected") => void;
  busyElementId: string;
  findings: CloudReviewFinding[];
  onSelectFinding: (finding: CloudReviewFinding) => void;
  comments: ReviewComment[];
  onSelectComment: (comment: ReviewComment) => void;
  onElementSelected: (element: CloudPlanElement) => void;
};

type Point = { x: number; y: number };

const elementColors: Record<PlanElementType, string> = {
  wall: tokens.color.visualizationWall,
  opening: tokens.color.visualizationOpening,
  room: tokens.color.visualizationRoom,
  label: tokens.color.visualizationLabel,
  dimension: tokens.color.visualizationDimension,
};

function point(value: unknown): Point | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.x === "number" && typeof candidate.y === "number"
    ? { x: candidate.x, y: candidate.y }
    : null;
}

function geometryPoints(element: CloudPlanElement): Point[] {
  const geometry = element.geometry;
  const location = getPlanElementLocation(element);
  const points: Point[] = [];
  if (location.x != null && location.y != null) {
    points.push({ x: location.x, y: location.y });
    if (location.width != null && location.height != null) {
      points.push({ x: location.x + location.width, y: location.y + location.height });
    }
  }
  for (const key of ["start", "end"]) {
    const candidate = point(geometry[key]);
    if (candidate) points.push(candidate);
  }
  const centerline = geometry.centerline;
  if (centerline && typeof centerline === "object") {
    for (const key of ["start", "end"]) {
      const candidate = point((centerline as Record<string, unknown>)[key]);
      if (candidate) points.push(candidate);
    }
  }
  return points;
}

function markerGeometry(element: CloudPlanElement, scale: number) {
  const location = getPlanElementLocation(element);
  if (location.x != null && location.y != null) {
    return {
      kind: "box" as const,
      x: location.x / scale,
      y: location.y / scale,
      width: Math.max((location.width ?? 24) / scale, 1.5),
      height: Math.max((location.height ?? 24) / scale, 1.5),
    };
  }
  const geometry = element.geometry;
  const centerline = geometry.centerline && typeof geometry.centerline === "object"
    ? geometry.centerline as Record<string, unknown>
    : null;
  const start = point(centerline?.start ?? geometry.start);
  const end = point(centerline?.end ?? geometry.end);
  if (start && end) {
    return {
      kind: "line" as const,
      x1: start.x / scale,
      y1: start.y / scale,
      x2: end.x / scale,
      y2: end.y / scale,
    };
  }
  return null;
}

export function PlanOverlayViewer({ drawing, elements, page, onPageChange, onEditElement, onDecideElement, busyElementId, findings, onSelectFinding, comments, onSelectComment, onElementSelected }: Props) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [activeElementId, setActiveElementId] = useState("");
  const pageCount = Math.max(1, drawing?.page_count ?? 1);
  const pageElements = useMemo(
    () => elements.filter((element) => {
      const elementPage = getPlanElementLocation(element).page;
      return element.drawing_id === drawing?.id && (elementPage == null || elementPage === page);
    }),
    [drawing?.id, elements, page],
  );
  const activeElement = pageElements.find((element) => element.id === activeElementId) ?? null;
  const linkedFindings = findings.filter((finding) =>
    finding.drawing_id === drawing?.id &&
    finding.plan_element_id &&
    (finding.page_number == null || finding.page_number === page) &&
    finding.status !== "rejected" &&
    finding.status !== "resolved",
  );
  const pageComments = comments.filter((comment) =>
    comment.drawing_id === drawing?.id &&
    comment.plan_element_id &&
    (comment.page_number == null || comment.page_number === page) &&
    comment.status === "open",
  );
  const selectElement = (element: CloudPlanElement) => {
    setActiveElementId(element.id);
    onElementSelected(element);
  };
  const scale = useMemo(() => {
    if (pageElements.some((element) => getPlanElementLocation(element).coordinateSystem === "normalized_0_1000")) {
      return 10;
    }
    const values = pageElements.flatMap(geometryPoints).flatMap(({ x, y }) => [x, y]);
    const maximum = values.length ? Math.max(...values) : 1000;
    return Math.max(maximum / 96, 10);
  }, [pageElements]);

  useEffect(() => {
    let active = true;
    setPreviewUrl("");
    setPreviewError("");
    if (!drawing) return () => { active = false; };
    void createDrawingPreviewUrl(drawing)
      .then((url) => { if (active) setPreviewUrl(url); })
      .catch((cause) => {
        if (active) setPreviewError(cause instanceof Error ? cause.message : "تعذر فتح معاينة المخطط.");
      });
    return () => { active = false; };
  }, [drawing]);

  if (!drawing) {
    return <div className="plan-overlay-empty"><Focus size={26}/><b>اختر مخططًا لعرضه بصريًا</b><span>ستظهر العناصر المكتشفة فوق الصفحة المرتبطة بها.</span></div>;
  }

  return <div className="plan-overlay-viewer">
    <div className="plan-overlay-toolbar">
      <div>
        <b>{drawing.name}</b>
        <span>الإصدار {drawing.revision} · {pageElements.length} عنصر في الصفحة</span>
      </div>
      <div className="plan-overlay-controls">
        <button aria-label="الصفحة السابقة" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronRight size={16}/></button>
        <span>صفحة {page} من {pageCount}</span>
        <button aria-label="الصفحة التالية" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronLeft size={16}/></button>
        <button aria-pressed={overlayVisible} onClick={() => setOverlayVisible((visible) => !visible)}>
          {overlayVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
          {overlayVisible ? "إخفاء العناصر" : "إظهار العناصر"}
        </button>
      </div>
    </div>
    <div className={`plan-overlay-stage ${drawing.format}`}>
      {previewUrl ? drawing.format === "image"
        // Signed storage URLs must remain untransformed so overlay coordinates
        // stay aligned with the original architectural image.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={previewUrl} alt={`معاينة ${drawing.name}`}/>
        : <object key={`${drawing.id}-${page}`} data={`${previewUrl}#page=${page}&toolbar=0&navpanes=0`} type="application/pdf" aria-label={`معاينة ${drawing.name}`}>
            <a href={previewUrl} target="_blank" rel="noreferrer">فتح ملف PDF</a>
          </object>
        : <div className="plan-overlay-loading">{previewError || "جارٍ تجهيز المعاينة…"}</div>}
      {overlayVisible && <svg className="plan-overlay-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="العناصر المكتشفة">
        {pageElements.map((element) => {
          const marker = markerGeometry(element, scale);
          if (!marker || element.status === "rejected") return null;
          const color = elementColors[element.element_type];
          const active = activeElementId === element.id;
          return <g
            key={element.id}
            className={`plan-overlay-marker ${active ? "active" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={element.label}
            onClick={() => selectElement(element)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                selectElement(element);
                setActiveElementId(element.id);
              }
            }}
          >
            {marker.kind === "box"
              ? <rect x={marker.x} y={marker.y} width={marker.width} height={marker.height} stroke={color}/>
              : <line x1={marker.x1} y1={marker.y1} x2={marker.x2} y2={marker.y2} stroke={color}/>}
            <title>{element.label} · {element.confidence_score}% ثقة</title>
          </g>;
        })}
        {linkedFindings.map((finding) => {
          const element = pageElements.find((candidate) => candidate.id === finding.plan_element_id);
          if (!element) return null;
          const marker = markerGeometry(element, scale);
          if (!marker) return null;
          const x = marker.kind === "box" ? marker.x + marker.width / 2 : (marker.x1 + marker.x2) / 2;
          const y = marker.kind === "box" ? marker.y + marker.height / 2 : (marker.y1 + marker.y2) / 2;
          return <g
            key={`finding-${finding.id}`}
            className={`plan-finding-pin severity-${finding.severity}`}
            role="button"
            tabIndex={0}
            aria-label={finding.title}
            onClick={() => onSelectFinding(finding)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectFinding(finding);
            }}
          >
            <circle cx={x} cy={y} r="2.2"/>
            <text x={x} y={y + .7} textAnchor="middle">!</text>
            <title>{finding.title}</title>
          </g>;
        })}
        {pageComments.map((comment) => {
          const element = pageElements.find((candidate) => candidate.id === comment.plan_element_id);
          if (!element) return null;
          const marker = markerGeometry(element, scale);
          if (!marker) return null;
          const x = marker.kind === "box" ? marker.x + marker.width / 2 : (marker.x1 + marker.x2) / 2;
          const y = marker.kind === "box" ? marker.y + marker.height / 2 : (marker.y1 + marker.y2) / 2;
          return <g
            key={`comment-${comment.id}`}
            className="plan-comment-pin"
            role="button"
            tabIndex={0}
            aria-label={comment.body}
            onClick={() => onSelectComment(comment)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectComment(comment);
            }}
          >
            <circle cx={x + 2.8} cy={y - 2.8} r="1.8"/>
            <text x={x + 2.8} y={y - 2.25} textAnchor="middle">•</text>
            <title>{comment.body}</title>
          </g>;
        })}
      </svg>}
      {activeElement && <aside className="plan-overlay-selection" aria-live="polite">
        <button className="plan-overlay-selection-close" aria-label="إغلاق بطاقة العنصر" onClick={() => setActiveElementId("")}>×</button>
        <span style={{ color: elementColors[activeElement.element_type] }}>{elementTypeLabels[activeElement.element_type]}</span>
        <b>{activeElement.label}</b>
        <small>{[activeElement.value, activeElement.unit].filter(Boolean).join(" ") || "لا توجد قيمة رقمية"} · {activeElement.confidence_score}% ثقة</small>
        <div>
          <button onClick={() => onEditElement(activeElement)}><Pencil size={14}/>تصحيح</button>
          {activeElement.status === "detected" && <button disabled={busyElementId === activeElement.id} onClick={() => onDecideElement(activeElement, "confirmed")}><CheckCircle2 size={14}/>تأكيد</button>}
          <button disabled={busyElementId === activeElement.id} onClick={() => onDecideElement(activeElement, "rejected")}><XCircle size={14}/>استبعاد</button>
        </div>
      </aside>}
    </div>
    <div className="plan-overlay-legend">
      {(Object.keys(elementColors) as PlanElementType[]).map((type) => <span key={type}><i style={{ background: elementColors[type] }}/>{elementTypeLabels[type]}</span>)}
      <span><i className="finding-legend-dot"/>ملاحظة مرتبطة</span>
      <span><i className="comment-legend-dot"/>تعليق مراجعة</span>
      <em>اضغط على العنصر لاتخاذ القرار مباشرة</em>
    </div>
  </div>;
}

const elementTypeLabels: Record<PlanElementType, string> = {
  wall: "جدار",
  opening: "فتحة",
  room: "غرفة",
  label: "تسمية",
  dimension: "بُعد",
};
