import { NextRequest, NextResponse } from 'next/server'
import { authenticatedDatabase } from '@/lib/auth/authorized-workspace'
import { requestedOrganization } from '@/lib/organizations/context'
import type { NormalizedCadDocument } from '@/packages/cad-ingestion/src'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_CAD_BYTES = 25 * 1024 * 1024
const allowedExtensions = new Set(['dwg', 'dxf'])

function bearer(request: NextRequest) {
  const value = request.headers.get('authorization') ?? ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

function validUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f-]{36}$/i.test(value))
}

function extension(filename: string) {
  return filename.toLowerCase().split('.').pop() ?? ''
}

function isNormalizedCadDocument(value: unknown): value is NormalizedCadDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const doc = value as Record<string, unknown>
  return doc.schema === 'basoul.cad.v1' && Array.isArray(doc.layers) && Array.isArray(doc.blocks) && Array.isArray(doc.entities)
}

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const projectId = typeof form.get('projectId') === 'string' ? String(form.get('projectId')) : null
  const upload = form.get('file')

  if (!validUuid(projectId)) return NextResponse.json({ error: 'architecture.project.invalid' }, { status: 400 })
  if (!(upload instanceof File)) return NextResponse.json({ error: 'architecture.cad.file_required' }, { status: 400 })
  if (!allowedExtensions.has(extension(upload.name))) return NextResponse.json({ error: 'architecture.cad.unsupported_format' }, { status: 415 })
  if (upload.size <= 0 || upload.size > MAX_CAD_BYTES) return NextResponse.json({ error: 'architecture.cad.file_size_invalid' }, { status: 413 })

  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await auth.database
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle()

  if (project.error || !project.data) return NextResponse.json({ error: 'architecture.project.not_found' }, { status: 404 })

  const gatewayUrl = process.env.CAD_GATEWAY_URL?.trim()
  if (!gatewayUrl) return NextResponse.json({ error: 'architecture.cad.gateway_not_configured' }, { status: 503 })

  const gatewayForm = new FormData()
  gatewayForm.set('file', upload, upload.name)
  gatewayForm.set('projectId', projectId)
  gatewayForm.set('organizationId', auth.organizationId)

  let response: Response
  try {
    response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: process.env.CAD_GATEWAY_TOKEN ? { Authorization: `Bearer ${process.env.CAD_GATEWAY_TOKEN}` } : undefined,
      body: gatewayForm,
      cache: 'no-store',
      signal: AbortSignal.timeout(55_000),
    })
  } catch {
    return NextResponse.json({ error: 'architecture.cad.gateway_unreachable' }, { status: 502 })
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return NextResponse.json({ error: 'architecture.cad.gateway_failed', detail: detail.slice(0, 500) }, { status: 502 })
  }

  const payload = await response.json().catch(() => null)
  const data = payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: unknown }).data : payload
  if (!isNormalizedCadDocument(data)) return NextResponse.json({ error: 'architecture.cad.gateway_invalid_response' }, { status: 502 })

  return NextResponse.json({ data })
}
