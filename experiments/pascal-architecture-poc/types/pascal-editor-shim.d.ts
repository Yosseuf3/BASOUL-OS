declare module '@pascal-app/editor' {
  import type { ComponentType } from 'react'

  export type SceneGraph = {
    nodes: Record<string, unknown>
    rootNodeIds: string[]
  }

  export type EditorProps = {
    layoutVersion?: 'v1' | 'v2'
    projectId?: string | null
    onLoad?: () => Promise<SceneGraph | null>
    onSave?: (scene: SceneGraph, options?: { keepalive?: boolean }) => Promise<void>
  }

  export const Editor: ComponentType<EditorProps>
}
