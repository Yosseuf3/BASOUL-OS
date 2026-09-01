import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const semantic = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')

test('CAD Pascal materialization uses node ids compatible with Pascal beta.5 schemas', () => {
  assert.match(semantic, /const siteId = 'site_cad_pascal'/)
  assert.match(semantic, /const buildingId = 'building_cad_pascal'/)
  assert.match(semantic, /const levelId = 'level_cad_pascal_0'/)
  assert.match(semantic, /pascalId\('wall_cad_pascal', edge\.id\)/)
  assert.match(semantic, /pascalId\(`\$\{kind\}_cad_pascal`, entityId\)/)
  assert.doesNotMatch(semantic, /const siteId = 'cad-pascal:site'/)
  assert.doesNotMatch(semantic, /`cad-pascal:wall:/)
  assert.match(semantic, /pascalNodeIdCompatibilityVersion: '2\.7'/)
})
