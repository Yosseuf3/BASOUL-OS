import { NextRequest, NextResponse } from 'next/server'
import { authenticatedDatabase } from '@/lib/auth/authorized-workspace'
import { requestedOrganization } from '@/lib/organizations/context'

export const runtime = 'nodejs'
export const maxDuration = 10

/** Read-only private-service probe, subject to the same active tenant membership as ingestion. */
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  const organizationId = requestedOrganization(request.headers)
  if (!token || !organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const auth = await authenticatedDatabase(token, organizationId)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gateway = process.env.CAD_GATEWAY_URL?.trim()
  if (!gateway) return NextResponse.json({ error: 'architecture.cad.gateway_not_configured' }, { status: 503 })
  try {
    const response = await fetch(new URL('/health', gateway), {
      headers: process.env.CAD_GATEWAY_TOKEN ? { Authorization: `Bearer ${process.env.CAD_GATEWAY_TOKEN}` } : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    const health = response.ok ? await response.json() : null
    if (!health || health.ok !== true || health.dwg !== true || health.schema !== 'basoul.cad.v1') {
      return NextResponse.json({ error: 'architecture.cad.gateway_unhealthy' }, { status: 503 })
    }
    // Never forward internal addresses, environment values or arbitrary upstream fields.
    return NextResponse.json({ data: { ok: true, dwg: true, schema: 'basoul.cad.v1' } })
  } catch {
    return NextResponse.json({ error: 'architecture.cad.gateway_unreachable' }, { status: 503 })
  }
}
