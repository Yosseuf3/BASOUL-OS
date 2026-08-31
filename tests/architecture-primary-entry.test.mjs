import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const primary = await readFile(new URL('../features/architecture/architecture-review-view.tsx', import.meta.url), 'utf8')
const cad = await readFile(new URL('../features/architecture/cad-review-panel.tsx', import.meta.url), 'utf8')
const fallback = await readFile(new URL('../features/architecture/pdf-image-review-view-source.tsx', import.meta.url), 'utf8')
const fallbackRoute = await readFile(new URL('../app/architecture/pdf-image/page.tsx', import.meta.url), 'utf8')

test('dashboard Architecture entry routes to native CAD workspace', () => {
  assert.match(primary, /router\.replace\(['"]\/architecture['"]\)/)
  assert.match(primary, /CAD · PRIMARY/)
  assert.doesNotMatch(primary, /application\/pdf.*image\/png/)
})

test('native Architecture workspace exposes DWG and DXF upload', () => {
  assert.match(cad, /accept="\.dwg,\.dxf/)
  assert.match(cad, /\/api\/architecture\/cad\/ingest/)
})

test('PDF and image review remains an explicit fallback', () => {
  assert.match(fallback, /application\/pdf/)
  assert.match(fallback, /image\/png/)
  assert.match(fallbackRoute, /PdfImageReviewView/)
})
