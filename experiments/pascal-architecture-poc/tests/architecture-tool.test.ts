import assert from 'node:assert/strict'
import test from 'node:test'
import { addWindowTool, type ArchitectureScene } from '../lib/architecture-tool'

const baseScene: ArchitectureScene = {
  rootNodeIds: ['site_1'],
  nodes: {
    site_1: { id: 'site_1', type: 'site', children: ['building_1'] },
    building_1: { id: 'building_1', type: 'building', parentId: 'site_1', children: ['level_1'] },
    level_1: { id: 'level_1', type: 'level', parentId: 'building_1', children: ['wall_1'] },
    wall_1: { id: 'wall_1', type: 'wall', parentId: 'level_1', children: [] },
  },
}

test('architecture tool rejects actors without edit permission', () => {
  assert.throws(
    () => addWindowTool({ organizationId: 'org-a', permissions: ['architecture.read'] }, baseScene, { wallId: 'wall_1', width: 1.5 }),
    /architecture_edit_forbidden/,
  )
})

test('architecture tool adds a bounded window and tags organization', () => {
  const result = addWindowTool(
    { organizationId: 'org-a', permissions: ['architecture.edit'] },
    baseScene,
    { wallId: 'wall_1', width: 1.5, height: 1.2, sillHeight: 0.9 },
  )
  const wall = result.nodes.wall_1
  const newId = wall.children?.[0]
  assert.ok(newId)
  const windowNode = result.nodes[newId]
  assert.equal(windowNode.type, 'window')
  assert.equal(windowNode.width, 1.5)
  assert.deepEqual(windowNode.metadata, { source: 'basoul-ai-tool', organizationId: 'org-a' })
})

test('architecture tool rejects invalid geometry', () => {
  assert.throws(
    () => addWindowTool({ organizationId: 'org-a', permissions: ['architecture.edit'] }, baseScene, { wallId: 'wall_1', width: 100 }),
    /invalid_window_width/,
  )
})
