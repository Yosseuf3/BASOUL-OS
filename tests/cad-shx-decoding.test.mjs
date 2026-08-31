import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const gateway = await readFile(new URL('../tools/cad-ingestion/cad_ingest.py', import.meta.url), 'utf8')
const decoder = await readFile(new URL('../tools/cad-ingestion/shx_decode.py', import.meta.url), 'utf8')
const dockerfile = await readFile(new URL('../tools/cad-ingestion/Dockerfile', import.meta.url), 'utf8')
const vercelDockerfile = await readFile(new URL('../tools/cad-ingestion/Dockerfile.vercel', import.meta.url), 'utf8')

test('XARAB legacy SHX decoder preserves raw text and emits Unicode Arabic', () => {
  assert.match(decoder, /XARAB_KEYBOARD_MAP/)
  assert.match(decoder, /decode_xarab_text/)
  assert.match(decoder, /xarab-keyboard-v1/)
  assert.match(decoder, /'p': 'ح'/)
  assert.match(decoder, /'l': 'م'/)
  assert.match(decoder, /'f': 'ب'/)
  assert.match(decoder, /'s': 'س'/)
  assert.match(gateway, /rawText/)
  assert.match(gateway, /decodedText/)
  assert.match(gateway, /textEncoding/)
  assert.match(gateway, /decodedEntities/)
})

test('CAD containers include the isolated SHX decoder module', () => {
  assert.match(dockerfile, /shx_decode\.py/)
  assert.match(vercelDockerfile, /shx_decode\.py/)
})
