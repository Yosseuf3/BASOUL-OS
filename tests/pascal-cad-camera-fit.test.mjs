import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('Pascal runtime derives camera framing from live scene bounds', () => {
  assert.match(viewer, /scenePlanBounds\(scene\)/)
  assert.match(viewer, /<BasoulCamera sceneKey=\{sceneKey\} scene=\{activeScene\} \/>/)
  assert.match(viewer, /centerX = \(bounds\.minX \+ bounds\.maxX\) \/ 2/)
  assert.match(viewer, /centerZ = \(bounds\.minY \+ bounds\.maxY\) \/ 2/)
  assert.match(viewer, /span = Math\.max\(width, depth, 8\)/)
})

test('live CAD framing is not anchored to the starter-scene target', () => {
  const cameraBlock = viewer.slice(viewer.indexOf('function BasoulCamera'), viewer.indexOf('function BasoulDirectSelection'))
  assert.match(cameraBlock, /if \(!bounds\)/)
  assert.match(cameraBlock, /setLookAt\(\s*centerX \+ offset,/)
})
