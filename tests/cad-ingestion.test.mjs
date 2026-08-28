import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const cad = await readFile(new URL('../packages/cad-ingestion/src/index.ts', import.meta.url), 'utf8')
const gateway = await readFile(new URL('../tools/cad-ingestion/cad_ingest.py', import.meta.url), 'utf8')
const dockerfile = await readFile(new URL('../tools/cad-ingestion/Dockerfile', import.meta.url), 'utf8')

test('CAD ingestion normalizes native CAD semantics before ArchitectureScene', () => {
  assert.match(cad, /basoul\.cad\.v1/)
  assert.match(cad, /classifyCadEntity/)
  assert.match(cad, /cadDocumentToArchitectureScene/)
  assert.match(cad, /Door block semantics/)
  assert.match(cad, /Window block semantics/)
  assert.match(cad, /Geometry is explicitly on a wall layer/)
  assert.match(cad, /Native CAD geometry is explicitly on a stair layer/)
  assert.match(cad, /stiars/)
  assert.match(cad, /Semantic room label from native CAD text/)
  assert.match(cad, /textStyle/)
  assert.match(cad, /path: points/)
})

test('DWG decoding is isolated behind LibreDWG and ezdxf gateway', () => {
  assert.match(gateway, /dwg2dxf/)
  assert.match(gateway, /dwgread/)
  assert.match(gateway, /import ezdxf/)
  assert.match(gateway, /Only DWG and DXF are supported/)
  assert.match(gateway, /DWGCODEPAGE/)
  assert.match(gateway, /textStyles/)
  assert.match(dockerfile, /LIBREDWG_VERSION=0\.14\.8531/)
  assert.match(dockerfile, /sha256sum -c/)
  assert.match(dockerfile, /--disable-bindings --disable-python --disable-docs --disable-shared/)
  assert.match(dockerfile, /USER cad/)
})

test('CAD semantic core does not depend directly on LibreDWG or ezdxf', () => {
  assert.doesNotMatch(cad, /libredwg/i)
  assert.doesNotMatch(cad, /ezdxf/i)
  assert.doesNotMatch(cad, /@pascal-app\//)
})
