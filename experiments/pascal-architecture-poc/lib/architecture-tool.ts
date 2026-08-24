export type ArchitecturePermission = 'architecture.read' | 'architecture.edit'

export type ArchitectureActor = {
  organizationId: string
  permissions: ArchitecturePermission[]
}

type SceneNode = Record<string, unknown> & {
  id: string
  type: string
  parentId?: string | null
  children?: string[]
}

export type ArchitectureScene = {
  nodes: Record<string, SceneNode>
  rootNodeIds: string[]
}

export type AddWindowInput = {
  wallId: string
  width: number
  height?: number
  sillHeight?: number
  positionAlongWall?: number
}

function assertCanEdit(actor: ArchitectureActor) {
  if (!actor.organizationId) throw new Error('organization_required')
  if (!actor.permissions.includes('architecture.edit')) throw new Error('architecture_edit_forbidden')
}

export function addWindowTool(
  actor: ArchitectureActor,
  scene: ArchitectureScene,
  input: AddWindowInput,
): ArchitectureScene {
  assertCanEdit(actor)

  const wall = scene.nodes[input.wallId]
  if (!wall || wall.type !== 'wall') throw new Error('wall_not_found')
  if (!Number.isFinite(input.width) || input.width <= 0 || input.width > 12) {
    throw new Error('invalid_window_width')
  }

  const height = input.height ?? 1.2
  const sillHeight = input.sillHeight ?? 0.9
  const positionAlongWall = input.positionAlongWall ?? 0
  if (height <= 0 || height > 6 || sillHeight < 0 || positionAlongWall < -100 || positionAlongWall > 100) {
    throw new Error('invalid_window_geometry')
  }

  const id = `window_basoul_${crypto.randomUUID().replaceAll('-', '')}`
  const windowNode: SceneNode = {
    object: 'node',
    id,
    type: 'window',
    parentId: input.wallId,
    visible: true,
    metadata: {
      source: 'basoul-ai-tool',
      organizationId: actor.organizationId,
    },
    wallId: input.wallId,
    position: [positionAlongWall, sillHeight + height / 2, 0],
    rotation: [0, 0, 0],
    width: input.width,
    height,
    frameThickness: 0.05,
    frameDepth: 0.07,
    columnRatios: [1],
    rowRatios: [1],
    columnDividerThickness: 0.03,
    rowDividerThickness: 0.03,
    sill: true,
    sillDepth: 0.08,
    sillThickness: 0.03,
  }

  return {
    ...scene,
    nodes: {
      ...scene.nodes,
      [input.wallId]: {
        ...wall,
        children: [...(wall.children ?? []), id],
      },
      [id]: windowNode,
    },
  }
}
