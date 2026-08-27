'use client'

import {
  BuildingNode,
  DoorNode,
  LevelNode,
  SiteNode,
  SlabNode,
  WallNode,
  WindowNode,
  type AnyNode,
  type AnyNodeId,
  useScene,
} from '@pascal-app/core'
import { Viewer } from '@pascal-app/viewer'
import { CameraControls, type CameraControlsImpl } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import type { ArchitectureScene } from '../../packages/architecture-engine/src/index'
import { ensurePascalBuiltins } from './pascal-bootstrap'

ensurePascalBuiltins()

export function PascalRuntimeViewer({
  scene,
  sceneKey = 'basoul-architecture-scene',
}: {
  scene?: ArchitectureScene | null
  sceneKey?: string
}) {
  const setScene = useScene((state) => state.setScene)
  const [ready, setReady] = useState(false)
  const activeScene = scene ?? createBasoulStarterScene()

  useEffect(() => {
    setReady(false)
    setScene(activeScene.nodes as Record<AnyNodeId, AnyNode>, activeScene.rootNodeIds as AnyNodeId[])
  }, [activeScene, setScene])

  return (
    <section className="bx-panel" aria-label="BASOUL Architecture 3D runtime">
      <header className="bx-panel-head">
        <div>
          <span className="bx-kicker">PASCAL CORE + VIEWER · PINNED BETA.5</span>
          <h3>3D Runtime</h3>
        </div>
        <span className="bx-chip">{ready ? 'SCENE · READY' : 'SCENE · LOADING'}</span>
      </header>
      <div style={{ height: 'min(68vh, 720px)', minHeight: 420, overflow: 'hidden', borderRadius: 18 }}>
        <Viewer sceneReadyKey={sceneKey} onSceneReadyChange={setReady}>
          <BasoulCamera sceneKey={sceneKey} />
        </Viewer>
      </div>
      <p>Live BASOUL-owned scene rendered behind the Architecture Engine boundary. Persistence remains tenant/project scoped.</p>
    </section>
  )
}

function BasoulCamera({ sceneKey }: { sceneKey: string }) {
  const controls = useRef<CameraControlsImpl>(null)

  useEffect(() => {
    void controls.current?.setLookAt(12, 9, 12, 4, 1.4, 3, false)
  }, [sceneKey])

  return <CameraControls ref={controls} makeDefault />
}

export function createBasoulStarterScene(): ArchitectureScene {
  const parsedNodes: AnyNode[] = [
    SiteNode.parse({ id: 'site_basoul', parentId: null, children: ['building_basoul'] }),
    BuildingNode.parse({ id: 'building_basoul', parentId: 'site_basoul', children: ['level_ground'], position: [0, 0, 0], rotation: [0, 0, 0] }),
    LevelNode.parse({ id: 'level_ground', parentId: 'building_basoul', children: ['slab_ground', 'wall_north', 'wall_east', 'wall_south', 'wall_west'], name: 'Ground', level: 0, baseElevation: 0, height: 3.2 }),
    SlabNode.parse({ id: 'slab_ground', parentId: 'level_ground', polygon: [[0, 0], [8, 0], [8, 6], [0, 6]], thickness: 0.2, elevation: 0 }),
    WallNode.parse({ id: 'wall_north', parentId: 'level_ground', children: ['window_north'], start: [0, 0], end: [8, 0], height: 3.2, thickness: 0.2 }),
    WallNode.parse({ id: 'wall_east', parentId: 'level_ground', start: [8, 0], end: [8, 6], height: 3.2, thickness: 0.2 }),
    WallNode.parse({ id: 'wall_south', parentId: 'level_ground', children: ['door_south'], start: [8, 6], end: [0, 6], height: 3.2, thickness: 0.2 }),
    WallNode.parse({ id: 'wall_west', parentId: 'level_ground', start: [0, 6], end: [0, 0], height: 3.2, thickness: 0.2 }),
    WindowNode.parse({ id: 'window_north', parentId: 'wall_north', wallId: 'wall_north', position: [4, 1.6, 0], rotation: [0, 0, 0], width: 1.5, height: 1.4 }),
    DoorNode.parse({ id: 'door_south', parentId: 'wall_south', wallId: 'wall_south', position: [4, 1.1, 0], rotation: [0, 0, 0], width: 1, height: 2.2 }),
  ]
  const nodes = Object.fromEntries(parsedNodes.map((node) => [node.id, node])) as unknown as ArchitectureScene['nodes']

  return { nodes, rootNodeIds: ['site_basoul'], metadata: { owner: 'BASOUL', runtime: 'pascal-beta.5' } }
}
