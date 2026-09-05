import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('architecture launch readiness keeps CAD provenance and current-file fingerprinting', async () => {
  const ingestion = await source('packages/cad-ingestion/src/index.ts')
  const review = await source('features/architecture/cad-review-panel.tsx')
  const semantic = await source('features/architecture/pascal-cad-semantic-scene.ts')
  assert.match(ingestion, /sourceFingerprint: document\.source\.sha256 \?\? null/)
  assert.match(review, /SHA-256/)
  assert.match(review, /document\.source\.sha256 \?\?/)
  assert.match(review, /document\.source\.filename/)
  assert.match(semantic, /cadSourceFilename/)
})

test('architecture launch readiness preserves native 2D opening geometry before fallbacks', async () => {
  const review = await source('features/architecture/cad-review-panel.tsx')
  const gateway = await source('tools/cad-ingestion/cad_ingest.py')
  assert.match(gateway, /insertGeometry/)
  assert.match(gateway, /virtual_entities/)
  assert.match(review, /insertGeometry/)
  assert.match(review, /CAD INSERT bounds/)
})

test('architecture launch readiness keeps conservative door swing inference', async () => {
  const semantic = await source('features/architecture/pascal-cad-semantic-scene.ts')
  const viewer = await source('features/architecture/pascal-runtime-viewer.tsx')
  assert.match(semantic, /doorSwing/i)
  assert.match(semantic, /confidence/i)
  assert.match(viewer, /hinge/i)
})

test('architecture launch readiness keeps unresolved openings non-fabricated', async () => {
  const semantic = await source('features/architecture/pascal-cad-semantic-scene.ts')
  const review = await source('features/architecture/cad-review-panel.tsx')
  assert.match(semantic, /unresolvedOpenings/)
  assert.match(review, /لم يتم اختلاق موقع لها|were not fabricated/)
})

test('architecture launch readiness keeps mobile editor responsive', async () => {
  const editor = await source('features/architecture/architecture-editor-panel.tsx')
  assert.match(editor, /@media\(max-width:720px\)/)
  assert.match(editor, /grid-template-columns:minmax\(0,1fr\)/)
})
