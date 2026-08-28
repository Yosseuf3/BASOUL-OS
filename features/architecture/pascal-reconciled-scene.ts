import {
  BuildingNode,
  DoorNode,
  LevelNode,
  SiteNode,
  WallNode,
  WindowNode,
  type AnyNode,
} from '@pascal-app/core'
import type { ArchitectureNode, ArchitectureScene } from '../../packages/architecture-engine/src'
import { ensurePascalBuiltins } from './pascal-bootstrap'

ensurePascalBuiltins()

function asArchitectureNode(node: AnyNode): ArchitectureNode {
  return node as unknown as ArchitectureNode
}

export function normalizeReconciledSceneForPascal(scene: ArchitectureScene): ArchitectureScene {
  const nodes: Record<string, ArchitectureNode> = {}

  for (const node of Object.values(scene.nodes)) {
    switch (String(node.type)) {
      case 'site':
        nodes[node.id] = asArchitectureNode(SiteNode.parse(node))
        break
      case 'building':
        nodes[node.id] = asArchitectureNode(BuildingNode.parse(node))
        break
      case 'level':
        nodes[node.id] = asArchitectureNode(LevelNode.parse(node))
        break
      case 'wall':
        nodes[node.id] = asArchitectureNode(WallNode.parse(node))
        break
      case 'door':
        nodes[node.id] = asArchitectureNode(DoorNode.parse(node))
        break
      case 'window':
        nodes[node.id] = asArchitectureNode(WindowNode.parse(node))
        break
      default:
        nodes[node.id] = { ...node }
        break
    }
  }

  return {
    nodes,
    rootNodeIds: [...scene.rootNodeIds],
    metadata: {
      ...(scene.metadata ?? {}),
      runtime: 'pascal-beta.5',
      normalizedBy: 'BASOUL Pascal adapter',
    },
  }
}
