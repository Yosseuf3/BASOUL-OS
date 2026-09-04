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

test('wall thickness materialization requires high confidence, plausible size and median consistency', () => {
  assert.match(source, /MATERIALIZE_CONFIDENCE = 0\.85/)
  assert.match(source, /MIN_PLAUSIBLE_THICKNESS = 0\.05/)
  assert.match(source, /MAX_PLAUSIBLE_THICKNESS = 1/)
  assert.match(source, /MAX_MEDIAN_DEVIATION = 0\.35/)
  assert.match(source, /materializableCadWallThickness/)
  assert.match(source, /Math\.abs\(pair\.thickness - center\) \/ center <= MAX_MEDIAN_DEVIATION/)
})

test('wall thickness analysis never invents a fallback inside the inference engine', () => {
  assert.doesNotMatch(source, /\|\| 0\.2/)
  assert.doesNotMatch(source, /WALL_THICKNESS/)
})
