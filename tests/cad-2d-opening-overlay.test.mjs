import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../features/architecture/cad-review-panel.tsx', import.meta.url), 'utf8')

test('2D CAD review renders graph openings from the same normalized CAD document', () => {
  assert.match(source, /CadFloorGraphOverlay graph=\{graph\} document=\{document\}/)
  assert.match(source, /data-cad-opening-overlay="true"/)
  assert.match(source, /graph\.openings\.map/)
  assert.match(source, /entitiesById\.get\(opening\.entityId\)/)
})

test('2D opening overlay prefers CAD geometry, then INSERT bounds, then insertion point', () => {
  assert.match(source, /points\.length >= 2/)
  assert.match(source, /entity\.metadata\?\.insertBounds/)
  assert.match(source, /entity\.insert \?\? points\[0\]/)
  assert.match(source, /kind === 'door' \? '#f59e0b' : '#38bdf8'/)
  assert.match(source, /kind: 'door' \| 'window'/)
})
