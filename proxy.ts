import { NextRequest, NextResponse } from "next/server";
import { ORGANIZATION_HEADER } from "@/lib/organizations/context";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-yosseuf-request-id", request.headers.get("x-yosseuf-request-id") ?? crypto.randomUUID());
  const organization = request.headers.get(ORGANIZATION_HEADER);
  if (organization) headers.set(ORGANIZATION_HEADER, organization);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/api/platform/:path*", "/api/workspace/:path*", "/api/architecture/:path*"] };
