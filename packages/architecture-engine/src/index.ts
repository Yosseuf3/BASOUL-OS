export type ArchitectureNodeKind =
  | 'site'
  | 'building'
  | 'level'
  | 'wall'
  | 'slab'
  | 'door'
  | 'window'
  | 'roof'
  | 'stair'
  | 'column'
  | 'item'

export interface ArchitectureNode {
  id: string
  type: ArchitectureNodeKind | string
  parentId?: string | null
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface ArchitectureScene {
  nodes: Record<string, ArchitectureNode>
  rootNodeIds: string[]
  metadata?: Record<string, unknown>
}

export interface ArchitectureViewerPort {
  mount(target: HTMLElement, scene: ArchitectureScene): Promise<void> | void
  update(scene: ArchitectureScene): Promise<void> | void
  dispose(): Promise<void> | void
}

export interface ArchitectureEnginePort {
  normalize(scene: ArchitectureScene): ArchitectureScene
  validate(scene: ArchitectureScene): ArchitectureValidationResult
  createViewer(): ArchitectureViewerPort
}

export interface ArchitectureValidationIssue {
  code: string
  message: string
  nodeId?: string
  severity: 'error' | 'warning'
}

export interface ArchitectureValidationResult {
  valid: boolean
  issues: ArchitectureValidationIssue[]
}

export interface PascalRuntimePort {
  normalizeScene(scene: ArchitectureScene): ArchitectureScene
  createViewer(): ArchitectureViewerPort
}

export class PascalArchitectureAdapter implements ArchitectureEnginePort {
  constructor(private readonly runtime: PascalRuntimePort) {}

  normalize(scene: ArchitectureScene): ArchitectureScene {
    return this.runtime.normalizeScene(scene)
  }

  validate(scene: ArchitectureScene): ArchitectureValidationResult {
    const issues: ArchitectureValidationIssue[] = []

    if (!scene || typeof scene !== 'object') {
      return {
        valid: false,
        issues: [{ code: 'scene.invalid', message: 'Scene must be an object.', severity: 'error' }],
      }
    }

    if (!scene.nodes || typeof scene.nodes !== 'object') {
      issues.push({ code: 'scene.nodes.missing', message: 'Scene nodes are required.', severity: 'error' })
    }

    if (!Array.isArray(scene.rootNodeIds)) {
      issues.push({ code: 'scene.roots.invalid', message: 'rootNodeIds must be an array.', severity: 'error' })
    }

    for (const [id, node] of Object.entries(scene.nodes ?? {})) {
      if (!node || typeof node !== 'object') {
        issues.push({ code: 'node.invalid', message: 'Node must be an object.', nodeId: id, severity: 'error' })
        continue
      }

      if (node.id !== id) {
        issues.push({ code: 'node.id.mismatch', message: 'Node key and node.id must match.', nodeId: id, severity: 'error' })
      }

      if (!node.type) {
        issues.push({ code: 'node.type.missing', message: 'Node type is required.', nodeId: id, severity: 'error' })
      }
    }

    return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
  }

  createViewer(): ArchitectureViewerPort {
    return this.runtime.createViewer()
  }
}

export * from './persistence'
