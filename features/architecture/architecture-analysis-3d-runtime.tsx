'use client'

import { Component, type ErrorInfo, type ReactNode, useMemo } from 'react'
import type { ArchitectureScene } from '../../packages/architecture-engine/src'
import { normalizeReconciledSceneForPascal } from './pascal-reconciled-scene'
import { PascalRuntimeViewer } from './pascal-runtime-viewer'

class PascalPreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BASOUL Pascal preview failed', error, info)
  }

  render() {
    if (this.state.failed) {
      return <div className="architecture-empty compact"><p>تعذر تشغيل محرك Pascal لهذا النموذج. لم يتأثر المخطط أو نتائج التحليل ويمكن متابعة المراجعة بصورة طبيعية.</p></div>
    }
    return this.props.children
  }
}

function runtimeScene(scene: ArchitectureScene) {
  const allowedIds = new Set(
    Object.values(scene.nodes)
      .filter((node) => ['site', 'building', 'level', 'wall', 'door', 'window'].includes(String(node.type)))
      .map((node) => node.id),
  )

  const nodes = Object.fromEntries(
    Object.entries(scene.nodes)
      .filter(([id]) => allowedIds.has(id))
      .map(([id, node]) => {
        const parentId = typeof node.parentId === 'string' && allowedIds.has(node.parentId) ? node.parentId : null
        const children = Array.isArray(node.children)
          ? node.children.filter((child): child is string => typeof child === 'string' && allowedIds.has(child))
          : undefined
        return [id, { ...node, parentId, ...(children ? { children } : {}) }]
      }),
  )

  return {
    ...scene,
    nodes,
    rootNodeIds: scene.rootNodeIds.filter((id) => allowedIds.has(id)),
  }
}

export function ArchitectureAnalysis3DRuntime({ scene, drawingId, elementCount }: { scene: ArchitectureScene; drawingId: string; elementCount: number }) {
  const prepared = useMemo(() => {
    try {
      const filtered = runtimeScene(scene)
      return { scene: normalizeReconciledSceneForPascal(filtered), error: '' }
    } catch (cause) {
      console.error('BASOUL Pascal scene normalization failed', cause)
      return { scene: null, error: 'تعذر تحويل بعض العناصر المكتشفة إلى هندسة Pascal صالحة. يمكنك متابعة مراجعة المخطط وتصحيح العناصر ثم إعادة فتح المعاينة.' }
    }
  }, [scene])

  if (!prepared.scene) {
    return <div className="architecture-empty compact"><p>{prepared.error}</p></div>
  }

  return <PascalPreviewBoundary>
    <PascalRuntimeViewer scene={prepared.scene} sceneKey={`analysis-${drawingId}-${elementCount}`} />
  </PascalPreviewBoundary>
}
