import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../features/architecture/cad-opening-topology.ts', import.meta.url), 'utf8')
const adapter = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')

test('opening topology only derives reveal depth from high-confidence wall thickness', () => {
  assert.match(source, /pair\.confidence < 0\.85/)
  assert.match(source, /pair\.thickness < 0\.05 \|\| pair\.thickness > 1/)
  assert.match(source, /hosted-with-depth/)
  assert.match(source, /depthCoverage/)
})

test('unhosted CAD openings remain unresolved and are not fabricated', () => {
  assert.match(source, /status: 'unresolved'/)
  assert.match(source, /hostEdgeId: null/)
  assert.doesNotMatch(source, /fallback.*host/i)
})

test('Pascal scene publishes CAD opening topology and reveal-depth provenance', () => {
  assert.match(adapter, /analyzeCadOpeningTopology/)
  assert.match(adapter, /cadOpeningTopologyVersion:'3\.3'/)
  assert.match(adapter, /cadOpeningTopology:/)
  assert.match(adapter, /hostedWithDepth:openingTopology\.hostedWithDepth/)
  assert.match(adapter, /openingRevealDepthCoverage:openingTopology\.depthCoverage/)
  assert.match(adapter, /status==='unresolved'/)
  assert.match(adapter, /wallId:record\.hostEdgeId \? wallIdFor\(record\.hostEdgeId\) : null/)
  assert.match(adapter, /openingId:openingIdFor\(record\.kind,record\.entityId\)/)
})
