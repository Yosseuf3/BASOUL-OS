import {
  BuildingNode,
  DoorNode,
  LevelNode,
  SiteNode,
  SlabNode,
  WallNode,
  WindowNode,
  type AnyNode,
} from '@pascal-app/core'
import type { ArchitectureScene } from '../../packages/architecture-engine/src'
import {
  buildCadFloorGraph,
  classifyCadEntity,
  recoverSemanticRooms,
  type CadFloorGraph,
  type CadPoint,
  type NormalizedCadDocument,
} from '../../packages/cad-ingestion/src'
import { analyzeCadWallThickness, materializableCadWallThickness } from './cad-wall-thickness'
import { ensurePascalBuiltins } from './pascal-bootstrap'

ensurePascalBuiltins()

const WALL_HEIGHT = 3.2
const WALL_THICKNESS = 0.2
const DOOR_HEIGHT = 2.2
const WINDOW_HEIGHT = 1.4
const WINDOW_SILL = 0.9

function asSceneNode(node: AnyNode) {
  return node as unknown as ArchitectureScene['nodes'][string]
}

function pascalId(prefix: string, raw: string | number) {
  const safe = String(raw).trim().replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'node'
  return `${prefix}_${safe}`
}

type InsertBounds = { min?: Partial<CadPoint>; max?: Partial<CadPoint> }

function readInsertBounds(entity: NormalizedCadDocument['entities'][number]): InsertBounds | null {
  const raw = entity.metadata?.insertBounds
  return raw && typeof raw === 'object' ? raw as InsertBounds : null
}

function projectedOpeningWidth(entity: NormalizedCadDocument['entities'][number], a: CadPoint, b: CadPoint) {
  const bounds = readInsertBounds(entity)
  if (!bounds || typeof bounds.min?.x !== 'number' || typeof bounds.min?.y !== 'number' || typeof bounds.max?.x !== 'number' || typeof bounds.max?.y !== 'number') return entity.type === 'INSERT' ? 1 : 0.9
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (length <= 1e-9) return 1
  const ux = dx / length
  const uy = dy / length
  const corners = [
    [bounds.min.x, bounds.min.y],
    [bounds.min.x, bounds.max.y],
    [bounds.max.x, bounds.min.y],
    [bounds.max.x, bounds.max.y],
  ] as const
  const projections = corners.map(([x, y]) => x * ux + y * uy)
  const width = Math.max(...projections) - Math.min(...projections)
  return Math.max(0.45, Math.min(3, width || 1))
}

function cadOpeningHeight(entity: NormalizedCadDocument['entities'][number], fallback: number) {
  const bounds = readInsertBounds(entity)
  const minZ = bounds?.min?.z
  const maxZ = bounds?.max?.z
  if (typeof minZ !== 'number' || typeof maxZ !== 'number') return fallback
  const height = Math.abs(maxZ - minZ)
  return height >= 0.5 && height <= 4.5 ? height : fallback
}

function cadWindowSill(entity: NormalizedCadDocument['entities'][number]) {
  const bounds = readInsertBounds(entity)
  const minZ = bounds?.min?.z
  if (typeof minZ === 'number' && minZ >= 0.2 && minZ <= 3.5) return minZ
  const insertZ = entity.insert?.z
  return typeof insertZ === 'number' && insertZ >= 0.2 && insertZ <= 3.5 ? insertZ : WINDOW_SILL
}

function cadDoorRotation(entity: NormalizedCadDocument['entities'][number]) {
  if (typeof entity.rotation !== 'number' || !Number.isFinite(entity.rotation)) return null
  const normalized = ((entity.rotation % 360) + 360) % 360
  return normalized * Math.PI / 180
}

function distanceAlongWall(point: CadPoint, a: CadPoint, b: CadPoint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (length <= 1e-9) return 0
  return Math.max(0, Math.min(length, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length))
}

function wallCoverage(document: NormalizedCadDocument, graph: CadFloorGraph) {
  const expected = document.entities
    .filter((entity) => classifyCadEntity(entity).kind === 'wall')
    .filter((entity) => (entity.points?.length ?? 0) >= 2)
    .map((entity) => entity.id)
  const represented = new Set(graph.edges.map((edge) => edge.sourceEntityId))
  const missing = expected.filter((entityId) => !represented.has(entityId))
  return {
    cadWallEntities: expected.length,
    representedCadWallEntities: expected.length - missing.length,
    missingCadWallEntities: missing.length,
    wallEntityCoverage: expected.length ? (expected.length - missing.length) / expected.length : 0,
  }
}

export interface PascalSemanticCadDiagnostics {
  walls: number
  doors: number
  windows: number
  expectedDoors: number
  expectedWindows: number
  hostedOpenings: number
  floatingOpenings: number
  semanticRooms: number
  roomSlabs: number
  cadWallEntities: number
  representedCadWallEntities: number
  missingCadWallEntities: number
  wallEntityCoverage: number
  graphEdgesMaterialized: number
  graphEdgeCoverage: number
  inferredWallThicknessEdges: number
  fallbackWallThicknessEdges: number
  wallThicknessCoverage: number
  medianInferredWallThickness: number | null
  degraded: boolean
}

export function buildNativePascalCadScene(document: NormalizedCadDocument, inputGraph?: CadFloorGraph) {
  const graph = inputGraph ?? buildCadFloorGraph(document)
  if (!graph.gate.ready) return { scene: null, graph, diagnostics: null, reason: graph.gate.reasons.join('; ') || 'CAD geometry gate did not pass.' }

  const coverage = wallCoverage(document, graph)
  if (coverage.missingCadWallEntities > 0) {
    return {
      scene: null,
      graph,
      diagnostics: {
        walls: 0,
        doors: 0,
        windows: 0,
        expectedDoors: document.entities.filter((entity) => classifyCadEntity(entity).kind === 'door').length,
        expectedWindows: document.entities.filter((entity) => classifyCadEntity(entity).kind === 'window').length,
        hostedOpenings: 0,
        floatingOpenings: graph.openings.filter((opening) => !opening.hostEdgeId).length,
        semanticRooms: 0,
        roomSlabs: 0,
        ...coverage,
        graphEdgesMaterialized: 0,
        graphEdgeCoverage: 0,
        inferredWallThicknessEdges: 0,
        fallbackWallThicknessEdges: graph.edges.length,
        wallThicknessCoverage: 0,
        medianInferredWallThickness: null,
        degraded: false,
      },
      reason: `CAD fidelity gate failed: ${coverage.missingCadWallEntities}/${coverage.cadWallEntities} classified wall entities are missing from the floor graph.`,
    }
  }

  const vertices = new Map(graph.vertices.map((vertex) => [vertex.id, vertex]))
  const entities = new Map(document.entities.map((entity) => [entity.id, entity]))
  const openingsByEdge = new Map<string, typeof graph.openings>()
  for (const opening of graph.openings) {
    if (!opening.hostEdgeId) continue
    const list = openingsByEdge.get(opening.hostEdgeId) ?? []
    list.push(opening)
    openingsByEdge.set(opening.hostEdgeId, list)
  }

  const wallThicknessAnalysis = analyzeCadWallThickness(graph)
  const wallThicknessMaterialization = materializableCadWallThickness(wallThicknessAnalysis)
  const semanticRooms = recoverSemanticRooms(document)
  const siteId = 'site_cad_pascal'
  const buildingId = 'building_cad_pascal'
  const levelId = 'level_cad_pascal_0'
  const wallIdFor = (edgeId: string) => pascalId('wall_cad_pascal', edgeId)
  const slabIdFor = (labelEntityId: string) => pascalId('slab_cad_pascal', labelEntityId)
  const openingIdFor = (kind: 'door' | 'window', entityId: string) => pascalId(`${kind}_cad_pascal`, entityId)
  const wallIds = graph.edges.map((edge) => wallIdFor(edge.id))
  const slabIds = semanticRooms.map((room) => slabIdFor(room.labelEntityId))
  const levelChildren = [...wallIds, ...slabIds]

  const parsed: AnyNode[] = [
    SiteNode.parse({ id: siteId, parentId: null, children: [buildingId] }),
    BuildingNode.parse({ id: buildingId, parentId: siteId, children: [levelId], position: [0, 0, 0], rotation: [0, 0, 0] }),
    LevelNode.parse({ id: levelId, parentId: buildingId, children: levelChildren, name: 'CAD Ground Floor', level: 0, baseElevation: 0, height: WALL_HEIGHT }),
  ]

  let doors = 0
  let windows = 0
  let graphEdgesMaterialized = 0
  const cadDoorOrientations: Array<{ id: string; entityId: string; rotationRadians: number }> = []
  const inferredWallThickness: Array<{ edgeId: string; wallId: string; thickness: number }> = []
  for (const edge of graph.edges) {
    const a = vertices.get(edge.a)
    const b = vertices.get(edge.b)
    if (!a || !b) continue
    const wallId = wallIdFor(edge.id)
    const hosted = openingsByEdge.get(edge.id) ?? []
    const children = hosted.map((opening) => openingIdFor(opening.kind, opening.entityId))
    const inferredThickness = wallThicknessMaterialization.byEdgeId.get(edge.id)
    const thickness = inferredThickness ?? WALL_THICKNESS
    if (inferredThickness != null) inferredWallThickness.push({ edgeId: edge.id, wallId, thickness: inferredThickness })
    parsed.push(WallNode.parse({
      id: wallId,
      parentId: levelId,
      children,
      start: [a.x, a.y],
      end: [b.x, b.y],
      height: WALL_HEIGHT,
      thickness,
    }))
    graphEdgesMaterialized += 1

    for (const opening of hosted) {
      const entity = entities.get(opening.entityId)
      const point = entity?.insert ?? entity?.points?.[0]
      if (!entity || !point) continue
      const id = openingIdFor(opening.kind, opening.entityId)
      const along = distanceAlongWall(point, a, b)
      const width = projectedOpeningWidth(entity, a, b)
      if (opening.kind === 'door') {
        const height = cadOpeningHeight(entity, DOOR_HEIGHT)
        const cadRotation = cadDoorRotation(entity)
        const rotationY = cadRotation == null ? 0 : -cadRotation
        parsed.push(DoorNode.parse({ id, parentId: wallId, wallId, position: [along, height / 2, 0], rotation: [0, rotationY, 0], width, height }))
        if (cadRotation != null) cadDoorOrientations.push({ id, entityId: opening.entityId, rotationRadians: cadRotation })
        doors += 1
      } else {
        const height = cadOpeningHeight(entity, WINDOW_HEIGHT)
        const sill = cadWindowSill(entity)
        parsed.push(WindowNode.parse({ id, parentId: wallId, wallId, position: [along, sill + height / 2, 0], rotation: [0, 0, 0], width, height }))
        windows += 1
      }
    }
  }

  for (const room of semanticRooms) {
    parsed.push(SlabNode.parse({ id: slabIdFor(room.labelEntityId), parentId: levelId, polygon: room.boundary.map((point) => [point.x, point.y]), thickness: 0.12, elevation: 0 }))
  }

  const nodes = Object.fromEntries(parsed.map((node) => [node.id, asSceneNode(node)]))
  const floatingOpenings = graph.openings.filter((opening) => !opening.hostEdgeId).length
  const graphEdgeCoverage = graph.edges.length ? graphEdgesMaterialized / graph.edges.length : 0
  const expectedDoors = document.entities.filter((entity) => classifyCadEntity(entity).kind === 'door').length
  const expectedWindows = document.entities.filter((entity) => classifyCadEntity(entity).kind === 'window').length
  const degraded = floatingOpenings > 0 || doors !== expectedDoors || windows !== expectedWindows
  const diagnostics: PascalSemanticCadDiagnostics = {
    walls: graphEdgesMaterialized,
    doors,
    windows,
    expectedDoors,
    expectedWindows,
    hostedOpenings: doors + windows,
    floatingOpenings,
    semanticRooms: semanticRooms.length,
    roomSlabs: semanticRooms.length,
    ...coverage,
    graphEdgesMaterialized,
    graphEdgeCoverage,
    inferredWallThicknessEdges: inferredWallThickness.length,
    fallbackWallThicknessEdges: Math.max(0, graphEdgesMaterialized - inferredWallThickness.length),
    wallThicknessCoverage: graphEdgesMaterialized ? inferredWallThickness.length / graphEdgesMaterialized : 0,
    medianInferredWallThickness: wallThicknessMaterialization.medianThickness,
    degraded,
  }

  if (graphEdgeCoverage !== 1) {
    return {
      scene: null,
      graph,
      diagnostics,
      reason: `Pascal fidelity gate failed: wallCoverage=${coverage.representedCadWallEntities}/${coverage.cadWallEntities}, graphEdges=${graphEdgesMaterialized}/${graph.edges.length}`,
    }
  }

  const scene: ArchitectureScene = {
    nodes,
    rootNodeIds: [siteId],
    metadata: {
      source: 'cad-pascal-semantic-v3.2',
      runtime: 'pascal-beta.5',
      cadGeometryReady: true,
      cadFloorGraphVersion: '2.1',
      semanticRoomRecoveryVersion: '2.2',
      pascalSemanticIntegrationVersion: '3.2',
      cadFidelityVersion: '3.2',
      cadOpeningMaterializationVersion: '3.1',
      cadWallThicknessMaterializationVersion: '3.2',
      pascalNodeIdCompatibilityVersion: '2.7',
      cadSourceFilename: document.source.filename,
      degraded,
      unresolvedOpenings: graph.openings.filter((opening) => !opening.hostEdgeId).map((opening) => ({ entityId: opening.entityId, kind: opening.kind })),
      cadDoorOrientations,
      cadWallThickness: {
        analysis: {
          pairedEdges: wallThicknessAnalysis.pairedEdges,
          totalEdges: wallThicknessAnalysis.totalEdges,
          coverage: wallThicknessAnalysis.coverage,
          medianThickness: wallThicknessAnalysis.medianThickness,
          highConfidencePairs: wallThicknessAnalysis.highConfidencePairs,
        },
        materialization: {
          acceptedPairs: wallThicknessMaterialization.acceptedPairs,
          acceptedEdges: wallThicknessMaterialization.acceptedEdges,
          totalEdges: wallThicknessMaterialization.totalEdges,
          coverage: wallThicknessMaterialization.coverage,
          medianThickness: wallThicknessMaterialization.medianThickness,
        },
        inferredWalls: inferredWallThickness,
      },
      diagnostics,
      semanticRooms: semanticRooms.map((room) => ({ id: room.id, labelEntityId: room.labelEntityId, label: room.label, seed: room.seed, area: room.area, confidence: room.confidence })),
    },
  }
  return { scene, graph, diagnostics, reason: degraded ? `Verified CAD scene created with ${floatingOpenings} unresolved opening(s); unresolved openings were not fabricated in 3D.` : null }
}
