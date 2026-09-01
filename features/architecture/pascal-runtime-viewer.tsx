'use client'

import {
  BuildingNode,
  DoorNode,
  LevelNode,
  SiteNode,
  SlabNode,
  WallNode,
  WindowNode,
  emitter,
  type AnyNode,
  type AnyNodeId,
  type NodeEvent,
  useScene,
} from '@pascal-app/core'
import { Viewer, useViewer } from '@pascal-app/viewer'
import { CameraControls, Text, TransformControls, type CameraControlsImpl } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import type { ArchitectureScene } from '../../packages/architecture-engine/src/index'
import { editableElementAnchor, translateEditableElement } from './pascal-scene-editing'
import { ensurePascalBuiltins } from './pascal-bootstrap'

ensurePascalBuiltins()

type SemanticRoomLabel = {
  id?: string
  labelEntityId?: string
  label?: string
  seed?: { x?: number; y?: number }
  area?: number
  confidence?: number
}

type ScenePlanBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function isCadPascalScene(scene: ArchitectureScene | null | undefined) {
  const source = scene?.metadata?.source
  return typeof source === 'string' && source.startsWith('cad-pascal-') && scene?.metadata?.cadGeometryReady === true
}

export function PascalRuntimeViewer({
  scene,
  sceneKey = 'basoul-architecture-scene',
  selectedId = '',
  onSelectionChange,
  onSceneChange,
}: {
  scene?: ArchitectureScene | null
  sceneKey?: string
  selectedId?: string
  onSelectionChange?: (nodeId: string) => void
  onSceneChange?: (scene: ArchitectureScene) => void
}) {
  const setScene = useScene((state) => state.setScene)
  const [ready, setReady] = useState(false)
  const activeScene = scene ?? null
  const cadProvenanceReady = isCadPascalScene(activeScene)

  useEffect(() => {
    setReady(false)
    if (!activeScene || !cadProvenanceReady) return
    setScene(activeScene.nodes as Record<AnyNodeId, AnyNode>, activeScene.rootNodeIds as AnyNodeId[])
  }, [activeScene, cadProvenanceReady, setScene])

  if (!activeScene || !cadProvenanceReady) {
    return (
      <section className="bx-panel" aria-label="BASOUL Architecture 3D runtime">
        <header className="bx-panel-head">
          <div>
            <span className="bx-kicker">PASCAL CORE + VIEWER · CAD FIDELITY v2.4</span>
            <h3>3D Runtime</h3>
          </div>
          <div className="bx-hero-tags">
            <span className="bx-chip">SCENE · BLOCKED</span>
            <span className="bx-chip">CAD PROVENANCE · REQUIRED</span>
          </div>
        </header>
        <p role="alert">
          3D is blocked because the active scene is not a verified CAD-derived Pascal scene. Upload DWG/DXF and pass the CAD/Pascal gates; starter or persisted non-CAD scenes are never substituted for CAD geometry.
        </p>
      </section>
    )
  }

  return (
    <section className="bx-panel" aria-label="BASOUL Architecture 3D runtime">
      <header className="bx-panel-head">
        <div>
          <span className="bx-kicker">PASCAL CORE + VIEWER · CAD FIDELITY v2.4</span>
          <h3>3D Runtime</h3>
        </div>
        <div className="bx-hero-tags">
          <span className="bx-chip">CAD PROVENANCE · VERIFIED</span>
          <span className="bx-chip">DIRECT SELECT · LIVE</span>
          <span className="bx-chip">{ready ? 'SCENE · READY' : 'SCENE · LOADING'}</span>
        </div>
      </header>
      <div style={{ height: 'min(68vh, 720px)', minHeight: 420, overflow: 'hidden', borderRadius: 18 }}>
        <Viewer sceneReadyKey={sceneKey} onSceneReadyChange={setReady}>
          <BasoulCamera sceneKey={sceneKey} scene={activeScene} />
          <BasoulSemanticRoomLabels scene={activeScene} />
          <BasoulDirectSelection selectedId={selectedId} onSelectionChange={onSelectionChange} />
          <BasoulDirectManipulator scene={activeScene} selectedId={selectedId} onSceneChange={onSceneChange} />
        </Viewer>
      </div>
      <p>Click a wall, door or window to select it. Drag the 3D gizmo to move the selected element; changes stay local until Save scene is pressed.</p>
    </section>
  )
}

function BasoulSemanticRoomLabels({ scene }: { scene: ArchitectureScene }) {
  const rooms = useMemo(() => {
    const raw = scene.metadata?.semanticRooms
    if (!Array.isArray(raw)) return []
    return raw.flatMap((room, index) => {
      if (!room || typeof room !== 'object') return []
      const value = room as SemanticRoomLabel
      const x = value.seed?.x
      const y = value.seed?.y
      const label = value.label?.trim()
      if (typeof x !== 'number' || typeof y !== 'number' || !label) return []
      return [{ key: value.labelEntityId ?? value.id ?? `semantic-room-label-${index}`, x, y, label }]
    })
  }, [scene.metadata?.semanticRooms])

  return (
    <group name="basoul-semantic-room-labels">
      {rooms.map((room) => (
        <Text
          key={room.key}
          position={[room.x, 0.08, room.y]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.32}
          maxWidth={3.2}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          renderOrder={20}
        >
          {room.label}
        </Text>
      ))}
    </group>
  )
}

function scenePlanBounds(scene: ArchitectureScene): ScenePlanBounds | null {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  const include = (point: unknown) => {
    if (!Array.isArray(point) || point.length < 2) return
    const [x, y] = point
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  for (const node of Object.values(scene.nodes)) {
    if (!node || typeof node !== 'object') continue
    const geometry = node as unknown as { start?: unknown; end?: unknown; polygon?: unknown }
    include(geometry.start)
    include(geometry.end)
    if (Array.isArray(geometry.polygon)) {
      for (const point of geometry.polygon) include(point)
    }
  }

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null
  return { minX, minY, maxX, maxY }
}

function BasoulCamera({ sceneKey, scene }: { sceneKey: string; scene: ArchitectureScene }) {
  const controls = useRef<CameraControlsImpl>(null)
  const inputDragging = useViewer((state) => state.inputDragging)
  const bounds = useMemo(() => scenePlanBounds(scene), [scene])

  useEffect(() => {
    if (!bounds) {
      void controls.current?.setLookAt(12, 9, 12, 4, 1.4, 3, false)
      return
    }

    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerZ = (bounds.minY + bounds.maxY) / 2
    const width = Math.max(bounds.maxX - bounds.minX, 1)
    const depth = Math.max(bounds.maxY - bounds.minY, 1)
    const span = Math.max(width, depth, 8)
    const offset = span * 0.9
    const height = Math.max(span * 1.05, 9)

    void controls.current?.setLookAt(
      centerX + offset,
      height,
      centerZ + offset,
      centerX,
      0.8,
      centerZ,
      false,
    )
  }, [bounds, sceneKey])

  return <CameraControls ref={controls} makeDefault enabled={!inputDragging} />
}

function BasoulDirectSelection({
  selectedId,
  onSelectionChange,
}: {
  selectedId: string
  onSelectionChange?: (nodeId: string) => void
}) {
  const setExternalSelectedIds = useViewer((state) => state.setExternalSelectedIds)

  useEffect(() => {
    setExternalSelectedIds(selectedId ? [selectedId] : [])
    return () => setExternalSelectedIds([])
  }, [selectedId, setExternalSelectedIds])

  useEffect(() => {
    const handleClick = (event: NodeEvent) => {
      event.stopPropagation()
      onSelectionChange?.(event.node.id)
    }
    const kinds = ['wall', 'door', 'window'] as const
    for (const kind of kinds) emitter.on(`${kind}:click` as never, handleClick as never)
    return () => {
      for (const kind of kinds) emitter.off(`${kind}:click` as never, handleClick as never)
    }
  }, [onSelectionChange])

  return null
}

function BasoulDirectManipulator({
  scene,
  selectedId,
  onSceneChange,
}: {
  scene: ArchitectureScene
  selectedId: string
  onSceneChange?: (scene: ArchitectureScene) => void
}) {
  const gizmo = useRef<Group>(null)
  const anchor = useMemo(() => editableElementAnchor(scene, selectedId), [scene, selectedId])
  const dragStart = useRef<[number, number, number] | null>(null)
  const setInputDragging = useViewer((state) => state.setInputDragging)

  useEffect(() => {
    if (!gizmo.current || !anchor) return
    gizmo.current.position.set(anchor[0], anchor[1], anchor[2])
  }, [anchor])

  useEffect(() => () => setInputDragging(false), [setInputDragging])

  if (!selectedId || !anchor || !onSceneChange) return null

  function beginDrag() {
    if (!gizmo.current) return
    dragStart.current = [gizmo.current.position.x, gizmo.current.position.y, gizmo.current.position.z]
    setInputDragging(true)
  }

  function finishDrag() {
    setInputDragging(false)
    const start = dragStart.current
    const object = gizmo.current
    dragStart.current = null
    if (!start || !object) return
    const delta = {
      x: object.position.x - start[0],
      y: object.position.y - start[1],
      z: object.position.z - start[2],
    }
    if (Math.hypot(delta.x, delta.y, delta.z) < 0.001) return
    onSceneChange?.(translateEditableElement(scene, selectedId, delta))
  }

  return (
    <TransformControls
      mode="translate"
      translationSnap={0.1}
      size={0.82}
      onMouseDown={beginDrag}
      onMouseUp={finishDrag}
    >
      <group ref={gizmo} position={anchor}>
        <mesh>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial transparent opacity={0.68} depthTest={false} />
        </mesh>
      </group>
    </TransformControls>
  )
}

export function createBasoulStarterScene(): ArchitectureScene {
  const parsedNodes: AnyNode[] = [
    SiteNode.parse({ id: 'site_basoul', parentId: null, children: ['building_basoul'] }),
    BuildingNode.parse({ id: 'building_basoul', parentId: site_basoul, children: ['level_ground'], position: [0, 0, 0], rotation: [0, 0, 0] }),
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

  return { nodes, rootNodeIds: ['site_basoul'], metadata: { owner: 'BASOUL', runtime: 'pascal-beta.5', source: 'starter-scene' } }
}
