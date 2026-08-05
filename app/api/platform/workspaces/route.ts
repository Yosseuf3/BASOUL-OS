import { NextRequest, NextResponse } from "next/server";
import { authenticatedDatabase } from "@/lib/auth/authorized-workspace";
import { requestedOrganization } from "@/lib/organizations/context";
import { hasOrganizationPermission } from "@/lib/organizations/rbac";

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function GET(request: NextRequest) {
  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await auth.database.from("organization_workspaces").select("*").eq("organization_id", auth.organizationId).order("created_at");
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 200 });
}

export async function POST(request: NextRequest) {
  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasOrganizationPermission(auth.role, "workspace.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { name?: string; slug?: string };
  if (!body.name || !body.slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  const result = await auth.database.from("organization_workspaces").insert({
    organization_id: auth.organizationId, owner_id: auth.user.id, name: body.name.trim(), slug: body.slug.trim().toLowerCase(),
  }).select("*").single();
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 201 });
}
