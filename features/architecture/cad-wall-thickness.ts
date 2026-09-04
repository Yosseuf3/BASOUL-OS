import type { CadFloorGraph } from '../../packages/cad-ingestion/src'

export interface CadWallThicknessPair {
  edgeId: string
  pairedEdgeId: string
  thickness: number
  overlapRatio: number
  parallelErrorRadians: number
  confidence: number
}

export interface CadWallThicknessAnalysis {
  pairs: CadWallThicknessPair[]
  pairedEdges: number
  totalEdges: number
  coverage: number
  medianThickness: number | null
  highConfidencePairs: number
}

export interface CadWallThicknessMaterialization {
  byEdgeId: Map<string, number>
  acceptedPairs: number
  acceptedEdges: number
  totalEdges: number
  coverage: number
  medianThickness: number | null
}

type Point = { x: number; y: number }

const MATERIALIZE_CONFIDENCE = 0.85
const MAX_MEDIAN_DEVIATION = 0.35
const MIN_PLAUSIBLE_THICKNESS = 0.05
const MAX_PLAUSIBLE_THICKNESS = 1

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function analyzeCadWallThickness(graph: CadFloorGraph): CadWallThicknessAnalysis {
  const vertices = new Map(graph.vertices.map((vertex) => [vertex.id, vertex]))
  const used = new Set<string>()
  const pairs: CadWallThicknessPair[] = []

  for (const edge of graph.edges) {
    if (used.has(edge.id)) continue
    const a = vertices.get(edge.a)
    const b = vertices.get(edge.b)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const length = Math.hypot(dx, dy)
    if (length <= 1e-9) continue
    const ux = dx / length
    const uy = dy / length
    const nx = -uy
    const ny = ux

    let best: CadWallThicknessPair | null = null
    for (const candidate of graph.edges) {
      if (candidate.id === edge.id || used.has(candidate.id) || candidate.sourceEntityId === edge.sourceEntityId) continue
      const c = vertices.get(candidate.a)
      const d = vertices.get(candidate.b)
      if (!c || !d) continue
      const cdx = d.x - c.x
      const cdy = d.y - c.y
      const candidateLength = Math.hypot(cdx, cdy)
      if (candidateLength <= 1e-9) continue

      const dot = Math.abs((dx * cdx + dy * cdy) / (length * candidateLength))
      const parallelErrorRadians = Math.acos(Math.max(-1, Math.min(1, dot)))
      if (parallelErrorRadians > Math.PI / 90) continue

      const projections = [
        (c.x - a.x) * ux + (c.y - a.y) * uy,
        (d.x - a.x) * ux + (d.y - a.y) * uy,
      ].sort((left, right) => left - right)
      const overlap = Math.max(0, Math.min(length, projections[1]) - Math.max(0, projections[0]))
      const overlapRatio = overlap / Math.max(1e-9, Math.min(length, candidateLength))
      if (overlapRatio < 0.65) continue

      const midpoint: Point = { x: (c.x + d.x) / 2, y: (c.y + d.y) / 2 }
      const thickness = Math.abs((midpoint.x - a.x) * nx + (midpoint.y - a.y) * ny)
      if (!Number.isFinite(thickness) || thickness <= 1e-6) continue

      const parallelScore = clamp01(1 - parallelErrorRadians / (Math.PI / 90))
      const overlapScore = clamp01((overlapRatio - 0.65) / 0.35)
      const confidence = 0.55 * overlapScore + 0.45 * parallelScore
      if (confidence < 0.72) continue

      const next = { edgeId: edge.id, pairedEdgeId: candidate.id, thickness, overlapRatio, parallelErrorRadians, confidence }
      if (!best || next.confidence > best.confidence || (next.confidence === best.confidence && next.thickness < best.thickness)) best = next
    }

    if (best) {
      used.add(best.edgeId)
      used.add(best.pairedEdgeId)
      pairs.push(best)
    }
  }

  const highConfidencePairs = pairs.filter((pair) => pair.confidence >= MATERIALIZE_CONFIDENCE).length
  const pairedEdges = pairs.length * 2
  return {
    pairs,
    pairedEdges,
    totalEdges: graph.edges.length,
    coverage: graph.edges.length ? pairedEdges / graph.edges.length : 0,
    medianThickness: median(pairs.filter((pair) => pair.confidence >= MATERIALIZE_CONFIDENCE).map((pair) => pair.thickness)),
    highConfidencePairs,
  }
}

export function materializableCadWallThickness(analysis: CadWallThicknessAnalysis): CadWallThicknessMaterialization {
  const highConfidence = analysis.pairs.filter((pair) => pair.confidence >= MATERIALIZE_CONFIDENCE)
  const plausible = highConfidence.filter((pair) => pair.thickness >= MIN_PLAUSIBLE_THICKNESS && pair.thickness <= MAX_PLAUSIBLE_THICKNESS)
  const center = median(plausible.map((pair) => pair.thickness))
  const accepted = center == null ? [] : plausible.filter((pair) => Math.abs(pair.thickness - center) / center <= MAX_MEDIAN_DEVIATION)
  const byEdgeId = new Map<string, number>()
  for (const pair of accepted) {
    byEdgeId.set(pair.edgeId, pair.thickness)
    byEdgeId.set(pair.pairedEdgeId, pair.thickness)
  }
  const acceptedEdges = byEdgeId.size
  return {
    byEdgeId,
    acceptedPairs: accepted.length,
    acceptedEdges,
    totalEdges: analysis.totalEdges,
    coverage: analysis.totalEdges ? acceptedEdges / analysis.totalEdges : 0,
    medianThickness: center,
  }
}
