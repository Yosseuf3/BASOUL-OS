import type { CadPoint, NormalizedCadDocument } from '../../packages/cad-ingestion/src'

type Primitive = {
  type?: string
  points?: CadPoint[]
  center?: CadPoint | null
  radius?: number | null
}

export interface CadDoorSwingInference {
  entityId: string
  confidence: number
  source: 'native-insert-geometry'
  hinge: { x: number; y: number }
  radius: number
  closedAngleRadians: number
  openAngleRadians: number
  swingRadians: number
  sweepRadians: number
}

function normalizeAngle(value: number) {
  let next = value % (Math.PI * 2)
  if (next <= -Math.PI) next += Math.PI * 2
  if (next > Math.PI) next -= Math.PI * 2
  return next
}

function angularDistance(a: number, b: number) {
  return Math.abs(normalizeAngle(a - b))
}

function pointDistance(a: CadPoint, b: CadPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function readInsertGeometry(entity: NormalizedCadDocument['entities'][number]) {
  const raw = entity.metadata?.insertGeometry
  return Array.isArray(raw) ? raw.filter((item): item is Primitive => Boolean(item && typeof item === 'object')) : []
}

export function inferCadDoorSwing(entity: NormalizedCadDocument['entities'][number]): CadDoorSwingInference | null {
  if (entity.type !== 'INSERT') return null
  const primitives = readInsertGeometry(entity)
  const arcs = primitives.filter((primitive) => primitive.type === 'ARC' && primitive.center && typeof primitive.radius === 'number' && primitive.radius >= 0.45 && primitive.radius <= 2.5 && Array.isArray(primitive.points) && primitive.points.length >= 3)
  const lines = primitives.filter((primitive) => primitive.type === 'LINE' && Array.isArray(primitive.points) && primitive.points.length >= 2)

  let best: CadDoorSwingInference | null = null
  for (const arc of arcs) {
    const center = arc.center as CadPoint
    const radius = arc.radius as number
    const arcPoints = arc.points as CadPoint[]
    const start = arcPoints[0]
    const end = arcPoints[arcPoints.length - 1]
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x)
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x)
    const tolerance = Math.max(0.08, radius * 0.12)

    for (const line of lines) {
      const [p0, p1] = line.points as CadPoint[]
      const d0 = pointDistance(p0, center)
      const d1 = pointDistance(p1, center)
      const hingePoint = d0 <= d1 ? p0 : p1
      const leafPoint = d0 <= d1 ? p1 : p0
      const hingeDistance = Math.min(d0, d1)
      if (hingeDistance > tolerance) continue

      const leafLength = pointDistance(hingePoint, leafPoint)
      const lengthRatio = leafLength / radius
      if (lengthRatio < 0.65 || lengthRatio > 1.35) continue

      const leafAngle = Math.atan2(leafPoint.y - center.y, leafPoint.x - center.x)
      const startDelta = angularDistance(leafAngle, startAngle)
      const endDelta = angularDistance(leafAngle, endAngle)
      const endpointDelta = Math.min(startDelta, endDelta)
      if (endpointDelta > Math.PI / 10) continue

      const openAngle = startDelta <= endDelta ? startAngle : endAngle
      const closedAngle = startDelta <= endDelta ? endAngle : startAngle
      const swingRadians = normalizeAngle(openAngle - closedAngle)
      const sweepRadians = Math.abs(swingRadians)
      if (sweepRadians < Math.PI / 8 || sweepRadians > Math.PI * 0.8) continue

      const hingeScore = Math.max(0, 1 - hingeDistance / tolerance)
      const lengthScore = Math.max(0, 1 - Math.abs(1 - lengthRatio) / 0.35)
      const endpointScore = Math.max(0, 1 - endpointDelta / (Math.PI / 10))
      const sweepScore = sweepRadians >= Math.PI / 4 && sweepRadians <= Math.PI * 0.67 ? 1 : 0.75
      const confidence = Math.min(0.99, 0.45 * hingeScore + 0.3 * lengthScore + 0.2 * endpointScore + 0.05 * sweepScore)
      if (confidence < 0.82) continue

      const candidate: CadDoorSwingInference = {
        entityId: entity.id,
        confidence,
        source: 'native-insert-geometry',
        hinge: { x: center.x, y: center.y },
        radius,
        closedAngleRadians: closedAngle,
        openAngleRadians: openAngle,
        swingRadians,
        sweepRadians,
      }
      if (!best || candidate.confidence > best.confidence) best = candidate
    }
  }

  return best
}

export function analyzeCadDoorSwings(document: NormalizedCadDocument) {
  const records = document.entities.flatMap((entity) => {
    const inferred = inferCadDoorSwing(entity)
    return inferred ? [inferred] : []
  })
  return { records, byEntityId: new Map(records.map((record) => [record.entityId, record])), detected: records.length }
}
