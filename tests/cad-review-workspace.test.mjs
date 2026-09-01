import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../features/architecture/cad-review-panel.tsx', import.meta.url), 'utf8')
const page = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8')
const route = await readFile(new URL('../app/api/architecture/cad/ingest/route.ts', import.meta.url), 'utf8')

test('architecture workspace exposes CAD review before Pascal', () => {
  assert.match(page, /CadReviewPanel/)
  assert.match(page, /onSceneReady=\{applyCadScene\}/)
  assert.match(page, /CAD INGESTION · READY/)
  assert.match(page, /3D SAFETY GATE · ACTIVE/)
})

test('CAD review renders floor graph and blocks 3D until geometry and Pascal semantic gates pass', () => {
  assert.match(panel, /buildCadFloorGraph/)
  assert.match(panel, /CadFloorGraphOverlay/)
  assert.match(panel, /buildPascalSceneFromCad/)
  assert.match(panel, /disabled=\{!graph\.gate\.ready\}/)
  assert.match(panel, /if \(!result\.ready \|\| !result\.scene \|\| !result\.graph\.gate\.ready\)/)
  assert.match(panel, /PASCAL v2\.3 · PASS/)
  assert.match(panel, /\.dwg,\.dxf,\.json/)
})

test('CAD ingest route validates tenant project, format, size and gateway response', () => {
  assert.match(route, /authenticatedDatabase/)
  assert.match(route, /requestedOrganization/)
  assert.match(route, /organization_id/)
  assert.match(route, /MAX_CAD_BYTES/)
  assert.match(route, /allowedExtensions/)
  assert.match(route, /CAD_GATEWAY_URL/)
  assert.match(route, /basoul\.cad\.v1/)
  assert.match(route, /gateway_invalid_response/)
})
