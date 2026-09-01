import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../features/architecture/cad-review-panel.tsx', import.meta.url), 'utf8')
const page = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8')

test('live CAD review materializes Pascal automatically from the same normalized document', () => {
  assert.match(panel, /function materializePascalScene/)
  assert.match(panel, /buildPascalSceneFromCad\(source\)/)
  assert.match(panel, /materializePascalScene\(parsed\)/)
  assert.match(panel, /window\.document\.getElementById\('architecture-3d-runtime'\)/)
  assert.doesNotMatch(panel, /cadDocumentToPascalReadyScene\(document\)/)
})

test('CAD runtime reports verified degraded scenes instead of blocking unresolved openings', () => {
  assert.match(panel, /diagnostics\.degraded/)
  assert.match(panel, /3D · DEGRADED/)
  assert.match(panel, /Unresolved openings/)
  assert.match(panel, /expectedDoors/)
  assert.match(panel, /expectedWindows/)
  assert.match(panel, /missingCadWallEntities === 0/)
  assert.match(panel, /graphEdgeCoverage === 1/)
})

test('architecture workspace has one CAD scene owner and never substitutes a starter scene', () => {
  assert.doesNotMatch(page, /createBasoulStarterScene/)
  assert.match(page, /record && isCadPascalScene\(record\.scene\)/)
  assert.match(page, /const cadSceneReady = isCadPascalScene\(scene\)/)
  assert.match(page, /id="architecture-3d-runtime"/)
  assert.match(page, /Save CAD scene/)
})
