import type { ArchitectureScene } from '../../architecture-engine/src/index'
import type { CadEntity, CadPoint, NormalizedCadDocument } from './index'
import { cadDocumentToArchitectureScene, classifyCadEntity } from './index'

export interface CadFloorVertex { id: string; x: number; y: number; degree: number }
export interface CadFloorEdge { id: string; a: string; b: string; sourceEntityId: string; length: number }
export interface CadHostedOpening {
  entityId: string
  kind: 'door' | 'window'
  hostEdgeId: string | null
  distance: number | null
  orientationError: number | null
}
export interface CadRoomFace {
  id: string
  vertexIds: string[]
  area: number
  centroid: CadPoint
  perimeter: number
  minSpan: number
  compactness: number
  labelEntityId: string | null
}
export interface CadGeometryGate { ready: boolean; wallSegments: number; junctions: number; hostedOpenings: number; openings: number; hostRatio: number; rooms: number; reasons: string[] }
export interface CadFloorGraph {
  vertices: CadFloorVertex[]
  edges: CadFloorEdge[]
  openings: CadHostedOpening[]
  rooms: CadRoomFace[]
  gate: CadGeometryGate
}

interface RawSegment { id: string; sourceEntityId: string; a: CadPoint; b: CadPoint }
interface FloorScale { snap: number; host: number; minRoomArea: number; minRoomSpan: number }

const sq = (n: number) => n * n
const distance = (a: CadPoint, b: CadPoint) => Math.hypot(a.x - b.x, a.y - b.y)
const signedArea = (points: CadPoint[]) => points.reduce((sum, p, i) => {
  const q = points[(i + 1) % points.length]
  return sum + p.x * q.y - q.x * p.y
}, 0) / 2

function scaleFor(document: NormalizedCadDocument): FloorScale {
  const units = (document.units ?? '').toLowerCase()
  if (units.includes('millimeter') || units === 'mm' || units === '4') return { snap: 20, host: 600, minRoomArea: 1_000_000, minRoomSpan: 650 }
  if (units.includes('centimeter') || units === 'cm' || units === '5') return { snap: 2, host: 60, minRoomArea: 10_000, minRoomSpan: 65 }
  return { snap: 0.02, host: 0.6, minRoomArea: 1, minRoomSpan: 0.65 }
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

function polygonMetrics(points: CadPoint[], area: number) {
  let perimeter = 0
  for (let i = 0; i < points.length; i += 1) perimeter += distance(points[i], points[(i + 1) % points.length])
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minSpan = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const compactness = perimeter > 1e-9 ? (4 * Math.PI * Math.abs(area)) / sq(perimeter) : 0
  return { perimeter, minSpan, compactness }
}

function pointInPolygon(point: CadPoint, polygon: CadPoint[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-12) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

function angularDistance(a: number, b: number) {
  let delta = Math.abs(a - b) % Math.PI
  if (delta > Math.PI / 2) delta = Math.PI - delta
  return delta
}

function openingOrientationError(entity: CadEntity, a: CadPoint, b: CadPoint) {
  if (entity.rotation == null) return 0
  const openingAngle = entity.rotation * Math.PI / 180
  const wallAngle = Math.atan2(b.y - a.y, b.x - a.x)
  const parallel = angularDistance(openingAngle, wallAngle)
  const perpendicular = angularDistance(openingAngle + Math.PI / 2, wallAngle)
  return Math.min(parallel, perpendicular)
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
  const roomCandidates: CadRoomFace[] = []
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
          if (area > scale.minRoomArea && points.length >= 3) {
            const metrics = polygonMetrics(points, area)
            roomCandidates.push({
              id: `candidate:${roomCandidates.length}`,
              vertexIds: [...cycle],
              area,
              centroid: centroid(points, area),
              ...metrics,
              labelEntityId: null,
            })
          }
          break
        }
      }
    }
  }

  const roomLabels = document.entities.filter((entity) => {
    if (!['TEXT', 'MTEXT'].includes(entity.type)) return false
    return classifyCadEntity(entity).kind === 'room' && Boolean(entity.insert ?? entity.points?.[0])
  })
  for (const room of roomCandidates) {
    const polygon = room.vertexIds.map((id) => verticesById.get(id)!).map((v) => ({ x: v.x, y: v.y }))
    const label = roomLabels.find((entity) => {
      const point = entity.insert ?? entity.points?.[0]
      return point ? pointInPolygon(point, polygon) : false
    })
    room.labelEntityId = label?.id ?? null
  }

  const allVertices = [...vertexMap.values()]
  const minX = Math.min(...allVertices.map((v) => v.x))
  const maxX = Math.max(...allVertices.map((v) => v.x))
  const minY = Math.min(...allVertices.map((v) => v.y))
  const maxY = Math.max(...allVertices.map((v) => v.y))
  const drawingEnvelopeArea = Math.max(scale.minRoomArea, (maxX - minX) * (maxY - minY))
  const rooms = roomCandidates
    .filter((room) => {
      if (room.area >= drawingEnvelopeArea * 0.6) return false
      if (room.labelEntityId) return true
      return room.minSpan >= scale.minRoomSpan && room.compactness >= 0.06
    })
    .map((room, index) => ({ ...room, id: `room:${index}` }))

  const openingEntities = document.entities.filter((entity) => {
    const kind = classifyCadEntity(entity).kind
    return kind === 'door' || kind === 'window'
  })
  const openings: CadHostedOpening[] = openingEntities.map((entity) => {
    const kind = classifyCadEntity(entity).kind as 'door' | 'window'
    const point = entity.insert ?? entity.points?.[0]
    if (!point || !edges.length) return { entityId: entity.id, kind, hostEdgeId: null, distance: null, orientationError: null }
    let bestEdge: CadFloorEdge | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    let bestOrientationError = Number.POSITIVE_INFINITY
    let bestScore = Number.POSITIVE_INFINITY
    for (const edge of edges) {
      const a = verticesById.get(edge.a)
      const b = verticesById.get(edge.b)
      if (!a || !b) continue
      const d = pointSegmentDistance(point, { id: edge.id, sourceEntityId: edge.sourceEntityId, a, b })
      if (d > scale.host) continue
      const orientationError = openingOrientationError(entity, a, b)
      const score = d / scale.host + (orientationError / (Math.PI / 4)) * 0.2
      if (score < bestScore) {
        bestEdge = edge
        bestDistance = d
        bestOrientationError = orientationError
        bestScore = score
      }
    }
    return {
      entityId: entity.id,
      kind,
      hostEdgeId: bestEdge?.id ?? null,
      distance: bestEdge ? bestDistance : null,
      orientationError: bestEdge ? bestOrientationError : null,
    }
  })

  const vertices = allVertices.map((v) => ({ id: v.id, x: v.x, y: v.y, degree: v.neighbors.size }))
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
  scene.metadata = { ...scene.metadata, cadGeometryReady: true, cadFloorGraph: graph.gate, cadFloorGraphVersion: 2 }
  for (const opening of graph.openings) {
    const node = scene.nodes[`cad:${opening.entityId}`]
    if (!node) continue
    node.metadata = {
      ...node.metadata,
      hostWallEdgeId: opening.hostEdgeId,
      hostDistance: opening.distance,
      hostOrientationError: opening.orientationError,
    }
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
      metadata: {
        source: 'cad-floor-graph-v2',
        area: room.area,
        centroid: room.centroid,
        perimeter: room.perimeter,
        minSpan: room.minSpan,
        compactness: room.compactness,
        labelEntityId: room.labelEntityId,
      },
    }
  }
  return { scene, graph }
}
