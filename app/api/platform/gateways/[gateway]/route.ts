import { NextRequest, NextResponse } from "next/server";
import { apiMeta } from "@yosseuf/platform";
import { authenticatedDatabase } from "@/lib/auth/authorized-workspace";
import { requestedOrganization } from "@/lib/organizations/context";
import { readGatewayStatus } from "@/lib/platform/gateway-service";

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await params;
  if (gateway !== "ai-core" && gateway !== "digital-human") return NextResponse.json({ error: "Unknown gateway" }, { status: 404 });
  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers));
  if (!auth) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required", retryable: false }, meta: apiMeta(gateway) }, { status: 401 });
  const status = await readGatewayStatus(gateway);
  return NextResponse.json({ ok: true, data: status, meta: apiMeta(gateway, { organizationId: auth.organizationId }) });
}
