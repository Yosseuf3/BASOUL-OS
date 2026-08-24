import type { ArchitectureNode, ArchitectureScene } from './index'

export interface ArchitectureActorContext {
  organizationId: string
  userId: string
  permissions: string[]
}

export interface AddWindowInput {
  wallId: string
  width: number
  height: number
  sillHeight?: number
  offset?: number
}

export interface ArchitectureToolResult {
  scene: ArchitectureScene
  audit: {
    action: string
    organizationId: string
    userId: string
    targetId: string
  }
}

function requireEditPermission(actor: ArchitectureActorContext): void {
  if (!actor.permissions.includes('architecture.edit')) {
    throw new Error('architecture.permission.denied')
  }
}

function validateWindowGeometry(input: AddWindowInput): void {
  if (!Number.isFinite(input.width) || input.width <= 0 || input.width > 10) {
    throw new Error('architecture.window.width_invalid')
  }
  if (!Number.isFinite(input.height) || input.height <= 0 || input.height > 10) {
    throw new Error('architecture.window.height_invalid')
  }
  if (input.sillHeight != null && (!Number.isFinite(input.sillHeight) || input.sillHeight < 0 || input.sillHeight > 10)) {
    throw new Error('architecture.window.sill_invalid')
  }
}

export function addWindowTool(
  scene: ArchitectureScene,
  actor: ArchitectureActorContext,
  input: AddWindowInput,
): ArchitectureToolResult {
  requireEditPermission(actor)
  validateWindowGeometry(input)

  if (!actor.organizationId?.trim()) throw new Error('architecture.organization.required')
  if (!actor.userId?.trim()) throw new Error('architecture.user.required')

  const wall = scene.nodes[input.wallId]
  if (!wall || wall.type !== 'wall') throw new Error('architecture.wall.not_found')

  const id = `window:${crypto.randomUUID()}`
  const node: ArchitectureNode = {
    id,
    type: 'window',
    parentId: input.wallId,
    wallId: input.wallId,
    width: input.width,
    height: input.height,
    sillHeight: input.sillHeight ?? 0.9,
    offset: input.offset ?? 0.5,
    metadata: {
      organizationId: actor.organizationId,
      createdBy: actor.userId,
      source: 'basoul-ai-tool',
    },
  }

  return {
    scene: {
      ...scene,
      nodes: {
        ...scene.nodes,
        [id]: node,
      },
    },
    audit: {
      action: 'architecture.window.add',
      organizationId: actor.organizationId,
      userId: actor.userId,
      targetId: id,
    },
  }
}
