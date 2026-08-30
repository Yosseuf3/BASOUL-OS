export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_AI_ORIGIN = "https://ai.basoul.net";
const MAX_BODY_BYTES = 32_000;

function resolveAiConversationUrl() {
  const rawOrigin = process.env.BASOUL_AI_URL?.trim() || DEFAULT_AI_ORIGIN;
  const origin = new URL(rawOrigin);
  const isLocalHttp = origin.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(origin.hostname);

  if (origin.protocol !== "https:" && !isLocalHttp) {
    throw new Error("BASOUL_AI_URL must use HTTPS outside local development");
  }

  return new URL("/api/conversation", origin);
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return Response.json({ error: "Missing BASOUL session bearer token" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Request too large" }, { status: 413 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(resolveAiConversationUrl(), {
      method: "POST",
      headers: {
        authorization,
        "content-type": "application/json",
        accept: "application/x-ndjson",
      },
      body,
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return Response.json({ error: "BASOUL AI is unavailable" }, { status: 502 });
  }

  const headers = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/x-ndjson; charset=utf-8",
    "cache-control": "no-store",
  });

  for (const header of ["x-r1-provider", "x-r1-memory"]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
