import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')

test('Pascal materialization covers every classified CAD wall entity and floor-graph edge', () => {
  assert.match(source, /function wallCoverage/)
  assert.match(source, /missingCadWallEntities/)
  assert.match(source, /representedCadWallEntities/)
  assert.match(source, /wallEntityCoverage/)
  assert.match(source, /graphEdgesMaterialized/)
  assert.match(source, /graphEdgeCoverage/)
  assert.match(source, /if \(coverage\.missingCadWallEntities > 0\)/)
  assert.match(source, /if \(graphEdgeCoverage !== 1 \|\| floatingOpenings/)
  assert.match(source, /CAD fidelity gate failed/)
  assert.match(source, /Pascal fidelity gate failed/)
})
