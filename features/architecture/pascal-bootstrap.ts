import { type AnyNodeDefinition, nodeRegistry, registerNode } from '@pascal-app/core'
import { builtinPlugin } from '@pascal-app/nodes'

let builtinsLoaded = false

export function ensurePascalBuiltins(): void {
  if (builtinsLoaded) return
  builtinsLoaded = true

  for (const definition of builtinPlugin.nodes ?? []) {
    registerNode(definition as AnyNodeDefinition)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[basoul:architecture] Pascal registry ready (${nodeRegistry.size} node kinds)`)
  }
}
