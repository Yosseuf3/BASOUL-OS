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

function boundsWidth(entity: NormalizedCadDocument['entities'][number]) {
  const raw = entity.metadata?.insertBounds
  if (!raw || typeof raw !== 'object') return entity.type === 'INSERT' ? 1 : 0.9
  const bounds = raw as { min?: Partial<CadPoint>; max?: Partial<CadPoint> }
  if (typeof bounds.min?.x !== 'number' || typeof bounds.min?.y !== 'number' || typeof bounds.max?.x !== 'number' || typeof bounds.max?.y !== 'number') return 1
  const width = Math.max(Math.abs(bounds.max.x - bounds.min.x), Math.abs(bounds.max.y - bounds.min.y))
  return Math.max(0.45, Math.min(3, width || 1))
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
        hostedOpenings: 0,
        floatingOpenings: graph.openings.filter((opening) => !opening.hostEdgeId).length,
        semanticRooms: 0,
        roomSlabs: 0,
        ...coverage,
        graphEdgesMaterialized: 0,
        graphEdgeCoverage: 0,
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

  const semanticRooms = recoverSemanticRooms(document)
  const siteId = 'cad-pascal:site'
  const buildingId = 'cad-pascal:building'
  const levelId = 'cad-pascal:level:0'
  const wallIds = graph.edges.map((edge) => `cad-pascal:wall:${edge.id}`)
  const slabIds = semanticRooms.map((room) => `cad-pascal:slab:${room.labelEntityId}`)
  const levelChildren = [...wallIds, ...slabIds]

  const parsed: AnyNode[] = [
    SiteNode.parse({ id: siteId, parentId: null, children: [buildingId] }),
    BuildingNode.parse({ id: buildingId, parentId: siteId, children: [levelId], position: [0, 0, 0], rotation: [0, 0, 0] }),
    LevelNode.parse({ id: levelId, parentId: buildingId, children: levelChildren, name: 'CAD Ground Floor', level: 0, baseElevation: 0, height: WALL_HEIGHT }),
  ]

  let doors = 0
  let windows = 0
  let graphEdgesMaterialized = 0
  for (const edge of graph.edges) {
    const a = vertices.get(edge.a)
    const b = vertices.get(edge.b)
    if (!a || !b) continue
    const wallId = `cad-pascal:wall:${edge.id}`
    const hosted = openingsByEdge.get(edge.id) ?? []
    const children = hosted.map((opening) => `cad-pascal:${opening.kind}:${opening.entityId}`)
    parsed.push(WallNode.parse({
      id: wallId,
      parentId: levelId,
      children,
      start: [a.x, a.y],
      end: [b.x, b.y],
      height: WALL_HEIGHT,
      thickness: WALL_THICKNESS,
    }))
    graphEdgesMaterialized += 1

    for (const opening of hosted) {
      const entity = entities.get(opening.entityId)
      const point = entity?.insert ?? entity?.points?.[0]
      if (!entity || !point) continue
      const id = `cad-pascal:${opening.kind}:${opening.entityId}`
      const along = distanceAlongWall(point, a, b)
      const width = boundsWidth(entity)
      if (opening.kind === 'door') {
        parsed.push(DoorNode.parse({
          id,
          parentId: wallId,
          wallId,
          position: [along, DOOR_HEIGHT / 2, 0],
          rotation: [0, 0, 0],
          width,
          height: DOOR_HEIGHT,
        }))
        doors += 1
      } else {
        parsed.push(WindowNode.parse({
          id,
          parentId: wallId,
          wallId,
          position: [along, WINDOW_SILL + WINDOW_HEIGHT / 2, 0],
          rotation: [0, 0, 0],
          width,
          height: WINDOW_HEIGHT,
        }))
        windows += 1
      }
    }
  }

  for (const room of semanticRooms) {
    parsed.push(SlabNode.parse({
      id: `cad-pascal:slab:${room.labelEntityId}`,
      parentId: levelId,
      polygon: room.boundary.map((point) => [point.x, point.y]),
      thickness: 0.12,
      elevation: 0,
    }))
  }

  const nodes = Object.fromEntries(parsed.map((node) => [node.id, asSceneNode(node)]))
  const floatingOpenings = graph.openings.filter((opening) => !opening.hostEdgeId).length
  const graphEdgeCoverage = graph.edges.length ? graphEdgesMaterialized / graph.edges.length : 0
  const diagnostics: PascalSemanticCadDiagnostics = {
    walls: graphEdgesMaterialized,
    doors,
    windows,
    hostedOpenings: doors + windows,
    floatingOpenings,
    semanticRooms: semanticRooms.length,
    roomSlabs: semanticRooms.length,
    ...coverage,
    graphEdgesMaterialized,
    graphEdgeCoverage,
  }

  const expectedDoors = document.entities.filter((entity) => classifyCadEntity(entity).kind === 'door').length
  const expectedWindows = document.entities.filter((entity) => classifyCadEntity(entity).kind === 'window').length

  // v2.3 semantic compatibility gate remains exact; v2.4 fidelity is additive.
  if (floatingOpenings || doors !== expectedDoors || windows !== expectedWindows) {
    return {
      scene: null,
      graph,
      diagnostics,
      reason: `Pascal semantic gate failed: floating=${floatingOpenings}, doors=${doors}/${expectedDoors}, windows=${windows}/${expectedWindows}`,
    }
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
      source: 'cad-pascal-semantic-v2.3',
      runtime: 'pascal-beta.5',
      cadGeometryReady: true,
      cadFloorGraphVersion: '2.1',
      semanticRoomRecoveryVersion: '2.2',
      pascalSemanticIntegrationVersion: '2.3',
      cadFidelityVersion: '2.4',
      cadSourceFilename: document.source.filename,
      diagnostics,
      semanticRooms: semanticRooms.map((room) => ({
        id: room.id,
        labelEntityId: room.labelEntityId,
        label: room.label,
        seed: room.seed,
        area: room.area,
        confidence: room.confidence,
      })),
    },
  }
  return { scene, graph, diagnostics, reason: null }
}
