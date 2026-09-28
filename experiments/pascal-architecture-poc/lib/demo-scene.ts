import type { AnyNode, AnyNodeId } from '@pascal-app/core/schema'

type SceneGraph = {
  nodes: Record<AnyNodeId, AnyNode>
  rootNodeIds: AnyNodeId[]
}

const levelId = 'level_basoul' as AnyNodeId

function wall(id: string, start: [number, number], end: [number, number], children: string[] = []) {
  return {
    object: 'node', id, type: 'wall', parentId: levelId, visible: true, metadata: {},
    children, thickness: 0.2, start, end, frontSide: 'unknown', backSide: 'unknown',
  } as unknown as AnyNode
}

export function createBasoulDemoScene(): SceneGraph {
  const nodes = {} as Record<AnyNodeId, AnyNode>

  nodes.site_basoul as never
  Object.assign(nodes, {
    site_basoul: {
      object: 'node', id: 'site_basoul', type: 'site', parentId: null, visible: true, metadata: {},
      polygon: { type: 'polygon', points: [[-8,-8],[8,-8],[8,8],[-8,8]] }, children: ['building_basoul'],
    },
    building_basoul: {
      object: 'node', id: 'building_basoul', type: 'building', parentId: 'site_basoul', visible: true,
      metadata: {}, position: [0,0,0], rotation: [0,0,0], children: ['level_basoul'],
    },
    level_basoul: {
      object: 'node', id: 'level_basoul', type: 'level', parentId: 'building_basoul', visible: true,
      metadata: {}, level: 0, height: 3, children: ['wall_n','wall_e','wall_s','wall_w','slab_main','door_main','window_n'],
    },
    wall_n: wall('wall_n', [-3,-2.5], [3,-2.5], ['window_n']),
    wall_e: wall('wall_e', [3,-2.5], [3,2.5]),
    wall_s: wall('wall_s', [3,2.5], [-3,2.5], ['door_main']),
    wall_w: wall('wall_w', [-3,2.5], [-3,-2.5]),
    slab_main: {
      object: 'node', id: 'slab_main', type: 'slab', parentId: 'level_basoul', visible: true, metadata: {},
      polygon: [[-3,-2.5],[3,-2.5],[3,2.5],[-3,2.5]], holes: [], holeMetadata: [], elevation: 0.05,
      thickness: 0.15, recessed: false, autoFromWalls: false,
    },
    door_main: {
      object: 'node', id: 'door_main', type: 'door', parentId: 'wall_s', visible: true, metadata: {}, wallId: 'wall_s',
      position: [0,1.05,0], rotation: [0,0,0], width: 1, height: 2.1, frameThickness: 0.05,
      frameDepth: 0.07, threshold: true, thresholdHeight: 0.02, hingesSide: 'left', swingDirection: 'inward',
      segments: [], handle: true, handleHeight: 1.05, handleSide: 'right', contentPadding: [0.04,0.04],
      doorCloser: false, panicBar: false, panicBarHeight: 1,
    },
    window_n: {
      object: 'node', id: 'window_n', type: 'window', parentId: 'wall_n', visible: true, metadata: {}, wallId: 'wall_n',
      position: [0,1.4,0], rotation: [0,0,0], width: 1.5, height: 1.2, frameThickness: 0.05,
      frameDepth: 0.07, columnRatios: [1], rowRatios: [1], columnDividerThickness: 0.03,
      rowDividerThickness: 0.03, sill: true, sillDepth: 0.08, sillThickness: 0.03,
    },
  })

  return { nodes, rootNodeIds: ['site_basoul' as AnyNodeId] }
}
