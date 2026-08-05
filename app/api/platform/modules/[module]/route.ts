import { NextRequest, NextResponse } from "next/server";
import { apiMeta, isPlatformModuleId, platformResource, type PlatformApiEnvelope } from "@yosseuf/platform";
import { authenticatedDatabase } from "@/lib/auth/authorized-workspace";
import { requestedOrganization } from "@/lib/organizations/context";
import { hasOrganizationPermission } from "@/lib/organizations/rbac";
import { listPlatformModuleRows } from "@/lib/platform/module-service";

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  const { module: value } = await params;
  if (!isPlatformModuleId(value) || !platformResource(value)) {
    return NextResponse.json({ error: "Unknown business module" }, { status: 404 });
  }
  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers));
  const meta = apiMeta(value, { organizationId: auth?.organizationId, requestId: request.headers.get("x-yosseuf-request-id") ?? undefined });
  if (!auth) {
    const body: PlatformApiEnvelope<never> = { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required", retryable: false }, meta };
    return NextResponse.json(body, { status: 401 });
  }
  if (!hasOrganizationPermission(auth.role, "business.read")) {
    const body: PlatformApiEnvelope<never> = { ok: false, error: { code: "FORBIDDEN", message: "Module access denied", retryable: false }, meta };
    return NextResponse.json(body, { status: 403 });
  }
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? "100");
  const result = await listPlatformModuleRows({ database: auth.database, moduleId: value, organizationId: auth.organizationId, limit: Number.isFinite(requestedLimit) ? requestedLimit : 100 });
  if (result.error) {
    const body: PlatformApiEnvelope<never> = { ok: false, error: { code: "MODULE_READ_FAILED", message: result.error.message, retryable: true }, meta: { ...meta, partial: true } };
    return NextResponse.json(body, { status: 503 });
  }
  const body: PlatformApiEnvelope<unknown[]> = { ok: true, data: result.data ?? [], meta };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
