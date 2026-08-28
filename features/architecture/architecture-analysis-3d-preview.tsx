'use client'

import { useMemo } from 'react'
import type { CloudPlanElement } from '../../lib/architecture/plan-understanding-service'
import { reconcileDetectedPlanElements, type DetectedPlanElement } from '../../packages/architecture-engine/src/reconciliation'
import { PascalRuntimeViewer } from './pascal-runtime-viewer'
import { normalizeReconciledSceneForPascal } from './pascal-reconciled-scene'

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

export function ArchitectureAnalysis3DPreview({ elements, drawingId }: { elements: CloudPlanElement[]; drawingId: string }) {
  const result = useMemo(() => {
    const detected = elements
      .filter((element) => element.drawing_id === drawingId)
      .map(asDetectedElement)
      .filter((element): element is DetectedPlanElement => Boolean(element))
    if (!detected.length) return null
    const reconciled = reconcileDetectedPlanElements(detected)
    return { ...reconciled, scene: normalizeReconciledSceneForPascal(reconciled.scene) }
  }, [drawingId, elements])

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
      <span><b>{result.diagnostics.filter((item) => item.severity === 'warning').length}</b> تحذيرات هندسية</span>
    </div>
    <PascalRuntimeViewer scene={result.scene} sceneKey={`analysis-${drawingId}-${elements.length}`} />
  </section>
}
