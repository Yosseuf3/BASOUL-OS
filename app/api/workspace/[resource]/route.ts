import { NextRequest, NextResponse } from "next/server";
import { authenticatedDatabase, isAuthorizedResource, trustedIdentityPayload } from "@/lib/auth/authorized-workspace";

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function context(request: NextRequest, resource: string) {
  if (!isAuthorizedResource(resource)) return { response: NextResponse.json({ error: "Unknown resource" }, { status: 404 }) };
  const auth = await authenticatedDatabase(bearer(request));
  if (!auth) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { auth, resource };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if ("response" in resolved) return resolved.response;
  const result = await resolved.auth.database.from(resolved.resource).select("*").eq("organization_id", resolved.auth.organizationId).order("updated_at", { ascending: false });
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if ("response" in resolved) return resolved.response;
  const payload = trustedIdentityPayload(await request.json(), resolved.auth.user.id, resolved.auth.organizationId);
  const result = await resolved.auth.database.from(resolved.resource).insert(payload).select("*").single();
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if ("response" in resolved) return resolved.response;
  const body = await request.json() as Record<string, unknown>;
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing row id" }, { status: 400 });
  const payload = trustedIdentityPayload(body, resolved.auth.user.id, resolved.auth.organizationId);
  const result = await resolved.auth.database.from(resolved.resource).update(payload).eq("id", body.id).eq("organization_id", resolved.auth.organizationId).select("*").single();
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if ("response" in resolved) return resolved.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing row id" }, { status: 400 });
  const result = await resolved.auth.database.from(resolved.resource).delete().eq("id", id).eq("organization_id", resolved.auth.organizationId);
  return NextResponse.json(result.error ? { error: result.error.message } : { data: null }, { status: result.error ? 403 : 200 });
}
