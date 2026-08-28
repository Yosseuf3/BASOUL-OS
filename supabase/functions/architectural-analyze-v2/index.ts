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

type Point = { x: number; y: number };
type Matrix = [number, number, number, number, number, number];
type PlanElementDraft = {
  element_type: "wall" | "opening" | "room" | "label" | "dimension";
  label: string;
  value: string | null;
  unit: string | null;
  confidence_score: number;
  geometry: Record<string, unknown>;
  notes: string;
};
type Finding = {
  code: string;
  title: string;
  description: string;
  recommendation: string;
  category: "space_efficiency" | "constructability";
  severity: "info" | "opportunity" | "warning";
  confidence_score: number;
  evidence: Array<{ source: string; observation: string; value?: string | number | boolean | null }>;
};
type VisionElement = {
  element_type: PlanElementDraft["element_type"];
  label: string;
  value: string | null;
  unit: string | null;
  confidence_score: number;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  notes: string;
};

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Number(n.toFixed(2));

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function responseOutputText(payload: Record<string, unknown>) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (part && typeof part === "object" &&
        (part as { type?: unknown }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function transform(m: Matrix, x: number, y: number): Point {
  return { x: round(m[0] * x + m[2] * y + m[4]), y: round(m[1] * x + m[3] * y + m[5]) };
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function pdfContentStreams(bytes: Uint8Array) {
  const latin = new TextDecoder("latin1").decode(bytes);
  const streams: string[] = [];
  const marker = /stream\r?\n/g;
  for (const match of latin.matchAll(marker)) {
    const start = (match.index ?? 0) + match[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) continue;
    const dictStart = Math.max(0, (match.index ?? 0) - 600);
    const dictionary = latin.slice(dictStart, match.index);
    let raw = bytes.subarray(start, end);
    if (/\/FlateDecode\b/.test(dictionary)) {
      const inflated = await inflate(raw);
      if (inflated) raw = inflated;
    }
    const text = new TextDecoder("latin1").decode(raw);
    if (/\b(?:m|l|re|BT|Tj|TJ|cm)\b/.test(text)) streams.push(text);
    if (streams.length >= 100) break;
  }
  if (!streams.length) streams.push(latin);
  return streams;
}

function parseVectorGeometry(streams: string[]) {
  const segments: Array<{ start: Point; end: Point; length: number; orientation: "horizontal" | "vertical" }> = [];
  const seen = new Set<string>();

  for (const content of streams) {
    const tokens = content.match(/-?\d*\.?\d+(?:[eE][+-]?\d+)?|[A-Za-z\*']+|[\[\]\(\)]/g) ?? [];
    const operands: number[] = [];
    let ctm: Matrix = [...IDENTITY];
    const stack: Matrix[] = [];
    let current: Point | null = null;

    for (const token of tokens) {
      const num = Number(token);
      if (Number.isFinite(num) && /^-?\d/.test(token)) {
        operands.push(num);
        if (operands.length > 20) operands.splice(0, operands.length - 20);
        continue;
      }
      if (token === "q") {
        stack.push([...ctm] as Matrix);
        operands.length = 0;
        continue;
      }
      if (token === "Q") {
        ctm = stack.pop() ?? [...IDENTITY];
        operands.length = 0;
        continue;
      }
      if (token === "cm" && operands.length >= 6) {
        const v = operands.splice(-6) as Matrix;
        ctm = multiply(ctm, v);
        operands.length = 0;
        continue;
      }
      if (token === "m" && operands.length >= 2) {
        const [x, y] = operands.splice(-2);
        current = transform(ctm, x, y);
        operands.length = 0;
        continue;
      }
      if (token === "l" && operands.length >= 2 && current) {
        const [x, y] = operands.splice(-2);
        const next = transform(ctm, x, y);
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const length = Math.hypot(dx, dy);
        const major = Math.max(Math.abs(dx), Math.abs(dy));
        const minor = Math.min(Math.abs(dx), Math.abs(dy));
        if (length >= 8 && length <= 5000 && minor <= major * 0.04) {
          const orientation = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
          const a = orientation === "horizontal"
            ? (current.x <= next.x ? current : next)
            : (current.y <= next.y ? current : next);
          const b = a === current ? next : current;
          const key = `${orientation}:${a.x}:${a.y}:${b.x}:${b.y}`;
          if (!seen.has(key)) {
            seen.add(key);
            segments.push({ start: a, end: b, length, orientation });
          }
        }
        current = next;
        operands.length = 0;
        continue;
      }
      if (token === "re" && operands.length >= 4) {
        const [x, y, w, h] = operands.splice(-4);
        const p1 = transform(ctm, x, y);
        const p2 = transform(ctm, x + w, y);
        const p3 = transform(ctm, x + w, y + h);
        const p4 = transform(ctm, x, y + h);
        [[p1, p2], [p2, p3], [p3, p4], [p4, p1]].forEach(([a, b]) => {
          const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
          if (length < 8 || length > 5000) return;
          const orientation = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
          const aa = orientation === "horizontal" ? (a.x <= b.x ? a : b) : (a.y <= b.y ? a : b);
          const bb = aa === a ? b : a;
          const key = `${orientation}:${aa.x}:${aa.y}:${bb.x}:${bb.y}`;
          if (!seen.has(key)) { seen.add(key); segments.push({ start: aa, end: bb, length, orientation }); }
        });
        operands.length = 0;
        continue;
      }
      if (/^[A-Za-z]/.test(token)) operands.length = 0;
    }
  }
  return segments.slice(0, 700);
}

function pairedWalls(segments: ReturnType<typeof parseVectorGeometry>): PlanElementDraft[] {
  const candidates: Array<{ a: number; b: number; score: number; thickness: number; overlap: number }> = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i], b = segments[j];
      if (a.orientation !== b.orientation) continue;
      const horizontal = a.orientation === "horizontal";
      const amin = horizontal ? a.start.x : a.start.y;
      const amax = horizontal ? a.end.x : a.end.y;
      const bmin = horizontal ? b.start.x : b.start.y;
      const bmax = horizontal ? b.end.x : b.end.y;
      const overlap = Math.max(0, Math.min(amax, bmax) - Math.max(amin, bmin));
      const overlapRatio = overlap / Math.max(1, Math.min(a.length, b.length));
      if (overlapRatio < 0.7) continue;
      const axisA = horizontal ? (a.start.y + a.end.y) / 2 : (a.start.x + a.end.x) / 2;
      const axisB = horizontal ? (b.start.y + b.end.y) / 2 : (b.start.x + b.end.x) / 2;
      const thickness = Math.abs(axisA - axisB);
      if (thickness < 1.5 || thickness > 80) continue;
      const lengthSimilarity = Math.min(a.length, b.length) / Math.max(a.length, b.length);
      candidates.push({ a: i, b: j, score: overlapRatio * 0.72 + lengthSimilarity * 0.28, thickness, overlap: overlapRatio });
    }
  }
  const used = new Set<number>();
  const out: PlanElementDraft[] = [];
  for (const c of candidates.sort((x, y) => y.score - x.score)) {
    if (used.has(c.a) || used.has(c.b)) continue;
    used.add(c.a); used.add(c.b);
    const a = segments[c.a], b = segments[c.b];
    const centerline = {
      start: { x: round((a.start.x + b.start.x) / 2), y: round((a.start.y + b.start.y) / 2) },
      end: { x: round((a.end.x + b.end.x) / 2), y: round((a.end.y + b.end.y) / 2) },
    };
    out.push({
      element_type: "wall",
      label: `جدار متجهي ${out.length + 1}`,
      value: round(c.thickness).toString(),
      unit: "pt",
      confidence_score: clamp(Math.round(56 + c.score * 30), 55, 88),
      geometry: { kind: "paired_lines_v2", coordinateSystem: "pdf_points", orientation: a.orientation, thickness: round(c.thickness), centerline, overlapRatio: round(c.overlap) },
      notes: "Hybrid parser: paired transformed PDF vector paths. Confirm wall semantics and scale before approval.",
    });
    if (out.length >= 28) break;
  }
  return out;
}

function wallGaps(walls: PlanElementDraft[]): PlanElementDraft[] {
  const axes = walls.map((w, index) => {
    const g = w.geometry as any;
    return { index, orientation: g.orientation as "horizontal" | "vertical", thickness: Number(g.thickness), centerline: g.centerline as { start: Point; end: Point } };
  });
  const out: PlanElementDraft[] = []; const seen = new Set<string>();
  for (let i = 0; i < axes.length; i++) for (let j = i + 1; j < axes.length; j++) {
    const a = axes[i], b = axes[j]; if (a.orientation !== b.orientation) continue;
    const h = a.orientation === "horizontal";
    const axisA = h ? (a.centerline.start.y + a.centerline.end.y) / 2 : (a.centerline.start.x + a.centerline.end.x) / 2;
    const axisB = h ? (b.centerline.start.y + b.centerline.end.y) / 2 : (b.centerline.start.x + b.centerline.end.x) / 2;
    const tol = Math.max(4, (a.thickness + b.thickness) / 4);
    if (Math.abs(axisA - axisB) > tol) continue;
    const a0 = h ? a.centerline.start.x : a.centerline.start.y, a1 = h ? a.centerline.end.x : a.centerline.end.y;
    const b0 = h ? b.centerline.start.x : b.centerline.start.y, b1 = h ? b.centerline.end.x : b.centerline.end.y;
    const amin = Math.min(a0, a1), amax = Math.max(a0, a1), bmin = Math.min(b0, b1), bmax = Math.max(b0, b1);
    const s = amax <= bmin ? amax : bmax <= amin ? bmax : null, e = amax <= bmin ? bmin : bmax <= amin ? amin : null;
    if (s === null || e === null) continue;
    const width = e - s; if (width < 8 || width > 220) continue;
    const axis = round((axisA + axisB) / 2);
    const start = h ? { x: round(s), y: axis } : { x: axis, y: round(s) };
    const end = h ? { x: round(e), y: axis } : { x: axis, y: round(e) };
    const key = `${a.orientation}:${start.x}:${start.y}:${end.x}:${end.y}`; if (seen.has(key)) continue; seen.add(key);
    out.push({
      element_type: "opening", label: `فتحة متجهية ${out.length + 1}`, value: round(width).toString(), unit: "pt",
      confidence_score: 62, geometry: { kind: "wall_gap_v2", coordinateSystem: "pdf_points", orientation: a.orientation, start, end, width: round(width) },
      notes: "Hybrid parser: gap between aligned wall candidates. Vision is used to classify door/window semantics.",
    });
    if (out.length >= 16) return out;
  }
  return out;
}

function decodeLiteral(value: string) {
  return value.replace(/\\([\\()])/g, "$1").replace(/\\[nrtbf]/g, " ").replace(/\\\d{1,3}/g, " ").replace(/\s+/g, " ").trim();
}

function textElements(streams: string[]): PlanElementDraft[] {
  const values: string[] = [];
  for (const s of streams) {
    for (const m of s.matchAll(/\(((?:\\.|[^\\()]){2,200})\)\s*Tj/g)) values.push(decodeLiteral(m[1]));
    for (const m of s.matchAll(/\[((?:.|\n){2,500}?)\]\s*TJ/g)) {
      const chunks = [...m[1].matchAll(/\(((?:\\.|[^\\()]){1,160})\)/g)].map(x => decodeLiteral(x[1]));
      if (chunks.length) values.push(chunks.join(""));
    }
  }
  const unique = [...new Set(values.map(v => v.trim()).filter(v => v.length >= 2 && v.length <= 120))].slice(0, 80);
  const dim = /^(\d+(?:[.,]\d+)?)\s*(mm|cm|m|ft|in)?$/i;
  const room = /(غرفة|حمام|مطبخ|صالة|مجلس|ممر|محل|مكتب|مستودع|room|bedroom|living|kitchen|bath|toilet|wc|hall|corridor|majlis|office|garage|store|laundry|dining)/i;
  return unique.map((label): PlanElementDraft => {
    const d = label.match(dim);
    if (d && d[2]) return { element_type: "dimension", label, value: d[1].replace(",", "."), unit: d[2].toLowerCase(), confidence_score: 74, geometry: { kind: "pdf_text_v2" }, notes: "Decoded from PDF text operators after content-stream decompression." };
    if (room.test(label)) return { element_type: "room", label, value: null, unit: null, confidence_score: 70, geometry: { kind: "pdf_text_v2" }, notes: "Semantic room label decoded from PDF text stream." };
    return { element_type: "label", label, value: null, unit: null, confidence_score: 52, geometry: { kind: "pdf_text_v2" }, notes: "Decoded PDF label; embedded/custom font encoding may require Vision confirmation." };
  }).slice(0, 36);
}

function inspectPdf(bytes: Uint8Array, streams: string[], segments: ReturnType<typeof parseVectorGeometry>) {
  const raw = new TextDecoder("latin1").decode(bytes);
  const pages = Math.max(1, (raw.match(/\/Type\s*\/Page\b/g) ?? []).length);
  const fonts = (raw.match(/\/Type\s*\/Font\b/g) ?? []).length;
  const images = (raw.match(/\/Subtype\s*\/Image\b/g) ?? []).length;
  return {
    kind: "pdf" as const, validHeader: raw.startsWith("%PDF-"), pages, fonts, images,
    decompressedStreams: streams.length, vectorSegments: segments.length,
    searchableText: streams.some(s => /\b(?:Tj|TJ)\b/.test(s)),
    vectorLikely: segments.length >= 20,
  };
}

async function analyzeWithVision(bytes: Uint8Array, mimeType: string, filename: string): Promise<PlanElementDraft[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY"); if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("Vision analysis supports files up to 20 MB.");
  const fileData = toBase64(bytes);
  const fileInput = mimeType === "application/pdf"
    ? { type: "input_file", filename: filename || "drawing.pdf", file_data: `data:application/pdf;base64,${fileData}` }
    : { type: "input_image", detail: "high", image_url: `data:${mimeType};base64,${fileData}` };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_VISION_MODEL") ?? "gpt-4.1-mini", store: false,
      input: [{ role: "user", content: [
        { type: "input_text", text: [
          "أنت محلل مخططات معمارية. حلّل المخطط بصريًا مع اعتبار أن الملف قد يكون PDF متجهيًا صادرًا من AutoCAD.",
          "استخرج فقط العناصر المرئية بوضوح: الجدران، الأبواب/النوافذ كفتحات، الغرف/المحلات/الحمامات، النصوص المهمة، والأبعاد.",
          "للأبواب أو النوافذ استخدم element_type=opening واكتب التصنيف في label مثل باب أو نافذة.",
          "استخدم bbox نسبي 0..1000 لكل صفحة. لا تخمن. فضّل الدقة على العدد.",
          "اقرأ النص العربي كما يظهر قدر الإمكان. أعد JSON فقط وفق schema."
        ].join("\n") }, fileInput] }],
      text: { format: { type: "json_schema", name: "architectural_hybrid_elements", strict: true, schema: {
        type: "object", additionalProperties: false, properties: { elements: { type: "array", maxItems: 50, items: {
          type: "object", additionalProperties: false, properties: {
            element_type: { type: "string", enum: ["wall", "opening", "room", "label", "dimension"] },
            label: { type: "string", minLength: 1, maxLength: 160 }, value: { type: ["string", "null"] }, unit: { type: ["string", "null"] },
            confidence_score: { type: "integer", minimum: 0, maximum: 100 }, page: { type: "integer", minimum: 1 },
            x: { type: "number", minimum: 0, maximum: 1000 }, y: { type: "number", minimum: 0, maximum: 1000 },
            width: { type: "number", minimum: 0, maximum: 1000 }, height: { type: "number", minimum: 0, maximum: 1000 },
            notes: { type: "string", maxLength: 500 }
          }, required: ["element_type", "label", "value", "unit", "confidence_score", "page", "x", "y", "width", "height", "notes"]
        } } }, required: ["elements"]
      } } }
    })
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const err = payload.error && typeof payload.error === "object" ? (payload.error as any).message : null;
    throw new Error(typeof err === "string" ? err : `Vision request failed (${response.status}).`);
  }
  const output = responseOutputText(payload); if (!output) throw new Error("Vision response did not contain structured output.");
  const parsed = JSON.parse(output) as { elements?: VisionElement[] };
  return (parsed.elements ?? []).map(e => ({
    element_type: e.element_type, label: e.label.trim().slice(0, 160), value: e.value, unit: e.unit?.slice(0, 24) ?? null,
    confidence_score: clamp(Math.round(e.confidence_score), 30, 88),
    geometry: { kind: "vision_bbox_v2", coordinateSystem: "normalized_0_1000", page: e.page, x: e.x, y: e.y, width: e.width, height: e.height },
    notes: `Hybrid Vision semantic pass; engineer confirmation mandatory. ${e.notes}`.slice(0, 1000),
  }));
}

function mergeHybrid(vector: PlanElementDraft[], vision: PlanElementDraft[]) {
  const result: PlanElementDraft[] = [];
  const push = (e: PlanElementDraft) => {
    const key = `${e.element_type}:${e.label.trim().toLowerCase()}:${e.value ?? ""}`;
    if (result.some(x => `${x.element_type}:${x.label.trim().toLowerCase()}:${x.value ?? ""}` === key)) return;
    result.push(e);
  };
  vector.filter(e => e.element_type === "wall").slice(0, 28).forEach(push);
  vector.filter(e => e.element_type === "opening").slice(0, 16).forEach(push);
  vision.filter(e => ["room", "dimension", "label"].includes(e.element_type)).slice(0, 32).forEach(push);
  vision.filter(e => ["opening", "wall"].includes(e.element_type)).slice(0, 18).forEach(push);
  vector.filter(e => ["room", "dimension", "label"].includes(e.element_type)).slice(0, 16).forEach(push);
  return result.slice(0, 72);
}

async function fingerprint(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes); return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return respond({ error: "Supabase runtime configuration is missing." }, 500);
  const authorization = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  let runId: string | null = null;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return respond({ error: "Unauthorized." }, 401);
    const body = await req.json() as { drawingId?: unknown; retry?: unknown };
    const drawingId = body.drawingId;
    if (typeof drawingId !== "string" || !drawingId) return respond({ error: "drawingId is required." }, 400);

    const { data: drawing, error: drawingError } = await supabase.from("architectural_drawings").select("*").eq("id", drawingId).single();
    if (drawingError || !drawing) return respond({ error: "Drawing was not found." }, 404);

    const { data: run, error: runError } = await supabase.from("architectural_analysis_runs").insert({
      user_id: userData.user.id, drawing_id: drawing.id, project_id: drawing.project_id, status: "processing",
      engine_version: "hybrid-autocad-pdf-v3", extracted_metadata: { retry: Boolean(body.retry) }, started_at: new Date().toISOString(),
    }).select("id").single();
    if (runError) throw runError; runId = run.id;

    const { data: blob, error: downloadError } = await supabase.storage.from("architectural-drawings").download(drawing.storage_path);
    if (downloadError || !blob) throw downloadError ?? new Error("Drawing download failed.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.byteLength > 50 * 1024 * 1024) throw new Error("Drawing exceeds the 50 MB analysis limit.");

    let metadata: any;
    let vectorElements: PlanElementDraft[] = [];
    if (drawing.mime_type === "application/pdf") {
      const streams = await pdfContentStreams(bytes);
      const segments = parseVectorGeometry(streams);
      const walls = pairedWalls(segments);
      const openings = wallGaps(walls);
      const texts = textElements(streams);
      vectorElements = [...walls, ...openings, ...texts];
      metadata = inspectPdf(bytes, streams, segments);
    } else {
      metadata = { kind: "image", validHeader: true, pages: 1, vectorLikely: false, searchableText: false, decompressedStreams: 0, vectorSegments: 0 };
    }

    let visionElements: PlanElementDraft[] = [];
    let visionError: string | null = null;
    try {
      visionElements = await analyzeWithVision(bytes, drawing.mime_type, drawing.name);
    } catch (cause) {
      visionError = cause instanceof Error ? cause.message : "Vision analysis failed.";
    }

    const planElements = mergeHybrid(vectorElements, visionElements);
    const vectorWalls = vectorElements.filter(e => e.element_type === "wall").length;
    const vectorOpenings = vectorElements.filter(e => e.element_type === "opening").length;
    const semanticVision = visionElements.filter(e => ["room", "opening", "dimension"].includes(e.element_type)).length;
    let qualityScore = 55;
    qualityScore += metadata.validHeader ? 8 : -25;
    qualityScore += Math.min(15, vectorWalls);
    qualityScore += Math.min(8, vectorOpenings);
    qualityScore += Math.min(14, semanticVision);
    qualityScore = clamp(qualityScore, 0, 99);

    const findings: Finding[] = [{
      code: "HYBRID_PARSER_V3",
      title: "تم تشغيل التحليل الهجين للمخطط",
      description: `استخراج Vector: ${vectorElements.length} عنصرًا أوليًا، Vision: ${visionElements.length} عنصرًا دلاليًا، والنتيجة المدمجة: ${planElements.length} عنصرًا.`,
      recommendation: "راجع طبقة العناصر فوق المخطط واعتمد الصحيح منها؛ لا تستخدم أي عنصر آلي كقرار هندسي نهائي دون مراجعة.",
      category: "constructability", severity: "info", confidence_score: 95,
      evidence: [
        { source: "vector_parser", observation: "vector_segments", value: metadata.vectorSegments ?? 0 },
        { source: "vector_parser", observation: "wall_candidates", value: vectorWalls },
        { source: "vision", observation: "semantic_elements", value: visionElements.length },
      ],
    }];
    if (visionError) findings.push({
      code: "HYBRID_VISION_DEGRADED", title: "اكتمل التحليل المتجهي دون الطبقة البصرية",
      description: "تم حفظ نتائج Vector، لكن طبقة Vision لم تكتمل في هذه المحاولة.",
      recommendation: "أعد التحليل لاحقًا لتحسين تصنيف الغرف والأبواب والنوافذ والنص العربي.",
      category: "constructability", severity: "warning", confidence_score: 98,
      evidence: [{ source: "vision", observation: "error", value: visionError.slice(0, 300) }],
    });
    if (drawing.mime_type === "application/pdf" && metadata.vectorLikely && vectorWalls === 0) findings.push({
      code: "VECTOR_GEOMETRY_LOW_RECALL", title: "المخطط متجهي لكن هندسة الجدران تحتاج دعمًا بصريًا",
      description: "رُصدت مسارات Vector داخل PDF، لكن لم تتكوّن أزواج خطوط كافية لتأكيد الجدران آليًا.",
      recommendation: "اعتمد العناصر البصرية المدمجة، وراجع الجدران يدويًا على طبقة Overlay.",
      category: "constructability", severity: "opportunity", confidence_score: 84,
      evidence: [{ source: "vector_parser", observation: "segments", value: metadata.vectorSegments ?? 0 }],
    });

    const { data: review, error: reviewError } = await supabase.from("architectural_reviews").insert({
      user_id: userData.user.id, drawing_id: drawing.id, project_id: drawing.project_id, status: "ready", plan_health: qualityScore,
    }).select("id,drawing_id,project_id,user_id,status,plan_health,generated_at,created_at").single();
    if (reviewError) throw reviewError;

    const { data: savedFindings, error: findingsError } = await supabase.from("architectural_review_findings").insert(
      findings.map(f => ({ ...f, user_id: userData.user.id, review_id: review.id, drawing_id: drawing.id, analysis_run_id: runId, status: "open" }))
    ).select("*");
    if (findingsError) throw findingsError;

    let savedPlanElements: unknown[] = [];
    if (planElements.length) {
      const { data: rows, error: elementsError } = await supabase.from("architectural_plan_elements").insert(
        planElements.map(e => ({ ...e, user_id: userData.user.id, project_id: drawing.project_id, drawing_id: drawing.id, analysis_run_id: runId, source: "automatic", status: "detected" }))
      ).select("id,element_type,label,value,unit,confidence_score,source,status,geometry,notes");
      if (elementsError) throw elementsError; savedPlanElements = rows ?? [];
    }

    const completedAt = new Date().toISOString();
    const [, runUpdate] = await Promise.all([
      supabase.from("architectural_drawings").update({ status: "reviewed", page_count: metadata.pages ?? 1 }).eq("id", drawing.id),
      supabase.from("architectural_analysis_runs").update({
        status: planElements.length ? "completed" : "failed", review_id: review.id, input_fingerprint: await fingerprint(bytes),
        extracted_metadata: { ...metadata, retry: Boolean(body.retry), engine: "hybrid-autocad-pdf-v3", vectorElementCount: vectorElements.length, visionElementCount: visionElements.length, visionError },
        quality_score: qualityScore, error_message: planElements.length ? null : "No architectural elements were detected.", completed_at: completedAt,
      }).eq("id", runId),
    ]);
    if (runUpdate.error) throw runUpdate.error;

    return respond({
      runId, metadata, engine: "hybrid-autocad-pdf-v3", analysisStatus: planElements.length ? "completed" : "needs_better_source",
      vectorElementCount: vectorElements.length, visionElementCount: visionElements.length, planElements: savedPlanElements,
      review: { ...review, architectural_review_findings: savedFindings ?? [] },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Analysis failed.";
    if (runId) await supabase.from("architectural_analysis_runs").update({ status: "failed", error_message: message.slice(0, 1000), completed_at: new Date().toISOString() }).eq("id", runId);
    return respond({ error: message }, 400);
  }
});
