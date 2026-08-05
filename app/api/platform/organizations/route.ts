import { NextRequest, NextResponse } from "next/server";
import { authenticatedDatabase } from "@/lib/auth/authorized-workspace";

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function GET(request: NextRequest) {
  const auth = await authenticatedDatabase(bearer(request));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const memberships = await auth.database.from("organization_memberships")
    .select("organization_id,role,status,organizations(id,name,slug)").eq("user_id", auth.user.id).eq("status", "active");
  return NextResponse.json(memberships.error ? { error: memberships.error.message } : { data: memberships.data }, { status: memberships.error ? 403 : 200 });
}

export async function POST(request: NextRequest) {
  const auth = await authenticatedDatabase(bearer(request));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { name?: string; slug?: string };
  if (!body.name || !body.slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  const created = await auth.database.rpc("create_organization", { organization_name: body.name, organization_slug: body.slug });
  return NextResponse.json(created.error ? { error: created.error.message } : { data: created.data }, { status: created.error ? 403 : 201 });
}
