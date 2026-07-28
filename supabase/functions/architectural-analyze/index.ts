import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Evidence = { source: string; observation: string; value?: string | number | boolean | null };
type Finding = {
  code: string;
  title: string;
  description: string;
  recommendation: string;
  category: "space_efficiency" | "constructability";
  severity: "info" | "opportunity" | "warning";
  confidence_score: number;
  evidence: Evidence[];
};
type PlanElementDraft = {
  element_type: "wall" | "room" | "label" | "dimension";
  label: string;
  value: string | null;
  unit: string | null;
  confidence_score: number;
  geometry: Record<string, unknown>;
  notes: string;
};
type VectorSegment = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  orientation: "horizontal" | "vertical";
};

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

function inspectPdf(bytes: Uint8Array) {
  const text = new TextDecoder("latin1").decode(bytes);
  const pages = Math.max(1, count(text, /\/Type\s*\/Page\b/g));
  const fonts = count(text, /\/Type\s*\/Font\b/g);
  const images = count(text, /\/Subtype\s*\/Image\b/g);
  const textBlocks = count(text, /\bBT\b/g);
  const vectorPaths = count(text, /(?:^|\s)[mlcre](?:\s|$)/gm);
  return {
    kind: "pdf" as const,
    validHeader: text.startsWith("%PDF-"),
    pages,
    fonts,
    images,
    textBlocks,
    vectorPaths,
    hasMediaBox: /\/MediaBox\s*\[/.test(text),
    searchableText: textBlocks > 0 || fonts > 0,
    vectorLikely: vectorPaths > 20 || (fonts > 0 && images < Math.max(2, pages)),
  };
}

function extractPdfPlanElements(bytes: Uint8Array): PlanElementDraft[] {
  const text = new TextDecoder("latin1").decode(bytes);
  const candidates = Array.from(text.matchAll(/\(((?:\\.|[^\\()]){2,160})\)\s*(?:Tj|'|")/g))
    .map((match) => match[1]
      .replace(/\\([\\()])/g, "$1")
      .replace(/\\[nrtbf]/g, " ")
      .replace(/\s+/g, " ")
      .trim())
    .filter((value) => value.length >= 2 && value.length <= 80)
    .filter((value) => {
      const printable = Array.from(value).filter((char) => char >= " " && char !== "\u007f").length;
      return printable / value.length >= 0.85;
    });
  const unique = [...new Set(candidates)].slice(0, 60);
  const dimensionPattern = /^(\d+(?:[.,]\d+)?)\s*(mm|cm|m|ft|in)$/i;
  const roomPattern = /\b(room|bedroom|living|kitchen|bath(?:room)?|toilet|wc|hall|corridor|majlis|office|garage|store|laundry|dining)\b/i;

  const textElements = unique.map((label): PlanElementDraft => {
    const dimension = label.match(dimensionPattern);
    if (dimension) {
      return {
        element_type: "dimension",
        label,
        value: dimension[1].replace(",", "."),
        unit: dimension[2].toLowerCase(),
        confidence_score: 82,
        geometry: {},
        notes: "Extracted from a literal PDF text operator; verify scale and location.",
      };
    }
    if (roomPattern.test(label)) {
      return {
        element_type: "room",
        label,
        value: null,
        unit: null,
        confidence_score: 74,
        geometry: {},
        notes: "Classified from an explicit room keyword in the PDF text layer.",
      };
    }
    return {
      element_type: "label",
      label,
      value: null,
      unit: null,
      confidence_score: 58,
      geometry: {},
      notes: "Extracted from the PDF text layer; human confirmation is required.",
    };
  }).slice(0, 40);

  const segments: VectorSegment[] = [];
  const seenSegments = new Set<string>();
  const linePattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+m\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+l\b/g;
  for (const match of text.matchAll(linePattern)) {
    const [x1, y1, x2, y2] = match.slice(1).map(Number);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const axisAligned = Math.min(Math.abs(dx), Math.abs(dy)) <= Math.max(Math.abs(dx), Math.abs(dy)) * 0.08;
    if (!axisAligned || length < 20 || length > 2000) continue;
    const points = [[x1, y1], [x2, y2]]
      .map(([x, y]) => [Number(x.toFixed(2)), Number(y.toFixed(2))])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const key = points.flat().join(":");
    if (seenSegments.has(key)) continue;
    seenSegments.add(key);
    segments.push({
      start: { x: points[0][0], y: points[0][1] },
      end: { x: points[1][0], y: points[1][1] },
      length,
      orientation: Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical",
    });
    if (segments.length >= 100) break;
  }

  const pairCandidates: Array<{
    firstIndex: number;
    secondIndex: number;
    overlapRatio: number;
    thickness: number;
    score: number;
  }> = [];
  for (let firstIndex = 0; firstIndex < segments.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < segments.length; secondIndex += 1) {
      const first = segments[firstIndex];
      const second = segments[secondIndex];
      if (first.orientation !== second.orientation) continue;
      const horizontal = first.orientation === "horizontal";
      const firstMin = horizontal ? Math.min(first.start.x, first.end.x) : Math.min(first.start.y, first.end.y);
      const firstMax = horizontal ? Math.max(first.start.x, first.end.x) : Math.max(first.start.y, first.end.y);
      const secondMin = horizontal ? Math.min(second.start.x, second.end.x) : Math.min(second.start.y, second.end.y);
      const secondMax = horizontal ? Math.max(second.start.x, second.end.x) : Math.max(second.start.y, second.end.y);
      const overlap = Math.max(0, Math.min(firstMax, secondMax) - Math.max(firstMin, secondMin));
      const overlapRatio = overlap / Math.max(1, Math.min(first.length, second.length));
      const firstAxis = horizontal ? (first.start.y + first.end.y) / 2 : (first.start.x + first.end.x) / 2;
      const secondAxis = horizontal ? (second.start.y + second.end.y) / 2 : (second.start.x + second.end.x) / 2;
      const thickness = Math.abs(firstAxis - secondAxis);
      if (overlapRatio < 0.65 || thickness < 4 || thickness > 60) continue;
      const lengthSimilarity = Math.min(first.length, second.length) / Math.max(first.length, second.length);
      const score = overlapRatio * 0.7 + lengthSimilarity * 0.3;
      pairCandidates.push({ firstIndex, secondIndex, overlapRatio, thickness, score });
    }
  }

  const usedSegments = new Set<number>();
  const pairedWalls: PlanElementDraft[] = [];
  for (const pair of pairCandidates.sort((a, b) => b.score - a.score)) {
    if (usedSegments.has(pair.firstIndex) || usedSegments.has(pair.secondIndex)) continue;
    const first = segments[pair.firstIndex];
    const second = segments[pair.secondIndex];
    usedSegments.add(pair.firstIndex);
    usedSegments.add(pair.secondIndex);
    const centerline = {
      start: {
        x: Number(((first.start.x + second.start.x) / 2).toFixed(2)),
        y: Number(((first.start.y + second.start.y) / 2).toFixed(2)),
      },
      end: {
        x: Number(((first.end.x + second.end.x) / 2).toFixed(2)),
        y: Number(((first.end.y + second.end.y) / 2).toFixed(2)),
      },
    };
    pairedWalls.push({
      element_type: "wall",
      label: `مرشح جدار مزدوج ${pairedWalls.length + 1}`,
      value: pair.thickness.toFixed(2),
      unit: "pt",
      confidence_score: Math.min(82, Math.round(52 + pair.score * 30)),
      geometry: {
        kind: "paired_lines",
        coordinateSystem: "pdf_points",
        orientation: first.orientation,
        thickness: Number(pair.thickness.toFixed(2)),
        overlapRatio: Number(pair.overlapRatio.toFixed(3)),
        firstLine: { start: first.start, end: first.end },
        secondLine: { start: second.start, end: second.end },
        centerline,
      },
      notes: "Two parallel overlapping PDF vector segments inferred as a wall candidate; engineer confirmation is mandatory.",
    });
    if (pairedWalls.length >= 40) break;
  }

  const singleWalls = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ index }) => !usedSegments.has(index))
    .slice(0, 30)
    .map(({ segment }, index): PlanElementDraft => ({
      element_type: "wall",
      label: `مرشح خط جدار ${index + 1}`,
      value: segment.length.toFixed(2),
      unit: "pt",
      confidence_score: 42,
      geometry: {
        kind: "line",
        coordinateSystem: "pdf_points",
        orientation: segment.orientation,
        start: segment.start,
        end: segment.end,
      },
      notes: "Unpaired axis-aligned PDF vector segment; it is not a confirmed wall until reviewed.",
    }));

  return [...textElements, ...pairedWalls, ...singleWalls];
}

function inspectImage(bytes: Uint8Array, mimeType: string) {
  let width: number | null = null;
  let height: number | null = null;
  let validHeader = false;
  if (mimeType === "image/png" && bytes.length >= 24) {
    validHeader = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (mimeType === "image/jpeg") {
    validHeader = bytes[0] === 0xff && bytes[1] === 0xd8;
    for (let offset = 2; validHeader && offset + 9 < bytes.length;) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
      if (marker >= 0xc0 && marker <= 0xc3) {
        height = (bytes[offset + 5] << 8) + bytes[offset + 6];
        width = (bytes[offset + 7] << 8) + bytes[offset + 8];
        break;
      }
      offset += Math.max(2, length + 2);
    }
  } else if (mimeType === "image/webp" && bytes.length >= 12) {
    validHeader = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  return {
    kind: "image" as const,
    validHeader,
    width,
    height,
    megapixels: width && height ? Number(((width * height) / 1_000_000).toFixed(2)) : null,
  };
}

async function fingerprint(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return respond({ error: "Authentication is required." }, 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(
    authorization.replace(/^Bearer\s+/i, ""),
  );
  if (userError || !userData.user) return respond({ error: "Invalid session." }, 401);

  let runId: string | null = null;
  try {
    const { drawingId } = await req.json();
    if (typeof drawingId !== "string" || !drawingId) {
      return respond({ error: "drawingId is required." }, 400);
    }
    const { data: drawing, error: drawingError } = await supabase
      .from("architectural_drawings")
      .select("*")
      .eq("id", drawingId)
      .single();
    if (drawingError || !drawing) return respond({ error: "Drawing was not found." }, 404);

    const { data: run, error: runError } = await supabase
      .from("architectural_analysis_runs")
      .insert({
        user_id: userData.user.id,
        drawing_id: drawing.id,
        project_id: drawing.project_id,
        status: "processing",
        engine_version: "paired-wall-inference-v1",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (runError) throw runError;
    runId = run.id;

    const { data: blob, error: downloadError } = await supabase.storage
      .from("architectural-drawings")
      .download(drawing.storage_path);
    if (downloadError || !blob) throw downloadError ?? new Error("Drawing download failed.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.byteLength > 50 * 1024 * 1024) {
      throw new Error("Drawing exceeds the 50 MB analysis limit.");
    }

    const metadata = drawing.mime_type === "application/pdf"
      ? inspectPdf(bytes)
      : inspectImage(bytes, drawing.mime_type);
    const planElements = drawing.mime_type === "application/pdf"
      ? extractPdfPlanElements(bytes)
      : [];
    const findings: Finding[] = [];
    let qualityScore = metadata.validHeader ? 88 : 35;

    if (!metadata.validHeader) {
      findings.push({
        code: "FILE_SIGNATURE_MISMATCH",
        title: "نوع الملف لا يطابق محتواه",
        description: "لم تتطابق بصمة الملف الفعلية مع نوع الوسائط المسجل، مما قد يعني أن الملف تالف أو أعيدت تسميته.",
        recommendation: "أعد تصدير المخطط من المصدر الأصلي ثم ارفعه بصيغته الصحيحة.",
        category: "constructability",
        severity: "warning",
        confidence_score: 99,
        evidence: [{ source: "file_signature", observation: "header_mismatch", value: drawing.mime_type }],
      });
    } else if (metadata.kind === "pdf") {
      qualityScore += metadata.searchableText ? 5 : -14;
      qualityScore += metadata.vectorLikely ? 5 : -10;
      findings.push({
        code: metadata.searchableText ? "SEARCHABLE_TEXT_DETECTED" : "TEXT_LAYER_NOT_DETECTED",
        title: metadata.searchableText ? "تم اكتشاف طبقة نص في المخطط" : "لم تُكتشف طبقة نص قابلة للقراءة",
        description: metadata.searchableText
          ? "يحتوي PDF على نصوص قابلة للاستخراج، مما يرفع موثوقية قراءة التسميات والأبعاد."
          : "يبدو أن المخطط صورة ممسوحة أو مصدّر بلا طبقة نص، مما يقلل موثوقية قراءة التسميات.",
        recommendation: metadata.searchableText
          ? "استمر بهذه الصيغة للمراجعات والإصدارات القادمة."
          : "صدّر PDF متجهيًا من برنامج التصميم مع تضمين الخطوط.",
        category: "space_efficiency",
        severity: metadata.searchableText ? "info" : "warning",
        confidence_score: 90,
        evidence: [
          { source: "pdf_structure", observation: "font_objects", value: metadata.fonts },
          { source: "pdf_structure", observation: "text_blocks", value: metadata.textBlocks },
        ],
      });
      findings.push({
        code: metadata.vectorLikely ? "VECTOR_CONTENT_DETECTED" : "RASTER_HEAVY_PDF",
        title: metadata.vectorLikely ? "المحتوى المتجهي مناسب للتحليل" : "المخطط يعتمد بصورة كبيرة على الصور",
        description: metadata.vectorLikely
          ? "تم رصد مسارات متجهية كافية تساعد على فهم الخطوط والعناصر الهندسية."
          : "عدد الصور المضمنة مرتفع مقارنة بالمسارات المتجهية، وقد يحد ذلك من التحليل الهندسي.",
        recommendation: metadata.vectorLikely
          ? "حافظ على التصدير المتجهي عند رفع الإصدارات التالية."
          : "استخدم تصدير PDF مباشرًا من AutoCAD أو Revit بدل لقطة ممسوحة.",
        category: "constructability",
        severity: metadata.vectorLikely ? "info" : "opportunity",
        confidence_score: 82,
        evidence: [
          { source: "pdf_structure", observation: "vector_path_markers", value: metadata.vectorPaths },
          { source: "pdf_structure", observation: "embedded_images", value: metadata.images },
        ],
      });
    } else {
      const largeEnough = Boolean(metadata.megapixels && metadata.megapixels >= 4);
      qualityScore += largeEnough ? 2 : -18;
      findings.push({
        code: largeEnough ? "RASTER_RESOLUTION_ACCEPTABLE" : "RASTER_RESOLUTION_LIMITED",
        title: largeEnough ? "دقة الصورة مناسبة للفحص الأولي" : "دقة الصورة أقل من المستوى الموصى به",
        description: metadata.width && metadata.height
          ? `تم رصد أبعاد الصورة: ${metadata.width}×${metadata.height} بكسل.`
          : "تعذر استخراج أبعاد الصورة من ترويسة الملف، لذلك يلزم فحص الجودة يدويًا.",
        recommendation: "استخدم نسخة PDF متجهية أو صورة واضحة بدقة لا تقل عن 4 ميغابكسل.",
        category: "constructability",
        severity: largeEnough ? "info" : "warning",
        confidence_score: metadata.width ? 96 : 72,
        evidence: [
          { source: "image_header", observation: "width", value: metadata.width },
          { source: "image_header", observation: "height", value: metadata.height },
        ],
      });
    }
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    const { data: review, error: reviewError } = await supabase
      .from("architectural_reviews")
      .insert({
        user_id: userData.user.id,
        drawing_id: drawing.id,
        project_id: drawing.project_id,
        status: "ready",
        plan_health: qualityScore,
      })
      .select("id,drawing_id,project_id,user_id,status,plan_health,generated_at,created_at")
      .single();
    if (reviewError) throw reviewError;

    const { data: savedFindings, error: findingsError } = await supabase
      .from("architectural_review_findings")
      .insert(findings.map((finding) => ({
        ...finding,
        user_id: userData.user.id,
        review_id: review.id,
        drawing_id: drawing.id,
        analysis_run_id: runId,
        status: "open",
      })))
      .select("*");
    if (findingsError) throw findingsError;

    let savedPlanElements: unknown[] = [];
    if (planElements.length) {
      const { data: elementRows, error: elementsError } = await supabase
        .from("architectural_plan_elements")
        .insert(planElements.map((element) => ({
          ...element,
          user_id: userData.user.id,
          project_id: drawing.project_id,
          drawing_id: drawing.id,
          analysis_run_id: runId,
          source: "automatic",
          status: "detected",
        })))
        .select("id,element_type,label,value,unit,confidence_score,source,status");
      if (elementsError) throw elementsError;
      savedPlanElements = elementRows ?? [];
    }

    const finishedAt = new Date().toISOString();
    const [, runUpdate] = await Promise.all([
      supabase.from("architectural_drawings").update({
        status: "reviewed",
        page_count: metadata.kind === "pdf" ? metadata.pages : null,
      }).eq("id", drawing.id),
      supabase.from("architectural_analysis_runs").update({
        status: "completed",
        review_id: review.id,
        input_fingerprint: await fingerprint(bytes),
        extracted_metadata: metadata,
        quality_score: qualityScore,
        completed_at: finishedAt,
      }).eq("id", runId),
    ]);
    if (runUpdate.error) throw runUpdate.error;
    return respond({
      runId,
      metadata,
      planElements: savedPlanElements,
      review: { ...review, architectural_review_findings: savedFindings ?? [] },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Analysis failed.";
    if (runId) {
      await supabase.from("architectural_analysis_runs").update({
        status: "failed",
        error_message: message.slice(0, 1000),
        completed_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    return respond({ error: message }, 400);
  }
});
