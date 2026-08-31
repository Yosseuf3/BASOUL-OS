import type { ArchitectureScene } from '../../architecture-engine/src/index'
import type { CadEntity, CadPoint, NormalizedCadDocument } from './index'
import { classifyCadEntity } from './index'

export interface CadSemanticRoom {
  id: string
  labelEntityId: string
  label: string
  seed: CadPoint
  boundary: CadPoint[]
  width: number
  height: number
  area: number
  confidence: number
}

interface AxisRun {
  coordinate: number
  start: number
  end: number
}

interface SemanticScale {
  snap: number
  mergeGap: number
  crossingTolerance: number
  maxRay: number
  minSpan: number
  maxSpan: number
  minArea: number
  maxArea: number
}

function scaleFor(document: NormalizedCadDocument): SemanticScale {
  const units = (document.units ?? '').toLowerCase()
  if (units.includes('millimeter') || units === 'mm' || units === '4') {
    return { snap: 20, mergeGap: 2000, crossingTolerance: 150, maxRay: 12000, minSpan: 1200, maxSpan: 12000, minArea: 1_800_000, maxArea: 100_000_000 }
  }
  if (units.includes('centimeter') || units === 'cm' || units === '5') {
    return { snap: 2, mergeGap: 200, crossingTolerance: 15, maxRay: 1200, minSpan: 120, maxSpan: 1200, minArea: 18_000, maxArea: 1_000_000 }
  }
  return { snap: 0.02, mergeGap: 2, crossingTolerance: 0.15, maxRay: 12, minSpan: 1.2, maxSpan: 12, minArea: 1.8, maxArea: 100 }
}

function mergeIntervals(intervals: Array<[number, number]>, maxGap: number) {
  const sorted = intervals
    .map(([a, b]) => a <= b ? [a, b] as [number, number] : [b, a] as [number, number])
    .sort((a, b) => a[0] - b[0])
  const result: Array<[number, number]> = []
  for (const interval of sorted) {
    const last = result[result.length - 1]
    if (!last || interval[0] - last[1] > maxGap) result.push([...interval] as [number, number])
    else last[1] = Math.max(last[1], interval[1])
  }
  return result
}

function buildAxisRuns(document: NormalizedCadDocument, scale: SemanticScale) {
  const vertical = new Map<number, Array<[number, number]>>()
  const horizontal = new Map<number, Array<[number, number]>>()
  for (const entity of document.entities) {
    if (classifyCadEntity(entity).kind !== 'wall') continue
    const points = entity.points ?? []
    for (let i = 0; i + 1 < points.length; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const length = Math.hypot(dx, dy)
      if (length <= 1e-9) continue
      const horizontalError = Math.abs(dy) / length
      const verticalError = Math.abs(dx) / length
      if (verticalError <= Math.sin(2 * Math.PI / 180)) {
        const coordinate = Math.round(((a.x + b.x) / 2) / scale.snap) * scale.snap
        const values = vertical.get(coordinate) ?? []
        values.push([a.y, b.y])
        vertical.set(coordinate, values)
      } else if (horizontalError <= Math.sin(2 * Math.PI / 180)) {
        const coordinate = Math.round(((a.y + b.y) / 2) / scale.snap) * scale.snap
        const values = horizontal.get(coordinate) ?? []
        values.push([a.x, b.x])
        horizontal.set(coordinate, values)
      }
    }
  }
  const toRuns = (source: Map<number, Array<[number, number]>>): AxisRun[] => {
    const runs: AxisRun[] = []
    for (const [coordinate, intervals] of source) {
      for (const [start, end] of mergeIntervals(intervals, scale.mergeGap)) runs.push({ coordinate, start, end })
    }
    return runs
  }
  return { vertical: toRuns(vertical), horizontal: toRuns(horizontal) }
}

function seedFor(entity: CadEntity): CadPoint | null {
  return entity.insert ?? entity.points?.[0] ?? null
}

function crosses(run: AxisRun, value: number, tolerance: number) {
  return value >= run.start - tolerance && value <= run.end + tolerance
}

function nearestDistances(seed: CadPoint, vertical: AxisRun[], horizontal: AxisRun[], tolerance: number) {
  const left = vertical.filter((run) => run.coordinate < seed.x && crosses(run, seed.y, tolerance)).map((run) => seed.x - run.coordinate)
  const right = vertical.filter((run) => run.coordinate > seed.x && crosses(run, seed.y, tolerance)).map((run) => run.coordinate - seed.x)
  const down = horizontal.filter((run) => run.coordinate < seed.y && crosses(run, seed.x, tolerance)).map((run) => seed.y - run.coordinate)
  const up = horizontal.filter((run) => run.coordinate > seed.y && crosses(run, seed.x, tolerance)).map((run) => run.coordinate - seed.y)
  return {
    left: left.length ? Math.min(...left) : null,
    right: right.length ? Math.min(...right) : null,
    down: down.length ? Math.min(...down) : null,
    up: up.length ? Math.min(...up) : null,
  }
}

export function recoverSemanticRooms(document: NormalizedCadDocument): CadSemanticRoom[] {
  const scale = scaleFor(document)
  const runs = buildAxisRuns(document, scale)
  const labels = document.entities.filter((entity) => {
    if (!['TEXT', 'MTEXT'].includes(entity.type)) return false
    return classifyCadEntity(entity).kind === 'room' && Boolean(seedFor(entity)) && Boolean(entity.text?.trim())
  })
  const rooms: CadSemanticRoom[] = []
  for (const entity of labels) {
    const seed = seedFor(entity)
    if (!seed) continue
    const d = nearestDistances(seed, runs.vertical, runs.horizontal, scale.crossingTolerance)
    if (d.left == null || d.right == null || d.down == null || d.up == null) continue
    if ([d.left, d.right, d.down, d.up].some((value) => value > scale.maxRay)) continue
    const width = d.left + d.right
    const height = d.down + d.up
    const area = width * height
    if (width < scale.minSpan || height < scale.minSpan || width > scale.maxSpan || height > scale.maxSpan) continue
    if (area < scale.minArea || area > scale.maxArea) continue
    const boundary: CadPoint[] = [
      { x: seed.x - d.left, y: seed.y - d.down },
      { x: seed.x + d.right, y: seed.y - d.down },
      { x: seed.x + d.right, y: seed.y + d.up },
      { x: seed.x - d.left, y: seed.y + d.up },
    ]
    rooms.push({
      id: `semantic-room:${entity.id}`,
      labelEntityId: entity.id,
      label: entity.text!.trim(),
      seed,
      boundary,
      width,
      height,
      area,
      confidence: 0.9,
    })
  }
  return rooms
}

export function applySemanticRoomsToScene(scene: ArchitectureScene, document: NormalizedCadDocument) {
  const rooms = recoverSemanticRooms(document)
  for (const room of rooms) {
    scene.nodes[`cad:${room.id}`] = {
      id: `cad:${room.id}`,
      type: 'room',
      parentId: 'cad:root',
      boundary: room.boundary,
      label: room.label,
      metadata: {
        source: 'cad-semantic-room-v2.2',
        labelEntityId: room.labelEntityId,
        seed: room.seed,
        width: room.width,
        height: room.height,
        area: room.area,
        confidence: room.confidence,
      },
    }
  }
  scene.metadata = {
    ...scene.metadata,
    semanticRoomRecoveryVersion: '2.2',
    semanticRoomCount: rooms.length,
  }
  return { scene, rooms }
}
