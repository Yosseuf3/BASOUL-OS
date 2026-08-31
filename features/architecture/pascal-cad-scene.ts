import type { ArchitectureScene } from '../../packages/architecture-engine/src'
import type { CadFloorGraph, NormalizedCadDocument } from '../../packages/cad-ingestion/src'
import { applySemanticRoomsToScene, cadDocumentToPascalReadyScene } from '../../packages/cad-ingestion/src'
import { normalizeReconciledSceneForPascal } from './pascal-reconciled-scene'

export interface PascalCadSceneResult {
  ready: boolean
  graph: CadFloorGraph
  scene: ArchitectureScene | null
  reason: string | null
}

export function buildPascalSceneFromCad(document: NormalizedCadDocument): PascalCadSceneResult {
  const { graph, scene } = cadDocumentToPascalReadyScene(document)
  if (!scene || !graph.gate.ready) {
    return {
      ready: false,
      graph,
      scene: null,
      reason: graph.gate.reasons.join('; ') || 'CAD geometry gate did not pass.',
    }
  }

  const semantic = applySemanticRoomsToScene(scene, document)
  return {
    ready: true,
    graph,
    scene: normalizeReconciledSceneForPascal(semantic.scene),
    reason: null,
  }
}
