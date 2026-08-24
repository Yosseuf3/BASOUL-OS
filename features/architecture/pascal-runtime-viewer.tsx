'use client'

import { type AnyNode, type AnyNodeId, useScene } from '@pascal-app/core'
import { Viewer } from '@pascal-app/viewer'
import { CameraControls } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import type { ArchitectureScene } from '../../packages/architecture-engine/src/index'
import { ensurePascalBuiltins } from './pascal-bootstrap'

ensurePascalBuiltins()

export function PascalRuntimeViewer() {
  const setScene = useScene((state) => state.setScene)
  const [ready, setReady] = useState(false)
  const scene = useMemo(() => createBasoulStarterScene(), [])

  useEffect(() => {
    setScene(scene.nodes as Record<AnyNodeId, AnyNode>, scene.rootNodeIds as AnyNodeId[])
  }, [scene, setScene])

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
        <Viewer sceneReadyKey="basoul-starter-v1" onSceneReadyChange={setReady}>
          <CameraControls makeDefault />
        </Viewer>
      </div>
      <p>Live BASOUL-owned starter scene: building, level, four walls, slab, door and window. No Production persistence is activated.</p>
    </section>
  )
}

function createBasoulStarterScene(): ArchitectureScene {
  const nodes: ArchitectureScene['nodes'] = {
    site_basoul: { object: 'node', id: 'site_basoul', type: 'site', parentId: null, children: ['building_basoul'], visible: true, metadata: {} },
    building_basoul: { object: 'node', id: 'building_basoul', type: 'building', parentId: 'site_basoul', children: ['level_ground'], visible: true, metadata: {} },
    level_ground: { object: 'node', id: 'level_ground', type: 'level', parentId: 'building_basoul', children: ['slab_ground', 'wall_north', 'wall_east', 'wall_south', 'wall_west'], visible: true, metadata: {}, name: 'Ground', baseElevation: 0, height: 3.2 },
    slab_ground: { object: 'node', id: 'slab_ground', type: 'slab', parentId: 'level_ground', children: [], visible: true, metadata: {}, points: [[0,0],[8,0],[8,6],[0,6]], thickness: 0.2, elevation: 0 },
    wall_north: { object: 'node', id: 'wall_north', type: 'wall', parentId: 'level_ground', children: ['window_north'], visible: true, metadata: {}, start: [0,0], end: [8,0], height: 3.2, thickness: 0.2 },
    wall_east: { object: 'node', id: 'wall_east', type: 'wall', parentId: 'level_ground', children: [], visible: true, metadata: {}, start: [8,0], end: [8,6], height: 3.2, thickness: 0.2 },
    wall_south: { object: 'node', id: 'wall_south', type: 'wall', parentId: 'level_ground', children: ['door_south'], visible: true, metadata: {}, start: [8,6], end: [0,6], height: 3.2, thickness: 0.2 },
    wall_west: { object: 'node', id: 'wall_west', type: 'wall', parentId: 'level_ground', children: [], visible: true, metadata: {}, start: [0,6], end: [0,0], height: 3.2, thickness: 0.2 },
    window_north: { object: 'node', id: 'window_north', type: 'window', parentId: 'wall_north', children: [], visible: true, metadata: {}, position: 0.5, width: 1.5, height: 1.4, sillHeight: 0.9 },
    door_south: { object: 'node', id: 'door_south', type: 'door', parentId: 'wall_south', children: [], visible: true, metadata: {}, position: 0.5, width: 1.0, height: 2.2 },
  }

  return { nodes, rootNodeIds: ['site_basoul'], metadata: { owner: 'BASOUL', runtime: 'pascal-beta.5' } }
}
