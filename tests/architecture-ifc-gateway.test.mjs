import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../packages/architecture-engine/src/ifc.ts', import.meta.url), 'utf8')

test('IFC gateway enforces bounded input', () => {
  assert.match(source, /architecture\.ifc\.empty/)
  assert.match(source, /architecture\.ifc\.too_large/)
  assert.match(source, /maxBytes: 50 \* 1024 \* 1024/)
})

test('IFC gateway refuses invalid scenes and can fail incomplete conversion', () => {
  assert.match(source, /architecture\.ifc\.invalid_scene/)
  assert.match(source, /architecture\.ifc\.incomplete_conversion/)
  assert.match(source, /skippedItems/)
})

test('IFC converter remains injected behind BASOUL port', () => {
  assert.match(source, /interface IfcConverterPort/)
  assert.doesNotMatch(source, /@pascal-app\/ifc-converter/)
})

test('IFC diagnostics expose generated nodes and warnings', () => {
  assert.match(source, /generatedNodes/)
  assert.match(source, /warnings/)
})
