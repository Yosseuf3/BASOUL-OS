import type { ArchitectureScene } from '../../architecture-engine/src/index'
import type { CadEntity, CadPoint, NormalizedCadDocument } from './index'
import { cadDocumentToArchitectureScene, classifyCadEntity } from './index'

export interface CadFloorVertex { id: string; x: number; y: number; degree: number }
export interface CadFloorEdge { id: string; a: string; b: string; sourceEntityId: string; length: number }
export interface CadHostedOpening { entityId: string; kind: 'door' | 'window'; hostEdgeId: string | null; distance: number | null }
export interface CadRoomFace { id: string; vertexIds: string[]; area: number; centroid: CadPoint }
export interface CadGeometryGate { ready: boolean; wallSegments: number; junctions: number; hostedOpenings: number; openings: number; hostRatio: number; rooms: number; reasons: string[] }
export interface CadFloorGraph {
  vertices: CadFloorVertex[]
  edges: CadFloorEdge[]
  openings: CadHostedOpening[]
  rooms: CadRoomFace[]
  gate: CadGeometryGate
}

interface RawSegment { id: string; sourceEntityId: string; a: CadPoint; b: CadPoint }

const sq = (n: number) => n * n
const distance = (a: CadPoint, b: CadPoint) => Math.hypot(a.x - b.x, a.y - b.y)
const signedArea = (points: CadPoint[]) => points.reduce((sum, p, i) => {
  const q = points[(i + 1) % points.length]
  return sum + p.x * q.y - q.x * p.y
}, 0) / 2

function scaleFor(document: NormalizedCadDocument) {
  const units = (document.units ?? '').toLowerCase()
  if (units.includes('millimeter') || units === 'mm') return { snap: 20, host: 600, minRoomArea: 1_000_000 }
  if (units.includes('centimeter') || units === 'cm') return { snap: 2, host: 60, minRoomArea: 10_000 }
  return { snap: 0.02, host: 0.6, minRoomArea: 1 }
}

function rawWallSegments(document: NormalizedCadDocument): RawSegment[] {
  const result: RawSegment[] = []
  for (const entity of document.entities) {
    if (classifyCadEntity(entity).kind !== 'wall') continue
    const points = entity.points ?? []
    for (let i = 0; i + 1 < points.length; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      if (distance(a, b) <= 1e-9) continue
      result.push({ id: `${entity.id}:${i}`, sourceEntityId: entity.id, a, b })
    }
  }
  return result
}

function segmentIntersection(a: RawSegment, b: RawSegment): { point: CadPoint; ta: number; tb: number } | null {
  const rx = a.b.x - a.a.x
  const ry = a.b.y - a.a.y
  const sx = b.b.x - b.a.x
  const sy = b.b.y - b.a.y
  const cross = rx * sy - ry * sx
  if (Math.abs(cross) < 1e-10) return null
  const qpx = b.a.x - a.a.x
  const qpy = b.a.y - a.a.y
  const ta = (qpx * sy - qpy * sx) / cross
  const tb = (qpx * ry - qpy * rx) / cross
  if (ta < -1e-8 || ta > 1 + 1e-8 || tb < -1e-8 || tb > 1 + 1e-8) return null
  return { point: { x: a.a.x + ta * rx, y: a.a.y + ta * ry }, ta, tb }
}

function splitAtIntersections(segments: RawSegment[]): RawSegment[] {
  const cuts = segments.map(() => [0, 1])
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const hit = segmentIntersection(segments[i], segments[j])
      if (!hit) continue
      if (hit.ta > 1e-8 && hit.ta < 1 - 1e-8) cuts[i].push(hit.ta)
      if (hit.tb > 1e-8 && hit.tb < 1 - 1e-8) cuts[j].push(hit.tb)
    }
  }
  const result: RawSegment[] = []
  segments.forEach((segment, index) => {
    const ts = [...new Set(cuts[index].map((t) => Math.round(t * 1e9) / 1e9))].sort((a, b) => a - b)
    const dx = segment.b.x - segment.a.x
    const dy = segment.b.y - segment.a.y
    for (let i = 0; i + 1 < ts.length; i += 1) {
      const t0 = ts[i]
      const t1 = ts[i + 1]
      if (t1 - t0 < 1e-9) continue
      result.push({
        id: `${segment.id}:s${i}`,
        sourceEntityId: segment.sourceEntityId,
        a: { x: segment.a.x + dx * t0, y: segment.a.y + dy * t0 },
        b: { x: segment.a.x + dx * t1, y: segment.a.y + dy * t1 },
      })
    }
  })
  return result
}

function pointSegmentDistance(point: CadPoint, segment: RawSegment) {
  const dx = segment.b.x - segment.a.x
  const dy = segment.b.y - segment.a.y
  const length2 = sq(dx) + sq(dy)
  if (!length2) return distance(point, segment.a)
  const t = Math.max(0, Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / length2))
  return Math.hypot(point.x - (segment.a.x + t * dx), point.y - (segment.a.y + t * dy))
}

function centroid(points: CadPoint[], area: number): CadPoint {
  let cx = 0
  let cy = 0
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]
    const q = points[(i + 1) % points.length]
    const cross = p.x * q.y - q.x * p.y
    cx += (p.x + q.x) * cross
    cy += (p.y + q.y) * cross
  }
  const k = 1 / (6 * area)
  return { x: cx * k, y: cy * k }
}

export function buildCadFloorGraph(document: NormalizedCadDocument): CadFloorGraph {
  const scale = scaleFor(document)
  const segments = splitAtIntersections(rawWallSegments(document))
  const vertexMap = new Map<string, { id: string; x: number; y: number; neighbors: Set<string> }>()
  const keyFor = (p: CadPoint) => `${Math.round(p.x / scale.snap)}:${Math.round(p.y / scale.snap)}`
  const ensureVertex = (p: CadPoint) => {
    const key = keyFor(p)
    let value = vertexMap.get(key)
    if (!value) {
      value = { id: `v:${key}`, x: Math.round(p.x / scale.snap) * scale.snap, y: Math.round(p.y / scale.snap) * scale.snap, neighbors: new Set() }
      vertexMap.set(key, value)
    }
    return value
  }

  const edges: CadFloorEdge[] = []
  const edgeSeen = new Set<string>()
  for (const segment of segments) {
    const a = ensureVertex(segment.a)
    const b = ensureVertex(segment.b)
    if (a.id === b.id) continue
    const canonical = [a.id, b.id].sort().join('|')
    if (edgeSeen.has(canonical)) continue
    edgeSeen.add(canonical)
    a.neighbors.add(b.id)
    b.neighbors.add(a.id)
    edges.push({ id: `e:${edges.length}`, a: a.id, b: b.id, sourceEntityId: segment.sourceEntityId, length: Math.hypot(a.x - b.x, a.y - b.y) })
  }

  const verticesById = new Map([...vertexMap.values()].map((v) => [v.id, v]))
  const rooms: CadRoomFace[] = []
  const visitedHalfEdges = new Set<string>()
  const halfKey = (a: string, b: string) => `${a}>${b}`
  for (const start of edges) {
    for (const initial of [[start.a, start.b], [start.b, start.a]] as const) {
      if (visitedHalfEdges.has(halfKey(...initial))) continue
      const cycle: string[] = []
      let from = initial[0]
      let to = initial[1]
      const startKey = halfKey(from, to)
      for (let guard = 0; guard < edges.length * 2 + 10; guard += 1) {
        const currentKey = halfKey(from, to)
        if (visitedHalfEdges.has(currentKey) && currentKey !== startKey) break
        visitedHalfEdges.add(currentKey)
        cycle.push(from)
        const vertex = verticesById.get(to)
        const previous = verticesById.get(from)
        if (!vertex || !previous) break
        const incomingAngle = Math.atan2(previous.y - vertex.y, previous.x - vertex.x)
        const candidates = [...vertex.neighbors].map((id) => {
          const n = verticesById.get(id)!
          let delta = Math.atan2(n.y - vertex.y, n.x - vertex.x) - incomingAngle
          while (delta <= 0) delta += Math.PI * 2
          return { id, delta }
        }).sort((a, b) => a.delta - b.delta)
        if (!candidates.length) break
        const next = candidates[0].id
        from = to
        to = next
        if (halfKey(from, to) === startKey) {
          const points = cycle.map((id) => verticesById.get(id)!).map((v) => ({ x: v.x, y: v.y }))
          const area = signedArea(points)
          if (area > scale.minRoomArea && points.length >= 3) rooms.push({ id: `room:${rooms.length}`, vertexIds: [...cycle], area, centroid: centroid(points, area) })
          break
        }
      }
    }
  }

  const originalSegments = rawWallSegments(document)
  const openingEntities = document.entities.filter((entity) => {
    const kind = classifyCadEntity(entity).kind
    return kind === 'door' || kind === 'window'
  })
  const openings: CadHostedOpening[] = openingEntities.map((entity) => {
    const kind = classifyCadEntity(entity).kind as 'door' | 'window'
    const point = entity.insert ?? entity.points?.[0]
    if (!point || !originalSegments.length) return { entityId: entity.id, kind, hostEdgeId: null, distance: null }
    let best: RawSegment | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const segment of originalSegments) {
      const d = pointSegmentDistance(point, segment)
      if (d < bestDistance) { best = segment; bestDistance = d }
    }
    const hostEdge = best ? edges.find((edge) => edge.sourceEntityId === best!.sourceEntityId) : null
    return { entityId: entity.id, kind, hostEdgeId: bestDistance <= scale.host ? hostEdge?.id ?? null : null, distance: bestDistance }
  })

  const vertices = [...vertexMap.values()].map((v) => ({ id: v.id, x: v.x, y: v.y, degree: v.neighbors.size }))
  const junctions = vertices.filter((v) => v.degree >= 2).length
  const hostedOpenings = openings.filter((opening) => opening.hostEdgeId).length
  const hostRatio = openings.length ? hostedOpenings / openings.length : 1
  const reasons: string[] = []
  if (edges.length < 12) reasons.push(`wallSegments=${edges.length} < 12`)
  if (junctions < 8) reasons.push(`junctions=${junctions} < 8`)
  if (openings.length && hostRatio < 0.45) reasons.push(`hostRatio=${hostRatio.toFixed(2)} < 0.45`)
  if (!rooms.length) reasons.push('no bounded room faces recovered')
  const gate: CadGeometryGate = { ready: reasons.length === 0, wallSegments: edges.length, junctions, hostedOpenings, openings: openings.length, hostRatio, rooms: rooms.length, reasons }

  return { vertices, edges, openings, rooms, gate }
}

export function cadDocumentToPascalReadyScene(document: NormalizedCadDocument): { scene: ArchitectureScene | null; graph: CadFloorGraph } {
  const graph = buildCadFloorGraph(document)
  if (!graph.gate.ready) return { scene: null, graph }
  const scene = cadDocumentToArchitectureScene(document)
  scene.metadata = { ...scene.metadata, cadGeometryReady: true, cadFloorGraph: graph.gate }
  for (const opening of graph.openings) {
    const node = scene.nodes[`cad:${opening.entityId}`]
    if (!node) continue
    node.metadata = { ...node.metadata, hostWallEdgeId: opening.hostEdgeId, hostDistance: opening.distance }
  }
  for (const room of graph.rooms) {
    scene.nodes[`cad:${room.id}`] = {
      id: `cad:${room.id}`,
      type: 'room',
      parentId: 'cad:root',
      boundary: room.vertexIds.map((id) => {
        const v = graph.vertices.find((vertex) => vertex.id === id)!
        return { x: v.x, y: v.y }
      }),
      metadata: { source: 'cad-floor-graph', area: room.area, centroid: room.centroid },
    }
  }
  return { scene, graph }
}
