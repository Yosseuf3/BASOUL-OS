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
        engine_version: "preflight-v1",
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
    const findings: Finding[] = [];
    let qualityScore = metadata.validHeader ? 88 : 35;

    if (!metadata.validHeader) {
      findings.push({
        code: "FILE_SIGNATURE_MISMATCH",
        title: "???? ????? ?? ????? ??????",
        description: "?? ?????? ????? ????? ??????? ?? ?????? ???????? ???? ?? ???? ?????? ?????? ???????.",
        recommendation: "??? ????? ?????? ?? ?????? ?????? ?? ????? ?????? ??? ????? ??????? ??????.",
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
        title: metadata.searchableText ? "?? ?????? ???? ?? ????? ???????" : "?? ?????? ???? ?? ?????",
        description: metadata.searchableText
          ? "????? PDF ??? ?????? ?? ????? ????? ??? ????? ???????? ???????? ?????."
          : "???? ?? ?????? ????? ?????? ?? ??????? ?? ???? ??? ??????? ????? ???????? ????????.",
        recommendation: metadata.searchableText
          ? "???? ??? ?????? ?????? ?????? ?? ????????? ???????."
          : "???? PDF ?????? ?? ?????? ????? ?? ????? ?????? ????? ???????.",
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
        title: metadata.vectorLikely ? "????? ????? ????? ???????" : "?????? ????? ????? ????? ??? ?????",
        description: metadata.vectorLikely
          ? "????? ????? ???? ??? ???? ????? ??? ?????? ?????? ???????? ???????? ???????? ??????."
          : "??? ????? ?????? ??????? ????? ??????? ?????? ?? ?? ??? ?? ????? ?????? ???????.",
        recommendation: metadata.vectorLikely
          ? "???? ?????? ??????? ??????? ??? ????? ??????? ???? ???????."
          : "?????? ????? PDF ????? ?? AutoCAD ?? Revit ??? ??????? ?????.",
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
        title: largeEnough ? "??? ?????? ?????? ????? ??????" : "??? ?????? ?? ??? ?? ???????",
        description: metadata.width && metadata.height
          ? `?? ???? ?????? ???? ${metadata.width}?${metadata.height} ????.`
          : "???? ??????? ????? ?????? ?? ??? ?????? ??????? ????????? ??? ????? ??????.",
        recommendation: "????? ????? ???? PDF ???????? ?? ???? ???? ?? ??? ?? 4 ????????.",
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
