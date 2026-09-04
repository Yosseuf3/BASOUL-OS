import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const swing = await readFile(new URL('../features/architecture/cad-door-swing.ts', import.meta.url), 'utf8')
const semantic = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('native CAD door swing requires explicit arc and leaf geometry with confidence gate', () => {
  assert.match(swing, /primitive\.type === 'ARC'/)
  assert.match(swing, /primitive\.type === 'LINE'/)
  assert.match(swing, /confidence < 0\.82/)
  assert.match(swing, /radius >= 0\.45 && primitive\.radius <= 2\.5/)
  assert.doesNotMatch(swing, /fallback.*swing/i)
})

test('Pascal scene prefers native swing but preserves insert rotation fallback', () => {
  assert.match(semantic, /analyzeCadDoorSwings/)
  assert.match(semantic, /nativeSwing\?\.openAngleRadians \?\? insertRotation/)
  assert.match(semantic, /cadDoorSwingVersion:'3\.3'/)
  assert.match(semantic, /doorSwingCoverage/)
})

test('3D door leaf anchors at the CAD hinge only when native swing confidence passes', () => {
  assert.match(viewer, /swing\.confidence >= 0\.82/)
  assert.match(viewer, /hingeAnchored/)
  assert.match(viewer, /position=\{door\.hingeAnchored \? \[door\.width \/ 2, 0, 0\]/)
  assert.match(viewer, /rotationY: nativeSwingReady \? -swing!\.openAngleRadians!/)
})
