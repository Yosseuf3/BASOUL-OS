import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../packages/architecture-engine/src/index.ts', import.meta.url), 'utf8')

test('architecture engine exposes BASOUL-owned ports', () => {
  assert.match(source, /interface ArchitectureEnginePort/)
  assert.match(source, /interface ArchitectureViewerPort/)
  assert.match(source, /class PascalArchitectureAdapter/)
})

test('architecture engine does not leak Pascal package imports', () => {
  assert.doesNotMatch(source, /from ['"]@pascal-app\//)
  assert.doesNotMatch(source, /import\(['"]@pascal-app\//)
})

test('adapter validates scene identity invariants', () => {
  assert.match(source, /node\.id\.mismatch/)
  assert.match(source, /scene\.nodes\.missing/)
  assert.match(source, /scene\.roots\.invalid/)
})
