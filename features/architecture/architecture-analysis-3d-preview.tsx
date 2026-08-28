'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import type { CloudPlanElement } from '../../lib/architecture/plan-understanding-service'
import { reconcileDetectedPlanElements, type DetectedPlanElement } from '../../packages/architecture-engine/src/reconciliation'
import type { ArchitectureScene } from '../../packages/architecture-engine/src'

const ArchitectureAnalysis3DRuntime = dynamic(
  () => import('./architecture-analysis-3d-runtime').then((module) => module.ArchitectureAnalysis3DRuntime),
  {
    ssr: false,
    loading: () => <div className="architecture-empty compact"><p>جارٍ تحميل محرك المعاينة ثلاثية الأبعاد…</p></div>,
  },
)

function asDetectedElement(element: CloudPlanElement): DetectedPlanElement | null {
  if (element.status === 'rejected') return null
  if (!['wall', 'opening', 'room', 'label', 'dimension'].includes(element.element_type)) return null
  return {
    id: element.id,
    element_type: element.element_type,
    label: element.label,
    value: element.value,
    unit: element.unit,
    confidence_score: element.confidence_score,
    geometry: element.geometry,
    notes: element.notes ?? undefined,
  }
}

type PreviewResult = {
  scene: ArchitectureScene
  acceptedElementIds: string[]
  reviewElementIds: string[]
  warningCount: number
} | null

export function ArchitectureAnalysis3DPreview({ elements, drawingId }: { elements: CloudPlanElement[]; drawingId: string }) {
  const [enabled, setEnabled] = useState(false)
  const calculation = useMemo<{ result: PreviewResult; error: string }>(() => {
    try {
      const detected = elements
        .filter((element) => element.drawing_id === drawingId)
        .map(asDetectedElement)
        .filter((element): element is DetectedPlanElement => Boolean(element))
      if (!detected.length) return { result: null, error: '' }
      const reconciled = reconcileDetectedPlanElements(detected)
      return {
        result: {
          scene: reconciled.scene,
          acceptedElementIds: reconciled.acceptedElementIds,
          reviewElementIds: reconciled.reviewElementIds,
          warningCount: reconciled.diagnostics.filter((item) => item.severity === 'warning').length,
        },
        error: '',
      }
    } catch (cause) {
      console.error('BASOUL geometry reconciliation failed', cause)
      return { result: null, error: 'تعذر إنشاء النموذج الهندسي من نتائج التحليل الحالية. يظل المخطط ونتائج المراجعة متاحين بالكامل.' }
    }
  }, [drawingId, elements])

  if (calculation.error) {
    return <section className="panel" aria-label="3D analysis preview unavailable">
      <div className="panel-head"><div><span className="section-kicker">03B · GEOMETRY RECONCILIATION</span><h2>المعاينة ثلاثية الأبعاد</h2></div><span>معزولة بأمان</span></div>
      <div className="architecture-empty compact"><p>{calculation.error}</p></div>
    </section>
  }

  const result = calculation.result
  if (!result) {
    return <section className="panel"><div className="architecture-empty compact"><p>لا توجد هندسة مؤكدة أو مكتشفة كافية لإنشاء نموذج ثلاثي الأبعاد بعد.</p></div></section>
  }

  const wallCount = Object.values(result.scene.nodes).filter((node) => node.type === 'wall').length
  const openingCount = Object.values(result.scene.nodes).filter((node) => node.type === 'door' || node.type === 'window').length

  return <section className="panel" aria-label="BASOUL reconciled 3D analysis preview">
    <div className="panel-head"><div><span className="section-kicker">03B · GEOMETRY RECONCILIATION</span><h2>النموذج الهندسي المستنتج</h2></div><span>{wallCount} جدار · {openingCount} فتحة</span></div>
    <p className="plan-understanding-intro">معاينة ثلاثية الأبعاد ناتجة من عناصر التحليل بعد المطابقة الهندسية. العناصر منخفضة الثقة تظل بحاجة إلى مراجعة بشرية قبل اعتمادها.</p>
    <div className="plan-inspector-summary">
      <span><b>{result.acceptedElementIds.length}</b> مقبول مبدئيًا</span>
      <span><b>{result.reviewElementIds.length}</b> يحتاج مراجعة</span>
      <span><b>{result.warningCount}</b> تحذيرات هندسية</span>
    </div>
    {!enabled
      ? <div className="architecture-empty compact"><p>تم تجهيز الهندسة. افتح المعاينة عند الحاجة حتى يبقى تبويب الذكاء المعماري خفيفًا ومستقرًا.</p><button className="primary" onClick={() => setEnabled(true)}>عرض النموذج ثلاثي الأبعاد</button></div>
      : <ArchitectureAnalysis3DRuntime scene={result.scene} drawingId={drawingId} elementCount={elements.length} />}
  </section>
}
