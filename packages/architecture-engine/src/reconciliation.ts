import type { ArchitectureNode, ArchitectureScene } from './index'

export type DetectionReviewState = 'detected' | 'probable' | 'needs_review'

export interface DetectedPlanElement {
  id?: string
  element_type: 'wall' | 'opening' | 'room' | 'label' | 'dimension' | 'stair' | 'column'
  label: string
  value?: string | null
  unit?: string | null
  confidence_score: number
  geometry?: Record<string, unknown>
  notes?: string
}

export interface ReconciliationOptions {
  pageWidthMeters?: number
  pageHeightMeters?: number
  wallHeightMeters?: number
  defaultWallThicknessMeters?: number
  snapToleranceMeters?: number
  openingHostToleranceMeters?: number
}

export interface ReconciliationDiagnostic {
  code: string
  elementId?: string
  message: string
  severity: 'info' | 'warning'
}

export interface ReconciliationResult {
  scene: ArchitectureScene
  diagnostics: ReconciliationDiagnostic[]
  acceptedElementIds: string[]
  reviewElementIds: string[]
}

type Point = [number, number]

type WallCandidate = {
  id: string
  start: Point
  end: Point
  thickness: number
  confidence: number
  source: DetectedPlanElement
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

function reviewState(confidence: number): DetectionReviewState {
  if (confidence >= 80) return 'detected'
  if (confidence >= 55) return 'probable'
  return 'needs_review'
}

function stableId(prefix: string, element: DetectedPlanElement, index: number) {
  const raw = element.id || `${prefix}_${index + 1}`
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96)
}

function normalizePoint(point: Point, geometry: Record<string, unknown>, options: Required<ReconciliationOptions>): Point {
  const coordinateSystem = String(geometry.coordinateSystem ?? '')
  if (coordinateSystem === 'normalized_0_1000') {
    return [
      (point[0] / 1000) * options.pageWidthMeters,
      (point[1] / 1000) * options.pageHeightMeters,
    ]
  }
  if (coordinateSystem === 'pdf_points') {
    const pageWidth = finite(geometry.pageWidth) && geometry.pageWidth > 0 ? geometry.pageWidth : 1000
    const pageHeight = finite(geometry.pageHeight) && geometry.pageHeight > 0 ? geometry.pageHeight : 1000
    return [
      (point[0] / pageWidth) * options.pageWidthMeters,
      (point[1] / pageHeight) * options.pageHeightMeters,
    ]
  }
  return point
}

function pointFrom(value: unknown): Point | null {
  if (!value || typeof value !== 'object') return null
  const object = value as Record<string, unknown>
  return finite(object.x) && finite(object.y) ? [object.x, object.y] : null
}

function wallFromElement(
  element: DetectedPlanElement,
  index: number,
  options: Required<ReconciliationOptions>,
): WallCandidate | null {
  const geometry = element.geometry ?? {}
  const centerline = geometry.centerline && typeof geometry.centerline === 'object'
    ? geometry.centerline as Record<string, unknown>
    : null
  const start = centerline ? pointFrom(centerline.start) : pointFrom(geometry.start)
  const end = centerline ? pointFrom(centerline.end) : pointFrom(geometry.end)

  if (start && end) {
    const normalizedStart = normalizePoint(start, geometry, options)
    const normalizedEnd = normalizePoint(end, geometry, options)
    if (distance(normalizedStart, normalizedEnd) < 0.05) return null
    const rawThickness = finite(geometry.thickness) ? geometry.thickness : options.defaultWallThicknessMeters
    const thickness = String(geometry.coordinateSystem ?? '') === 'pdf_points'
      ? clamp((rawThickness / 1000) * options.pageWidthMeters, 0.08, 0.6)
      : clamp(rawThickness, 0.08, 0.6)
    return {
      id: stableId('wall', element, index),
      start: normalizedStart,
      end: normalizedEnd,
      thickness,
      confidence: element.confidence_score,
      source: element,
    }
  }

  if (
    String(geometry.coordinateSystem ?? '') === 'normalized_0_1000' &&
    finite(geometry.x) && finite(geometry.y) && finite(geometry.width) && finite(geometry.height)
  ) {
    const horizontal = geometry.width >= geometry.height
    const x = (geometry.x / 1000) * options.pageWidthMeters
    const y = (geometry.y / 1000) * options.pageHeightMeters
    const width = (geometry.width / 1000) * options.pageWidthMeters
    const height = (geometry.height / 1000) * options.pageHeightMeters
    const start: Point = horizontal ? [x, y + height / 2] : [x + width / 2, y]
    const end: Point = horizontal ? [x + width, y + height / 2] : [x + width / 2, y + height]
    if (distance(start, end) < 0.05) return null
    return {
      id: stableId('wall', element, index),
      start,
      end,
      thickness: clamp(horizontal ? height : width, 0.08, 0.6),
      confidence: Math.min(82, element.confidence_score),
      source: element,
    }
  }

  return null
}

function snapPoint(point: Point, anchors: Point[], tolerance: number): Point {
  const match = anchors.find((anchor) => distance(anchor, point) <= tolerance)
  if (match) return [...match]
  const created: Point = [Number(point[0].toFixed(3)), Number(point[1].toFixed(3))]
  anchors.push(created)
  return [...created]
}

function canonicalWallKey(start: Point, end: Point, tolerance: number) {
  const scale = 1 / Math.max(0.001, tolerance)
  const a = `${Math.round(start[0] * scale)}:${Math.round(start[1] * scale)}`
  const b = `${Math.round(end[0] * scale)}:${Math.round(end[1] * scale)}`
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function projectionOnWall(point: Point, wall: WallCandidate) {
  const dx = wall.end[0] - wall.start[0]
  const dy = wall.end[1] - wall.start[1]
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared <= 1e-8) return { distance: Number.POSITIVE_INFINITY, offset: 0, length: 0 }
  const t = clamp(((point[0] - wall.start[0]) * dx + (point[1] - wall.start[1]) * dy) / lengthSquared, 0, 1)
  const projected: Point = [wall.start[0] + t * dx, wall.start[1] + t * dy]
  const length = Math.sqrt(lengthSquared)
  return { distance: distance(point, projected), offset: t * length, length }
}

function openingCenter(element: DetectedPlanElement, options: Required<ReconciliationOptions>): Point | null {
  const geometry = element.geometry ?? {}
  const start = pointFrom(geometry.start)
  const end = pointFrom(geometry.end)
  if (start && end) {
    const a = normalizePoint(start, geometry, options)
    const b = normalizePoint(end, geometry, options)
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  }
  if (
    String(geometry.coordinateSystem ?? '') === 'normalized_0_1000' &&
    finite(geometry.x) && finite(geometry.y) && finite(geometry.width) && finite(geometry.height)
  ) {
    return [
      ((geometry.x + geometry.width / 2) / 1000) * options.pageWidthMeters,
      ((geometry.y + geometry.height / 2) / 1000) * options.pageHeightMeters,
    ]
  }
  return null
}

function openingWidth(element: DetectedPlanElement, options: Required<ReconciliationOptions>) {
  const geometry = element.geometry ?? {}
  if (finite(geometry.width)) {
    if (String(geometry.coordinateSystem ?? '') === 'normalized_0_1000') {
      return clamp((geometry.width / 1000) * options.pageWidthMeters, 0.5, 4)
    }
    if (String(geometry.coordinateSystem ?? '') === 'pdf_points') {
      return clamp((geometry.width / 1000) * options.pageWidthMeters, 0.5, 4)
    }
    return clamp(geometry.width, 0.5, 4)
  }
  return /window|نافذة/i.test(element.label) ? 1.5 : 1
}

export function reconcileDetectedPlanElements(
  elements: DetectedPlanElement[],
  options: ReconciliationOptions = {},
): ReconciliationResult {
  const resolved: Required<ReconciliationOptions> = {
    pageWidthMeters: options.pageWidthMeters ?? 30,
    pageHeightMeters: options.pageHeightMeters ?? 20,
    wallHeightMeters: options.wallHeightMeters ?? 3.2,
    defaultWallThicknessMeters: options.defaultWallThicknessMeters ?? 0.2,
    snapToleranceMeters: options.snapToleranceMeters ?? 0.18,
    openingHostToleranceMeters: options.openingHostToleranceMeters ?? 0.8,
  }
  const diagnostics: ReconciliationDiagnostic[] = []
  const anchors: Point[] = []
  const rawWalls = elements
    .filter((element) => element.element_type === 'wall')
    .map((element, index) => wallFromElement(element, index, resolved))
    .filter((wall): wall is WallCandidate => Boolean(wall))

  const seenWalls = new Map<string, WallCandidate>()
  for (const wall of rawWalls) {
    wall.start = snapPoint(wall.start, anchors, resolved.snapToleranceMeters)
    wall.end = snapPoint(wall.end, anchors, resolved.snapToleranceMeters)
    const key = canonicalWallKey(wall.start, wall.end, resolved.snapToleranceMeters)
    const existing = seenWalls.get(key)
    if (!existing || wall.confidence > existing.confidence) seenWalls.set(key, wall)
  }
  const walls = [...seenWalls.values()]

  const siteId = 'site_detected'
  const buildingId = 'building_detected'
  const levelId = 'level_detected_0'
  const nodes: Record<string, ArchitectureNode> = {
    [siteId]: { id: siteId, type: 'site', parentId: null, children: [buildingId], metadata: { source: 'basoul-reconciliation' } },
    [buildingId]: { id: buildingId, type: 'building', parentId: siteId, children: [levelId], position: [0, 0, 0], rotation: [0, 0, 0] },
    [levelId]: { id: levelId, type: 'level', parentId: buildingId, children: [], name: 'Detected Ground', level: 0, baseElevation: 0, height: resolved.wallHeightMeters },
  }
  const levelChildren: string[] = []
  const acceptedElementIds: string[] = []
  const reviewElementIds: string[] = []

  for (const wall of walls) {
    const state = reviewState(wall.confidence)
    nodes[wall.id] = {
      id: wall.id,
      type: 'wall',
      parentId: levelId,
      start: wall.start,
      end: wall.end,
      height: resolved.wallHeightMeters,
      thickness: wall.thickness,
      metadata: {
        detectionState: state,
        confidence: wall.confidence,
        sourceLabel: wall.source.label,
        sourceNotes: wall.source.notes ?? '',
      },
    }
    levelChildren.push(wall.id)
    ;(state === 'needs_review' ? reviewElementIds : acceptedElementIds).push(wall.id)
  }

  const openingElements = elements.filter((element) => element.element_type === 'opening')
  for (let index = 0; index < openingElements.length; index += 1) {
    const element = openingElements[index]
    const center = openingCenter(element, resolved)
    const id = stableId('opening', element, index)
    if (!center || walls.length === 0) {
      reviewElementIds.push(id)
      diagnostics.push({ code: 'opening.host_missing', elementId: id, message: 'Opening could not be mapped to a host wall.', severity: 'warning' })
      continue
    }
    const host = walls
      .map((wall) => ({ wall, projection: projectionOnWall(center, wall) }))
      .sort((a, b) => a.projection.distance - b.projection.distance)[0]
    if (!host || host.projection.distance > resolved.openingHostToleranceMeters) {
      reviewElementIds.push(id)
      diagnostics.push({ code: 'opening.host_too_far', elementId: id, message: 'Nearest wall is outside opening host tolerance.', severity: 'warning' })
      continue
    }
    const state = reviewState(element.confidence_score)
    const isWindow = /window|نافذة|شباك/i.test(element.label)
    const width = Math.min(openingWidth(element, resolved), Math.max(0.5, host.projection.length - 0.2))
    nodes[id] = {
      id,
      type: isWindow ? 'window' : 'door',
      parentId: host.wall.id,
      wallId: host.wall.id,
      position: [clamp(host.projection.offset, width / 2, Math.max(width / 2, host.projection.length - width / 2)), isWindow ? 1.6 : 1.1, 0],
      rotation: [0, 0, 0],
      width,
      height: isWindow ? 1.4 : 2.2,
      metadata: {
        detectionState: state,
        confidence: element.confidence_score,
        sourceLabel: element.label,
        hostDistance: Number(host.projection.distance.toFixed(3)),
      },
    }
    const hostChildren = Array.isArray(nodes[host.wall.id]?.children) ? [...nodes[host.wall.id].children as string[]] : []
    nodes[host.wall.id] = { ...nodes[host.wall.id], children: [...hostChildren, id] }
    ;(state === 'needs_review' ? reviewElementIds : acceptedElementIds).push(id)
  }

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index]
    if (element.element_type === 'wall' || element.element_type === 'opening') continue
    const id = stableId(element.element_type, element, index)
    const state = reviewState(element.confidence_score)
    nodes[id] = {
      id,
      type: element.element_type === 'column' || element.element_type === 'stair' ? element.element_type : 'item',
      parentId: levelId,
      metadata: {
        semanticType: element.element_type,
        label: element.label,
        value: element.value ?? null,
        unit: element.unit ?? null,
        confidence: element.confidence_score,
        detectionState: state,
        sourceGeometry: element.geometry ?? {},
      },
    }
    levelChildren.push(id)
    ;(state === 'needs_review' ? reviewElementIds : acceptedElementIds).push(id)
  }

  nodes[levelId] = { ...nodes[levelId], children: levelChildren }

  diagnostics.push({
    code: 'reconciliation.summary',
    message: `Reconciled ${walls.length} walls and ${Object.values(nodes).filter((node) => node.type === 'door' || node.type === 'window').length} hosted openings.`,
    severity: 'info',
  })

  return {
    scene: {
      nodes,
      rootNodeIds: [siteId],
      metadata: {
        owner: 'BASOUL',
        source: 'architectural-analysis',
        reconciliation: 'geometry-v1',
        intendedRuntime: 'pascal-adapter',
      },
    },
    diagnostics,
    acceptedElementIds,
    reviewElementIds,
  }
}
