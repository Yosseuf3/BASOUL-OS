'use client'

import { Box, CheckCircle2, FileUp, Network, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  buildCadFloorGraph,
  summarizeCadDocument,
  summarizeCadLayers,
  type CadFloorGraph,
  type NormalizedCadDocument,
} from '@/packages/cad-ingestion/src'
import type { ArchitectureScene } from '@/packages/architecture-engine/src'
import { buildPascalSceneFromCad } from './pascal-cad-scene'
import type { PascalSemanticCadDiagnostics } from './pascal-cad-semantic-scene'

type TextFn = (ar: string, en: string) => string
type Stage = 'idle' | 'uploaded' | 'parsing' | 'classified' | 'graph' | 'materializing' | 'ready' | 'degraded' | 'blocked' | 'error'

type Props = {
  projectId: string
  text: TextFn
  onSceneReady: (scene: ArchitectureScene, message: string) => void
}

export function CadReviewPanel({ projectId, text, onSceneReady }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [message, setMessage] = useState('')
  const [document, setDocument] = useState<NormalizedCadDocument | null>(null)
  const [pascalDiagnostics, setPascalDiagnostics] = useState<PascalSemanticCadDiagnostics | null>(null)

  const summary = useMemo(() => document ? summarizeCadDocument(document) : null, [document])
  const layerDiagnostics = useMemo(() => document ? summarizeCadLayers(document) : [], [document])
  const graph = useMemo(() => document ? buildCadFloorGraph(document) : null, [document])

  function materializePascalScene(source: NormalizedCadDocument, scrollToViewer = false) {
    setStage('materializing')
    const result = buildPascalSceneFromCad(source)
    setPascalDiagnostics(result.diagnostics)

    if (!result.ready || !result.scene || !result.graph.gate.ready) {
      setStage('blocked')
      setMessage(text(
        `تم إيقاف 3D لأن هندسة CAD الأساسية لم تجتز البوابة: ${result.reason ?? 'فشل بوابة المشهد.'}`,
        `3D blocked because core CAD geometry did not pass the gate: ${result.reason ?? 'Scene gate failed.'}`,
      ))
      return false
    }

    const degraded = Boolean(result.diagnostics?.degraded)
    const unresolved = result.diagnostics?.floatingOpenings ?? 0
    onSceneReady(
      result.scene,
      degraded
        ? text(
            `تم إنشاء 3D من نفس هندسة CAD الموثقة. توجد ${unresolved} فتحة غير محلولة ولم يتم اختلاق موقع لها؛ يمكن حفظ المشهد ومتابعة التصحيح.`,
            `3D was created from the same verified CAD geometry. ${unresolved} opening(s) remain unresolved and were not fabricated; the scene can be saved and corrected.`
          )
        : text(
            'تم إنشاء Pascal 3D مباشرة من نفس ملف CAD بنجاح. احفظ المشهد لتخزينه في المشروع.',
            'Pascal 3D was created directly from the same CAD file. Save the scene to persist it for the project.'
          ),
    )
    setStage(degraded ? 'degraded' : 'ready')
    setMessage(
      degraded
        ? text(
            `3D جاهز بحالة DEGRADED: الجدران موثقة بالكامل، و${unresolved} فتحة غير محلولة معروضة في التشخيص.`,
            `3D is ready in DEGRADED state: walls are fully verified and ${unresolved} unresolved opening(s) are reported in diagnostics.`
          )
        : text('3D جاهز من نفس مصدر CAD.', '3D is ready from the same CAD source.')
    )

    if (scrollToViewer && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.document.getElementById('architecture-3d-runtime')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    return true
  }

  async function uploadCad(file: File) {
    if (!projectId) return
    setStage('uploaded')
    setMessage(text('تم استلام الملف محليًا.', 'File received locally.'))
    setPascalDiagnostics(null)
    try {
      let parsed: NormalizedCadDocument
      if (file.name.toLowerCase().endsWith('.json')) {
        setStage('parsing')
        parsed = JSON.parse(await file.text()) as NormalizedCadDocument
        if (parsed.schema !== 'basoul.cad.v1' || !Array.isArray(parsed.entities)) throw new Error('architecture.cad.invalid_normalized_document')
      } else {
        setStage('parsing')
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        const token = data.session?.access_token
        if (!token) throw new Error('architecture.auth.required')
        const form = new FormData()
        form.set('projectId', projectId)
        form.set('file', file)
        const response = await fetch('/api/architecture/cad/ingest', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          cache: 'no-store',
        })
        const body = await response.json() as { data?: NormalizedCadDocument; error?: string }
        if (!response.ok || !body.data) throw new Error(body.error || `architecture.cad.ingest_failed.${response.status}`)
        parsed = body.data
      }

      setDocument(parsed)
      setStage('classified')
      const nextGraph = buildCadFloorGraph(parsed)
      setStage('graph')
      if (nextGraph.gate.ready) {
        materializePascalScene(parsed)
      } else {
        setStage('blocked')
        setMessage(text(`تم إيقاف 3D: ${nextGraph.gate.reasons.join(' · ')}`, `3D blocked: ${nextGraph.gate.reasons.join(' · ')}`))
      }
    } catch (error) {
      setDocument(null)
      setPascalDiagnostics(null)
      setStage('error')
      setMessage(error instanceof Error ? error.message : 'architecture.cad.ingest_failed')
    }
  }

  function openIn3D() {
    if (!document) return
    materializePascalScene(document, true)
  }

  return (
    <section className="bx-panel" aria-label={text('مراجعة ملفات CAD', 'CAD review')}>
      <header className="bx-panel-head">
        <div><span className="bx-kicker">CAD REVIEW · DWG / DXF</span><h3>{text('مراجعة المخطط قبل 3D', 'Review the plan before 3D')}</h3></div>
        <span className="bx-chip">{stageLabel(stage)}</span>
      </header>

      <div style={{ display: 'grid', gap: 14 }}>
        <label style={{ display: 'grid', gap: 8, border: '1px dashed rgba(120,160,255,.35)', borderRadius: 14, padding: 16, cursor: projectId ? 'pointer' : 'not-allowed' }}>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><FileUp size={18} /> {text('رفع DWG أو DXF', 'Upload DWG or DXF')}</span>
          <small>{text('يتم التحليل عبر BASOUL CAD Gateway المعزول، ثم يبنى 2D و3D من نفس المستند المطبّع.', 'Analysis runs through the isolated BASOUL CAD Gateway, then 2D and 3D are built from the same normalized document.')}</small>
          <input type="file" accept=".dwg,.dxf,.json,application/json" disabled={!projectId || stage === 'parsing' || stage === 'materializing'} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCad(file) }} />
        </label>

        {message && <p aria-live="polite">{message}</p>}

        {summary && graph && document && <>
          <div aria-label={text('مصدر مخطط CAD', 'CAD source provenance')}>
            <p>{text('الملف المصدر', 'Source file')}: {document.source.filename}</p>
            <p style={{ overflowWrap: 'anywhere' }}>SHA-256: <code>{document.source.sha256 ?? text('بصمة المصدر غير متاحة', 'Source fingerprint unavailable')}</code></p>
          </div>
          <div className="bx-grid-2">
            <Metric icon={<Box size={18} />} label={text('العناصر', 'Entities')} value={summary.entities} />
            <Metric icon={<Network size={18} />} label={text('الطبقات', 'Layers')} value={summary.layers} />
            <Metric icon={<Network size={18} />} label={text('حواف الجدران', 'Wall edges')} value={graph.gate.wallSegments} />
            <Metric icon={<Network size={18} />} label={text('التقاطعات', 'Junctions')} value={graph.gate.junctions} />
            <Metric icon={graph.gate.ready ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />} label="HOST RATIO" value={`${Math.round(graph.gate.hostRatio * 1000) / 10}%`} />
          </div>
          <CadLayerDiagnostics diagnostics={layerDiagnostics} text={text} />
          <CadFloorGraphOverlay graph={graph} document={document} />
          <div className="bx-actions" style={{ margin: 0 }}>
            <button type="button" onClick={openIn3D} disabled={!graph.gate.ready || stage === 'materializing'}><Box size={16} /> {text('عرض المشهد في 3D', 'View scene in 3D')}</button>
          </div>
          {pascalDiagnostics && <PascalAcceptanceDiagnostics diagnostics={pascalDiagnostics} text={text} />}
        </>}
      </div>
    </section>
  )
}

function CadLayerDiagnostics({ diagnostics, text }: { diagnostics: ReturnType<typeof summarizeCadLayers>; text: TextFn }) {
  if (!diagnostics.length) return null
  return <section aria-label={text('تشخيص قراءة الطبقات', 'Layer reading diagnostics')} style={{ display: 'grid', gap: 10 }}>
    <div className="bx-panel-head" style={{ margin: 0 }}>
      <div><span className="bx-kicker">CAD LAYERS · NORMALIZED</span><h3>{text('تشخيص قراءة الطبقات', 'Layer reading diagnostics')}</h3></div>
      <span className="bx-chip">{diagnostics.length} LAYERS</span>
    </div>
    <div style={{ overflowX: 'auto', border: '1px solid rgba(120,160,255,.2)', borderRadius: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead><tr>
          <th style={cellStyle}>{text('الطبقة الأصلية', 'Raw layer')}</th>
          <th style={cellStyle}>{text('بعد التطبيع', 'Normalized')}</th>
          <th style={cellStyle}>{text('العناصر', 'Entities')}</th>
          <th style={cellStyle}>{text('النوع الغالب', 'Dominant kind')}</th>
          <th style={cellStyle}>{text('الثقة', 'Confidence')}</th>
          <th style={cellStyle}>{text('أنواع CAD', 'CAD types')}</th>
        </tr></thead>
        <tbody>{diagnostics.map((layer) => <tr key={layer.rawLayerName}>
          <td style={cellStyle}><code>{layer.rawLayerName}</code></td>
          <td style={cellStyle}><code>{layer.normalizedLayerName || '0'}</code></td>
          <td style={cellStyle}>{layer.entityCount}</td>
          <td style={cellStyle}>{layer.dominantKind.toUpperCase()}</td>
          <td style={cellStyle}>{layer.entityCount ? `${Math.round(layer.averageConfidence * 100)}%` : '—'}</td>
          <td style={cellStyle}>{Object.entries(layer.entityTypes).map(([kind, count]) => `${kind}:${count}`).join(' · ') || '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>
}

const cellStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid rgba(120,160,255,.14)', textAlign: 'start', verticalAlign: 'top' }

function PascalAcceptanceDiagnostics({ diagnostics, text }: { diagnostics: PascalSemanticCadDiagnostics; text: TextFn }) {
  const wallReady = diagnostics.missingCadWallEntities === 0 && diagnostics.graphEdgeCoverage === 1
  const status = !wallReady ? 'BLOCKED' : diagnostics.degraded ? 'DEGRADED' : 'PASS'
  return <section aria-label={text('تشخيص قبول Pascal 3D', 'Pascal 3D acceptance diagnostics')} style={{ display: 'grid', gap: 12 }}>
    <div className="bx-panel-head" style={{ margin: 0 }}>
      <div><span className="bx-kicker">PASCAL 3D · UNIFIED CAD RUNTIME</span><h3>{text('تشخيص التحويل إلى 3D', '3D materialization diagnostics')}</h3></div>
      <span className="bx-chip">PASCAL · {status}</span>
    </div>
    <div className="bx-grid-2">
      <Metric icon={<Network size={18} />} label={text('جدران Pascal', 'Pascal walls')} value={diagnostics.walls} />
      <Metric icon={<Box size={18} />} label={text('الأبواب', 'Doors')} value={`${diagnostics.doors}/${diagnostics.expectedDoors}`} />
      <Metric icon={<Box size={18} />} label={text('النوافذ', 'Windows')} value={`${diagnostics.windows}/${diagnostics.expectedWindows}`} />
      <Metric icon={<CheckCircle2 size={18} />} label={text('الفتحات المستضافة', 'Hosted openings')} value={diagnostics.hostedOpenings} />
      <Metric icon={diagnostics.floatingOpenings === 0 ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />} label={text('فتحات غير محلولة', 'Unresolved openings')} value={diagnostics.floatingOpenings} />
      <Metric icon={<Box size={18} />} label={text('الغرف الدلالية', 'Semantic rooms')} value={diagnostics.semanticRooms} />
      <Metric icon={<Box size={18} />} label={text('أرضيات الغرف', 'Room slabs')} value={diagnostics.roomSlabs} />
      <Metric icon={wallReady ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />} label={text('تغطية حواف الجدران', 'Wall edge coverage')} value={`${Math.round(diagnostics.graphEdgeCoverage * 1000) / 10}%`} />
    </div>
  </section>
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="bx-card blue"><div className="bx-icon">{icon}</div><span className="bx-kicker">{label}</span><h3>{value}</h3></article>
}

type CadOpeningEntity = NormalizedCadDocument['entities'][number]
type InsertBounds2D = { min?: { x?: number; y?: number }; max?: { x?: number; y?: number } }
type NativeInsertPrimitive2D = { type?: string; points?: Array<{ x?: number; y?: number }> }

function readNativeInsertGeometry(entity: CadOpeningEntity) {
  const raw = entity.metadata?.insertGeometry
  if (!Array.isArray(raw)) return [] as NativeInsertPrimitive2D[]
  return raw.filter((item): item is NativeInsertPrimitive2D => Boolean(item && typeof item === 'object'))
}

function CadFloorGraphOverlay({ graph, document }: { graph: CadFloorGraph; document: NormalizedCadDocument }) {
  const bounds = useMemo(() => {
    if (!graph.vertices.length) return { minX: 0, minY: 0, width: 1, height: 1 }
    const xs = graph.vertices.map((v) => v.x), ys = graph.vertices.map((v) => v.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    return { minX, minY, width: Math.max(maxX - minX, 1e-6), height: Math.max(maxY - minY, 1e-6) }
  }, [graph.vertices])
  const byId = useMemo(() => new Map(graph.vertices.map((v) => [v.id, v])), [graph.vertices])
  const entitiesById = useMemo(() => new Map(document.entities.map((entity) => [entity.id, entity])), [document.entities])
  const sx = (x: number) => 20 + ((x - bounds.minX) / bounds.width) * 960
  const sy = (y: number) => 620 - ((y - bounds.minY) / bounds.height) * 600

  return <div style={{ overflow: 'hidden', border: '1px solid rgba(120,160,255,.2)', borderRadius: 14 }}>
    <svg viewBox="0 0 1000 640" role="img" aria-label="CAD floor graph overlay with doors and windows" style={{ width: '100%', display: 'block' }}>
      {graph.rooms.map((room) => <polygon key={room.id} points={room.vertexIds.map((id) => { const v = byId.get(id)!; return `${sx(v.x)},${sy(v.y)}` }).join(' ')} fill="rgba(72,190,255,.08)" stroke="rgba(72,190,255,.4)" strokeWidth="1" />)}
      {graph.edges.map((edge) => { const a = byId.get(edge.a), b = byId.get(edge.b); if (!a || !b) return null; return <line key={edge.id} x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)} stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /> })}
      <g data-cad-opening-overlay="true">
        {graph.openings.map((opening) => {
          const entity = entitiesById.get(opening.entityId)
          if (!entity) return null
          return <CadOpening2D key={`${opening.kind}:${opening.entityId}`} entity={entity} kind={opening.kind} sx={sx} sy={sy} />
        })}
      </g>
      {graph.vertices.filter((v) => v.degree >= 3).map((v) => <circle key={v.id} cx={sx(v.x)} cy={sy(v.y)} r="3.5" fill="currentColor" />)}
    </svg>
  </div>
}

function CadOpening2D({ entity, kind, sx, sy }: { entity: CadOpeningEntity; kind: 'door' | 'window'; sx: (x: number) => number; sy: (y: number) => number }) {
  const stroke = kind === 'door' ? '#f59e0b' : '#38bdf8'
  const nativeGeometry = readNativeInsertGeometry(entity)
  if (nativeGeometry.length) {
    return <g data-cad-native-opening={kind} data-cad-entity-id={entity.id}>
      {nativeGeometry.map((primitive, index) => {
        const primitivePoints = Array.isArray(primitive.points)
          ? primitive.points.filter((point) => typeof point?.x === 'number' && typeof point?.y === 'number')
          : []
        if (primitivePoints.length < 2) return null
        return <polyline
          key={`${entity.id}:native:${index}`}
          points={primitivePoints.map((point) => `${sx(point.x as number)},${sy(point.y as number)}`).join(' ')}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        ><title>{`${kind.toUpperCase()} · ${entity.id} · native CAD ${primitive.type ?? 'primitive'}`}</title></polyline>
      })}
    </g>
  }

  const points = Array.isArray(entity.points)
    ? entity.points.filter((point) => typeof point?.x === 'number' && typeof point?.y === 'number')
    : []

  if (points.length >= 2) {
    return <polyline
      points={points.map((point) => `${sx(point.x)},${sy(point.y)}`).join(' ')}
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    ><title>{`${kind.toUpperCase()} · ${entity.id} · CAD geometry`}</title></polyline>
  }

  const rawBounds = entity.metadata?.insertBounds
  const insertBounds = rawBounds && typeof rawBounds === 'object' ? rawBounds as InsertBounds2D : null
  const minX = insertBounds?.min?.x
  const minY = insertBounds?.min?.y
  const maxX = insertBounds?.max?.x
  const maxY = insertBounds?.max?.y
  if ([minX, minY, maxX, maxY].every((value) => typeof value === 'number' && Number.isFinite(value))) {
    const x1 = sx(minX as number), x2 = sx(maxX as number)
    const y1 = sy(minY as number), y2 = sy(maxY as number)
    return <rect
      x={Math.min(x1, x2)}
      y={Math.min(y1, y2)}
      width={Math.max(Math.abs(x2 - x1), 3)}
      height={Math.max(Math.abs(y2 - y1), 3)}
      rx="2"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      vectorEffect="non-scaling-stroke"
    ><title>{`${kind.toUpperCase()} · ${entity.id} · CAD INSERT bounds`}</title></rect>
  }

  const point = entity.insert ?? points[0]
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return null
  const x = sx(point.x), y = sy(point.y)
  return <g transform={`translate(${x} ${y})`}>
    <circle r="7" fill="rgba(15,23,42,.9)" stroke={stroke} strokeWidth="3" vectorEffect="non-scaling-stroke" />
    <line x1="-5" y1="0" x2="5" y2="0" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    <line x1="0" y1="-5" x2="0" y2="5" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    <title>{`${kind.toUpperCase()} · ${entity.id} · CAD insertion point`}</title>
  </g>
}

function stageLabel(stage: Stage) {
  if (stage === 'uploaded') return 'CAD · UPLOADED'
  if (stage === 'parsing') return 'CAD · PARSING'
  if (stage === 'classified') return 'CAD · CLASSIFIED'
  if (stage === 'graph') return 'CAD · FLOOR GRAPH'
  if (stage === 'materializing') return '3D · MATERIALIZING'
  if (stage === 'ready') return '3D · READY'
  if (stage === 'degraded') return '3D · DEGRADED'
  if (stage === 'blocked') return '3D · BLOCKED'
  if (stage === 'error') return 'CAD · ERROR'
  return 'CAD · IDLE'
}
