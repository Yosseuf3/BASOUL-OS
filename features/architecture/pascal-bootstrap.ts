import { type AnyNodeDefinition, nodeRegistry, registerNode } from '@pascal-app/core'
import {
  buildingDefinition,
  doorDefinition,
  levelDefinition,
  siteDefinition,
  slabDefinition,
  wallDefinition,
  windowDefinition,
} from '@pascal-app/nodes'

let builtinsLoaded = false

export function ensurePascalBuiltins(): void {
  if (builtinsLoaded) return
  builtinsLoaded = true

  const starterDefinitions = [
    siteDefinition,
    buildingDefinition,
    levelDefinition,
    slabDefinition,
    wallDefinition,
    windowDefinition,
    doorDefinition,
  ]

  for (const definition of starterDefinitions) {
    registerNode(definition as AnyNodeDefinition)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[basoul:architecture] Pascal registry ready (${nodeRegistry.size} node kinds)`)
  }
}
