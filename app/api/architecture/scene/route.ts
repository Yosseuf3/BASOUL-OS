import { NextRequest, NextResponse } from "next/server";
import { authenticatedDatabase } from "@/lib/auth/authorized-workspace";
import { requestedOrganization } from "@/lib/organizations/context";
import type { ArchitectureScene } from "@/packages/architecture-engine/src";

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function validUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f-]{36}$/i.test(value));
}

function validScene(value: unknown): value is ArchitectureScene {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const scene = value as Record<string, unknown>;
  return Boolean(scene.nodes && typeof scene.nodes === "object" && !Array.isArray(scene.nodes) && Array.isArray(scene.rootNodeIds));
}

async function resolveContext(request: NextRequest, projectId: string | null) {
  if (!validUuid(projectId)) {
    return { ok: false as const, response: NextResponse.json({ error: "architecture.project.invalid" }, { status: 400 }) };
  }

  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers));
  if (!auth) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const project = await auth.database
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (project.error || !project.data) {
    return { ok: false as const, response: NextResponse.json({ error: "architecture.project.not_found" }, { status: 404 }) };
  }

  return { ok: true as const, auth, projectId };
}

export async function GET(request: NextRequest) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  const resolved = await resolveContext(request, projectId);
  if (!resolved.ok) return resolved.response;

  const result = await resolved.auth.database
    .from("architecture_scenes")
    .select("*")
    .eq("organization_id", resolved.auth.organizationId)
    .eq("project_id", resolved.projectId)
    .maybeSingle();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 403 });
  return NextResponse.json({ data: result.data ?? null });
}

export async function PUT(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const projectId = typeof body.projectId === "string" ? body.projectId : null;
  const resolved = await resolveContext(request, projectId);
  if (!resolved.ok) return resolved.response;

  if (!validScene(body.scene)) {
    return NextResponse.json({ error: "architecture.scene.invalid" }, { status: 400 });
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : "Architecture scene";
  const result = await resolved.auth.database
    .from("architecture_scenes")
    .upsert({
      organization_id: resolved.auth.organizationId,
      project_id: resolved.projectId,
      user_id: resolved.auth.user.id,
      name,
      scene: body.scene,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,project_id" })
    .select("*")
    .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 403 });
  return NextResponse.json({ data: result.data });
}
