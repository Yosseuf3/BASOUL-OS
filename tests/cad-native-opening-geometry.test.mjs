import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const gateway = await readFile(new URL('../tools/cad-ingestion/cad_ingest.py', import.meta.url), 'utf8')
const panel = await readFile(new URL('../features/architecture/cad-review-panel.tsx', import.meta.url), 'utf8')

test('CAD gateway preserves native INSERT geometry for opening fidelity', () => {
  assert.match(gateway, /def insert_geometry\(entity, limit=256\)/)
  assert.match(gateway, /entity\.virtual_entities\(\)/)
  assert.match(gateway, /"insertGeometry": insert_geometry\(entity\)/)
  assert.match(gateway, /kind in \{"ARC", "CIRCLE"\}/)
})

test('2D opening renderer prefers native INSERT geometry before fallback bounds', () => {
  assert.match(panel, /readNativeInsertGeometry\(entity\)/)
  assert.match(panel, /data-cad-native-opening/)
  assert.match(panel, /native CAD/)
  assert.match(panel, /entity\.metadata\?\.insertBounds/)
  assert.ok(panel.indexOf('readNativeInsertGeometry(entity)') < panel.indexOf('entity.metadata?.insertBounds'))
})
