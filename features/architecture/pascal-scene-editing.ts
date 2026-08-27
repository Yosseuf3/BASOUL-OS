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
