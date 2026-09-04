import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const gateway = await readFile(new URL('../tools/cad-ingestion/cad_ingest.py', import.meta.url), 'utf8')
const ingestion = await readFile(new URL('../packages/cad-ingestion/src/index.ts', import.meta.url), 'utf8')

test('CAD ingestion fingerprints the exact uploaded source bytes', () => {
  assert.match(gateway, /hashlib\.sha256\(path\.read_bytes\(\)\)\.hexdigest\(\)/)
  assert.match(gateway, /"sha256": source_sha256/)
  assert.match(ingestion, /sha256\?: string \| null/)
  assert.match(ingestion, /sourceFingerprint: document\.source\.sha256/)
})

test('declared empty CAD layers remain neutral instead of reporting a fabricated dominant wall kind', () => {
  assert.match(ingestion, /layer\.entityCount === 0\s*\? 'item'/)
})
