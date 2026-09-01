import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('Pascal runtime never substitutes starter geometry for CAD', () => {
  assert.match(viewer, /const activeScene = scene \?\? null/)
  assert.doesNotMatch(viewer, /const activeScene = scene \?\? createBasoulStarterScene\(\)/)
  assert.match(viewer, /CAD PROVENANCE · REQUIRED/)
  assert.match(viewer, /source\.startsWith\('cad-pascal-'\)/)
  assert.match(viewer, /cadGeometryReady === true/)
  assert.match(viewer, /if \(!activeScene \|\| !cadProvenanceReady\) return/)
  assert.match(viewer, /SCENE · BLOCKED/)
})

test('starter scene is explicitly marked non-CAD', () => {
  assert.match(viewer, /source: 'starter-scene'/)
  assert.match(viewer, /CAD PROVENANCE · VERIFIED/)
})
