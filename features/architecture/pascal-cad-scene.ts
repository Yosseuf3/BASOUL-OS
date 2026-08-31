import type { ArchitectureScene } from '../../packages/architecture-engine/src'
import type { CadFloorGraph, NormalizedCadDocument } from '../../packages/cad-ingestion/src'
import { buildNativePascalCadScene, type PascalSemanticCadDiagnostics } from './pascal-cad-semantic-scene'

export interface PascalCadSceneResult {
  ready: boolean
  graph: CadFloorGraph
  scene: ArchitectureScene | null
  diagnostics: PascalSemanticCadDiagnostics | null
  reason: string | null
}

export function buildPascalSceneFromCad(document: NormalizedCadDocument): PascalCadSceneResult {
  const result = buildNativePascalCadScene(document)
  if (!result.scene || !result.graph.gate.ready) {
    return {
      ready: false,
      graph: result.graph,
      scene: null,
      diagnostics: result.diagnostics,
      reason: result.reason ?? result.graph.gate.reasons.join('; ') || 'CAD geometry gate did not pass.',
    }
  }

  return {
    ready: true,
    graph: result.graph,
    scene: result.scene,
    diagnostics: result.diagnostics,
    reason: null,
  }
}
