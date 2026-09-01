'use client'

import {
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

type WallGeometry = {
  id?: string
  type?: string
  start?: [number, number]
  end?: [number, number]
  thickness?: number
}

type DoorGeometry = {
  id?: string
  type?: string
  parentId?: string | null
  wallId?: string
  position?: [number, number, number]
  width?: number
  height?: number
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

  if (!activeScene || !cadProvenanceReady) return null

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
          <BasoulCadDoorLeaves scene={activeScene} selectedId={selectedId} onSelectionChange={onSelectionChange} />
          <BasoulDirectSelection selectedId={selectedId} onSelectionChange={onSelectionChange} />
          <BasoulDirectManipulator scene={activeScene} selectedId={selectedId} onSceneChange={onSceneChange} />
        </Viewer>
      </div>
      <p>Click a wall, door or window to select it. Drag the 3D gizmo to move the selected element; changes stay local until Save scene is pressed.</p>
    </section>
  )
}

function BasoulCadDoorLeaves({ scene, selectedId, onSelectionChange }: { scene: ArchitectureScene; selectedId: string; onSelectionChange?: (nodeId: string) => void }) {
  const doors = useMemo(() => {
    const result: Array<{ id: string; x: number; z: number; y: number; width: number; height: number; rotationY: number; thickness: number }> = []
    for (const raw of Object.values(scene.nodes)) {
      const door = raw as unknown as DoorGeometry
      if (String(door.type) !== 'door' || !door.id || !Array.isArray(door.position)) continue
      const wallRaw = scene.nodes[String(door.wallId ?? door.parentId ?? '')]
      const wall = wallRaw as unknown as WallGeometry | undefined
      if (!wall || !Array.isArray(wall.start) || !Array.isArray(wall.end)) continue
      const [sx, sy] = wall.start
      const [ex, ey] = wall.end
      const dx = ex - sx
      const dy = ey - sy
      const length = Math.hypot(dx, dy)
      if (length <= 1e-9) continue
      const along = Math.max(0, Math.min(length, Number(door.position[0]) || 0))
      const ux = dx / length
      const uy = dy / length
      const normalX = -uy
      const normalY = ux
      const wallThickness = typeof wall.thickness === 'number' && wall.thickness > 0 ? wall.thickness : 0.2
      const width = typeof door.width === 'number' && door.width > 0 ? door.width : 1
      const height = typeof door.height === 'number' && door.height > 0 ? door.height : 2.2
      result.push({
        id: door.id,
        x: sx + ux * along + normalX * 0.01,
        z: sy + uy * along + normalY * 0.01,
        y: height / 2,
        width,
        height,
        rotationY: -Math.atan2(dy, dx),
        thickness: Math.max(0.045, Math.min(0.09, wallThickness * 0.35)),
      })
    }
    return result
  }, [scene])

  return (
    <group name="basoul-cad-door-leaves">
      {doors.map((door) => (
        <group key={door.id} position={[door.x, door.y, door.z]} rotation={[0, door.rotationY, 0]}>
          <mesh
            onClick={(event) => { event.stopPropagation(); onSelectionChange?.(door.id) }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[door.width, door.height, door.thickness]} />
            <meshStandardMaterial color={selectedId === door.id ? '#4fc3f7' : '#8b684d'} roughness={0.72} metalness={0.02} />
          </mesh>
          <mesh position={[door.width * 0.36, 0, door.thickness * 0.7]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#d6b36a" metalness={0.55} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
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
    const dx = object.position.x - start[0]
    const dz = object.position.z - start[2]
    if (Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6) return
    onSceneChange?.(translateEditableElement(scene, selectedId, { x: dx, y: 0, z: dz }))
  }

  return (
    <TransformControls mode="translate" showY={false} onMouseDown={beginDrag} onMouseUp={finishDrag}>
      <group ref={gizmo}>
        <mesh>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial transparent opacity={0.68} depthTest={false} />
        </mesh>
      </group>
    </TransformControls>
  )
}
