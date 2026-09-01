import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../features/architecture/cad-wall-thickness.ts', import.meta.url), 'utf8')

test('wall thickness reconstruction starts from paired parallel CAD edges', () => {
  assert.match(source, /analyzeCadWallThickness/)
  assert.match(source, /parallelErrorRadians > Math\.PI \/ 90/)
  assert.match(source, /overlapRatio < 0\.65/)
  assert.match(source, /confidence < 0\.72/)
  assert.match(source, /highConfidencePairs/)
  assert.match(source, /medianThickness/)
})

test('wall thickness analysis is diagnostic and does not fabricate a thickness fallback', () => {
  assert.doesNotMatch(source, /\|\| 0\.2/)
  assert.doesNotMatch(source, /WALL_THICKNESS/)
})
