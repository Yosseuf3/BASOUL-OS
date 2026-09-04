import type { CadFloorGraph } from '../../packages/cad-ingestion/src'
import type { CadWallThicknessAnalysis } from './cad-wall-thickness'

export interface CadOpeningTopologyRecord {
  entityId: string
  kind: 'door' | 'window'
  hostEdgeId: string | null
  hostThickness: number | null
  hostThicknessConfidence: number | null
  status: 'hosted' | 'hosted-with-depth' | 'unresolved'
}

export interface CadOpeningTopologyAnalysis {
  records: CadOpeningTopologyRecord[]
  total: number
  hosted: number
  hostedWithDepth: number
  unresolved: number
  depthCoverage: number
}

export function analyzeCadOpeningTopology(graph: CadFloorGraph, wallThickness: CadWallThicknessAnalysis): CadOpeningTopologyAnalysis {
  const thicknessByEdge = new Map<string, { thickness: number; confidence: number }>()
  for (const pair of wallThickness.pairs) {
    if (pair.confidence < 0.85) continue
    if (!Number.isFinite(pair.thickness) || pair.thickness < 0.05 || pair.thickness > 1) continue
    thicknessByEdge.set(pair.edgeId, { thickness: pair.thickness, confidence: pair.confidence })
    thicknessByEdge.set(pair.pairedEdgeId, { thickness: pair.thickness, confidence: pair.confidence })
  }

  const records = graph.openings.map((opening): CadOpeningTopologyRecord => {
    const hostEdgeId = opening.hostEdgeId ?? null
    if (!hostEdgeId) {
      return { entityId: opening.entityId, kind: opening.kind, hostEdgeId: null, hostThickness: null, hostThicknessConfidence: null, status: 'unresolved' }
    }
    const inferred = thicknessByEdge.get(hostEdgeId) ?? null
    return {
      entityId: opening.entityId,
      kind: opening.kind,
      hostEdgeId,
      hostThickness: inferred?.thickness ?? null,
      hostThicknessConfidence: inferred?.confidence ?? null,
      status: inferred ? 'hosted-with-depth' : 'hosted',
    }
  })

  const hosted = records.filter((record) => record.status !== 'unresolved').length
  const hostedWithDepth = records.filter((record) => record.status === 'hosted-with-depth').length
  const unresolved = records.length - hosted
  return {
    records,
    total: records.length,
    hosted,
    hostedWithDepth,
    unresolved,
    depthCoverage: hosted ? hostedWithDepth / hosted : 0,
  }
}
