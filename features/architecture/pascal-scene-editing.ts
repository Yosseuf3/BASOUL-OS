import { DoorNode, WallNode, WindowNode, type AnyNode } from '@pascal-app/core'
import type { ArchitectureNode, ArchitectureScene } from '../../packages/architecture-engine/src'
import { ensurePascalBuiltins } from './pascal-bootstrap'

ensurePascalBuiltins()

export type EditableArchitectureKind = 'wall' | 'door' | 'window'

export interface EditableArchitectureElement {
  id: string
  kind: EditableArchitectureKind
  parentId: string | null
  label: string
}

export interface WallGeometryPatch {
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  height?: number
  thickness?: number
}

export interface OpeningGeometryPatch {
  offset?: number
  sill?: number
  width?: number
  height?: number
}

export interface ArchitectureTranslationDelta {
  x: number
  y: number
  z: number
}

function finite(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function positive(value: number | undefined, fallback: number, minimum = 0.05) {
  const next = finite(value, fallback)
  return next >= minimum ? next : fallback
}

function pair(value: unknown): [number, number] | null {
  return Array.isArray(value) && value.length >= 2 && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    ? [value[0] as number, value[1] as number]
    : null
}

function triple(value: unknown): [number, number, number] | null {
  return Array.isArray(value) && value.length >= 3 && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    ? [value[0] as number, value[1] as number, value[2] as number]
    : null
}

function cloneScene(scene: ArchitectureScene): ArchitectureScene {
  return {
    ...scene,
    nodes: Object.fromEntries(Object.entries(scene.nodes).map(([id, node]) => [id, { ...node, children: Array.isArray(node.children) ? [...node.children] : node.children }])),
    rootNodeIds: [...scene.rootNodeIds],
    metadata: scene.metadata ? { ...scene.metadata } : undefined,
  }
}

export function editableArchitectureElements(scene: ArchitectureScene): EditableArchitectureElement[] {
  const elements: EditableArchitectureElement[] = []
  for (const node of Object.values(scene.nodes)) {
    const start = pair(node.start)
    const end = pair(node.end)
    if (start && end) {
      elements.push({ id: node.id, kind: 'wall', parentId: typeof node.parentId === 'string' ? node.parentId : null, label: `Wall · ${node.id}` })
      continue
    }
    if (typeof node.wallId === 'string') {
      const kind: EditableArchitectureKind = String(node.type).toLowerCase().includes('door') || node.id.toLowerCase().includes('door') ? 'door' : 'window'
      elements.push({ id: node.id, kind, parentId: typeof node.parentId === 'string' ? node.parentId : null, label: `${kind === 'door' ? 'Door' : 'Window'} · ${node.id}` })
    }
  }
  return elements
}

export function editableElementAnchor(scene: ArchitectureScene, nodeId: string): [number, number, number] | null {
  const node = scene.nodes[nodeId]
  if (!node) return null

  const start = pair(node.start)
  const end = pair(node.end)
  if (start && end) {
    return [
      (start[0] + end[0]) / 2,
      typeof node.height === 'number' ? node.height / 2 : 1.6,
      (start[1] + end[1]) / 2,
    ]
  }

  if (typeof node.wallId !== 'string') return null
  const wall = scene.nodes[node.wallId]
  const wallStart = pair(wall?.start)
  const wallEnd = pair(wall?.end)
  const position = triple(node.position)
  if (!wallStart || !wallEnd || !position) return null

  const dx = wallEnd[0] - wallStart[0]
  const dz = wallEnd[1] - wallStart[1]
  const length = Math.hypot(dx, dz)
  if (length <= 0.0001) return null
  const ux = dx / length
  const uz = dz / length
  return [wallStart[0] + ux * position[0], position[1], wallStart[1] + uz * position[0]]
}

export function updateWallGeometry(scene: ArchitectureScene, wallId: string, patch: WallGeometryPatch): ArchitectureScene {
  const wall = scene.nodes[wallId]
  const start = pair(wall?.start)
  const end = pair(wall?.end)
  if (!wall || !start || !end) throw new Error('architecture.edit.wall_invalid')

  const parsed = WallNode.parse({
    ...wall,
    start: [finite(patch.startX, start[0]), finite(patch.startY, start[1])],
    end: [finite(patch.endX, end[0]), finite(patch.endY, end[1])],
    height: positive(patch.height, typeof wall.height === 'number' ? wall.height : 3.2),
    thickness: positive(patch.thickness, typeof wall.thickness === 'number' ? wall.thickness : 0.2),
  }) as unknown as ArchitectureNode

  const next = cloneScene(scene)
  next.nodes[wallId] = parsed
  return next
}

export function updateOpeningGeometry(scene: ArchitectureScene, openingId: string, patch: OpeningGeometryPatch): ArchitectureScene {
  const opening = scene.nodes[openingId]
  if (!opening || typeof opening.wallId !== 'string') throw new Error('architecture.edit.opening_invalid')
  const position = triple(opening.position) ?? [0, 1, 0]
  const isDoor = String(opening.type).toLowerCase().includes('door') || opening.id.toLowerCase().includes('door')
  const Parser = isDoor ? DoorNode : WindowNode
  const parsed = Parser.parse({
    ...opening,
    position: [finite(patch.offset, position[0]), finite(patch.sill, position[1]), position[2]],
    width: positive(patch.width, typeof opening.width === 'number' ? opening.width : 1),
    height: positive(patch.height, typeof opening.height === 'number' ? opening.height : 1.4),
  }) as unknown as ArchitectureNode

  const next = cloneScene(scene)
  next.nodes[openingId] = parsed
  return next
}

export function translateEditableElement(scene: ArchitectureScene, nodeId: string, delta: ArchitectureTranslationDelta): ArchitectureScene {
  const node = scene.nodes[nodeId]
  if (!node) throw new Error('architecture.edit.node_missing')

  const start = pair(node.start)
  const end = pair(node.end)
  if (start && end) {
    return updateWallGeometry(scene, nodeId, {
      startX: start[0] + finite(delta.x, 0),
      startY: start[1] + finite(delta.z, 0),
      endX: end[0] + finite(delta.x, 0),
      endY: end[1] + finite(delta.z, 0),
    })
  }

  if (typeof node.wallId !== 'string') throw new Error('architecture.edit.node_not_translatable')
  const wall = scene.nodes[node.wallId]
  const wallStart = pair(wall?.start)
  const wallEnd = pair(wall?.end)
  const position = triple(node.position) ?? [0, 1, 0]
  if (!wallStart || !wallEnd) throw new Error('architecture.edit.wall_invalid')

  const dx = wallEnd[0] - wallStart[0]
  const dz = wallEnd[1] - wallStart[1]
  const wallLength = Math.hypot(dx, dz)
  if (wallLength <= 0.0001) throw new Error('architecture.edit.wall_invalid')
  const alongWall = (finite(delta.x, 0) * dx + finite(delta.z, 0) * dz) / wallLength
  const width = typeof node.width === 'number' ? node.width : 1
  const height = typeof node.height === 'number' ? node.height : 1.4
  const minimumOffset = Math.min(width / 2, wallLength / 2)
  const maximumOffset = Math.max(minimumOffset, wallLength - minimumOffset)
  const nextOffset = Math.min(maximumOffset, Math.max(minimumOffset, position[0] + alongWall))
  const nextVertical = Math.max(height / 2, position[1] + finite(delta.y, 0))

  return updateOpeningGeometry(scene, nodeId, { offset: nextOffset, sill: nextVertical })
}

export function addWall(scene: ArchitectureScene, levelId: string): { scene: ArchitectureScene; nodeId: string } {
  const level = scene.nodes[levelId]
  if (!level) throw new Error('architecture.edit.level_required')
  const id = `wall_${crypto.randomUUID()}`
  const parsed = WallNode.parse({ id, parentId: levelId, start: [0, 0], end: [4, 0], height: 3.2, thickness: 0.2 }) as unknown as ArchitectureNode
  const next = cloneScene(scene)
  next.nodes[id] = parsed
  const children = Array.isArray(next.nodes[levelId]?.children) ? [...(next.nodes[levelId].children as string[])] : []
  next.nodes[levelId] = { ...next.nodes[levelId], children: [...children, id] }
  return { scene: next, nodeId: id }
}

export function addOpening(scene: ArchitectureScene, wallId: string, kind: 'door' | 'window'): { scene: ArchitectureScene; nodeId: string } {
  const wall = scene.nodes[wallId]
  if (!wall || !pair(wall.start) || !pair(wall.end)) throw new Error('architecture.edit.wall_required')
  const id = `${kind}_${crypto.randomUUID()}`
  const parsed = (kind === 'door' ? DoorNode : WindowNode).parse({
    id,
    parentId: wallId,
    wallId,
    position: kind === 'door' ? [2, 1.1, 0] : [2, 1.6, 0],
    rotation: [0, 0, 0],
    width: kind === 'door' ? 1 : 1.5,
    height: kind === 'door' ? 2.2 : 1.4,
  }) as unknown as ArchitectureNode
  const next = cloneScene(scene)
  next.nodes[id] = parsed
  const children = Array.isArray(next.nodes[wallId]?.children) ? [...(next.nodes[wallId].children as string[])] : []
  next.nodes[wallId] = { ...next.nodes[wallId], children: [...children, id] }
  return { scene: next, nodeId: id }
}

export function firstLevelId(scene: ArchitectureScene): string | null {
  const level = Object.values(scene.nodes).find((node) => typeof node.baseElevation === 'number' && typeof node.height === 'number' && !pair(node.start))
  return level?.id ?? null
}

export function removeEditableElement(scene: ArchitectureScene, nodeId: string): ArchitectureScene {
  const node = scene.nodes[nodeId]
  if (!node) return scene
  const next = cloneScene(scene)
  const descendants = new Set<string>()
  const visit = (id: string) => {
    if (descendants.has(id)) return
    descendants.add(id)
    const current = next.nodes[id]
    if (Array.isArray(current?.children)) for (const child of current.children) if (typeof child === 'string') visit(child)
  }
  visit(nodeId)
  for (const id of descendants) delete next.nodes[id]
  if (typeof node.parentId === 'string' && next.nodes[node.parentId]) {
    const parent = next.nodes[node.parentId]
    next.nodes[node.parentId] = { ...parent, children: Array.isArray(parent.children) ? parent.children.filter((id) => !descendants.has(String(id))) : parent.children }
  }
  return next
}

export function asPascalNode(node: ArchitectureNode): AnyNode {
  return node as unknown as AnyNode
}
