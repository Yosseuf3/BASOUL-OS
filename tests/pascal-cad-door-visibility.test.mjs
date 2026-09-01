import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('verified CAD doors render as visible leaves in the Pascal viewer', () => {
  assert.match(viewer, /BasoulCadDoorLeaves/)
  assert.match(viewer, /String\(door\.type\) !== 'door'/)
  assert.match(viewer, /door\.wallId \?\? door\.parentId/)
  assert.match(viewer, /boxGeometry args=\{\[door\.width, door\.height, door\.thickness\]\}/)
  assert.match(viewer, /onSelectionChange\?\.\(door\.id\)/)
})
