import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../features/architecture/cad-review-panel.tsx', import.meta.url), 'utf8')

test('live CAD review routes 3D through Pascal v2.3 semantic adapter', () => {
  assert.match(panel, /buildPascalSceneFromCad\(document\)/)
  assert.doesNotMatch(panel, /cadDocumentToPascalReadyScene\(document\)/)
  assert.match(panel, /PASCAL 3D · SEMANTIC v2\.3/)
  assert.match(panel, /floatingOpenings === 0/)
  assert.match(panel, /Hosted openings/)
  assert.match(panel, /Semantic rooms/)
  assert.match(panel, /Room slabs/)
})
