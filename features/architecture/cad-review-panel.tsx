'use client'

import { Box, CheckCircle2, FileUp, Network, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  buildCadFloorGraph,
  summarizeCadDocument,
  type CadFloorGraph,
  type NormalizedCadDocument,
} from '@/packages/cad-ingestion/src'
import type { ArchitectureScene } from '@/packages/architecture-engine/src'
import { buildPascalSceneFromCad } from './pascal-cad-scene'
import type { PascalSemanticCadDiagnostics } from './pascal-cad-semantic-scene'

type TextFn = (ar: string, en: string) => string
type Stage = 'idle' | 'uploaded' | 'parsing' | 'classified' | 'graph' | 'ready' | 'blocked' | 'error'

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
  const graph = useMemo(() => document ? buildCadFloorGraph(document) : null, [document])

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
        setStage('ready')
        setMessage(text('نجح CAD Geometry Gate. المشهد جاهز للمراجعة ثم 3D.', 'CAD Geometry Gate passed. The scene is ready for review and 3D.'))
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
    const result = buildPascalSceneFromCad(document)
    setPascalDiagnostics(result.diagnostics)
    if (!result.ready || !result.scene || !result.graph.gate.ready) {
      setStage('blocked')
      setMessage(text(
        `تم إيقاف Pascal v2.3: ${result.reason ?? 'فشل بوابة المشهد الدلالي.'}`,
        `Pascal v2.3 blocked: ${result.reason ?? 'Semantic scene gate failed.'}`,
      ))
      return
    }
    onSceneReady(result.scene, text('نجحت بوابة Pascal 3D v2.3 وتم إنشاء المشهد الدلالي الأصلي. احفظ المشهد لتخزينه في المشروع.', 'Pascal 3D v2.3 gate passed and the native semantic scene was created. Save the scene to persist it for the project.'))
    setMessage(text('Pascal 3D v2.3 جاهز: جميع الفتحات مستضافة والغرف الدلالية مادية داخل المشهد.', 'Pascal 3D v2.3 ready: all openings are hosted and semantic rooms are materialized in the scene.'))
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
          <small>{text('يتم التحليل عبر BASOUL CAD Gateway المعزول. يمكن تحميل basoul.cad.v1 JSON للاختبار المحلي.', 'Analysis runs through the isolated BASOUL CAD Gateway. basoul.cad.v1 JSON can be loaded for local testing.')}</small>
          <input type="file" accept=".dwg,.dxf,.json,application/json" disabled={!projectId || stage === 'parsing'} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCad(file) }} />
        </label>

        {message && <p aria-live="polite">{message}</p>}

        {summary && graph && <>
          <div className="bx-grid-2">
            <Metric icon={<Box size={18} />} label={text('العناصر', 'Entities')} value={summary.entities} />
            <Metric icon={<Network size={18} />} label={text('حواف الجدران', 'Wall edges')} value={graph.gate.wallSegments} />
            <Metric icon={<Network size={18} />} label={text('التقاطعات', 'Junctions')} value={graph.gate.junctions} />
            <Metric icon={graph.gate.ready ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />} label="HOST RATIO" value={`${Math.round(graph.gate.hostRatio * 1000) / 10}%`} />
          </div>
          <CadFloorGraphOverlay graph={graph} />
          <div className="bx-actions" style={{ margin: 0 }}>
            <button type="button" onClick={openIn3D} disabled={!graph.gate.ready}><Box size={16} /> {text('فتح المشهد في 3D', 'Open scene in 3D')}</button>
          </div>
          {pascalDiagnostics && <PascalAcceptanceDiagnostics diagnostics={pascalDiagnostics} text={text} />}
        </>}
      </div>
    </section>
  )
}

function PascalAcceptanceDiagnostics({ diagnostics, text }: { diagnostics: PascalSemanticCadDiagnostics; text: TextFn }) {
  const pass = diagnostics.floatingOpenings === 0 && diagnostics.hostedOpenings === diagnostics.doors + diagnostics.windows && diagnostics.semanticRooms === diagnostics.roomSlabs
  return <section aria-label={text('تشخيص قبول Pascal 3D', 'Pascal 3D acceptance diagnostics')} style={{ display: 'grid', gap: 12 }}>
    <div className="bx-panel-head" style={{ margin: 0 }}>
      <div><span className="bx-kicker">PASCAL 3D · SEMANTIC v2.3</span><h3>{text('بوابة القبول الحية', 'Live acceptance gate')}</h3></div>
      <span className="bx-chip">{pass ? 'PASCAL v2.3 · PASS' : 'PASCAL v2.3 · BLOCKED'}</span>
    </div>
    <div className="bx-grid-2">
      <Metric icon={<Network size={18} />} label={text('جدران Pascal', 'Pascal walls')} value={diagnostics.walls} />
      <Metric icon={<Box size={18} />} label={text('الأبواب', 'Doors')} value={diagnostics.doors} />
      <Metric icon={<Box size={18} />} label={text('النوافذ', 'Windows')} value={diagnostics.windows} />
      <Metric icon={<CheckCircle2 size={18} />} label={text('الفتحات المستضافة', 'Hosted openings')} value={diagnostics.hostedOpenings} />
      <Metric icon={diagnostics.floatingOpenings === 0 ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />} label={text('فتحات طافية', 'Floating openings')} value={diagnostics.floatingOpenings} />
      <Metric icon={<Box size={18} />} label={text('الغرف الدلالية', 'Semantic rooms')} value={diagnostics.semanticRooms} />
      <Metric icon={<Box size={18} />} label={text('أرضيات الغرف', 'Room slabs')} value={diagnostics.roomSlabs} />
    </div>
  </section>
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="bx-card blue"><div className="bx-icon">{icon}</div><span className="bx-kicker">{label}</span><h3>{value}</h3></article>
}

function CadFloorGraphOverlay({ graph }: { graph: CadFloorGraph }) {
  const bounds = useMemo(() => {
    if (!graph.vertices.length) return { minX: 0, minY: 0, width: 1, height: 1 }
    const xs = graph.vertices.map((v) => v.x), ys = graph.vertices.map((v) => v.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    return { minX, minY, width: Math.max(maxX - minX, 1e-6), height: Math.max(maxY - minY, 1e-6) }
  }, [graph.vertices])
  const byId = useMemo(() => new Map(graph.vertices.map((v) => [v.id, v])), [graph.vertices])
  const sx = (x: number) => 20 + ((x - bounds.minX) / bounds.width) * 960
  const sy = (y: number) => 620 - ((y - bounds.minY) / bounds.height) * 600

  return <div style={{ overflow: 'auto', border: '1px solid rgba(120,160,255,.2)', borderRadius: 14 }}>
    <svg viewBox="0 0 1000 640" role="img" aria-label="CAD floor graph overlay" style={{ width: '100%', minWidth: 620, display: 'block' }}>
      {graph.rooms.map((room) => <polygon key={room.id} points={room.vertexIds.map((id) => { const v = byId.get(id)!; return `${sx(v.x)},${sy(v.y)}` }).join(' ')} fill="rgba(72,190,255,.08)" stroke="rgba(72,190,255,.4)" strokeWidth="1" />)}
      {graph.edges.map((edge) => { const a = byId.get(edge.a), b = byId.get(edge.b); if (!a || !b) return null; return <line key={edge.id} x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)} stroke="currentColor" strokeWidth="2" /> })}
      {graph.vertices.filter((v) => v.degree >= 3).map((v) => <circle key={v.id} cx={sx(v.x)} cy={sy(v.y)} r="3.5" fill="currentColor" />)}
    </svg>
  </div>
}

function stageLabel(stage: Stage) {
  if (stage === 'uploaded') return 'CAD · UPLOADED'
  if (stage === 'parsing') return 'CAD · PARSING'
  if (stage === 'classified') return 'CAD · CLASSIFIED'
  if (stage === 'graph') return 'CAD · FLOOR GRAPH'
  if (stage === 'ready') return 'CAD · 3D READY'
  if (stage === 'blocked') return 'CAD · 3D BLOCKED'
  if (stage === 'error') return 'CAD · ERROR'
  return 'CAD · IDLE'
}
