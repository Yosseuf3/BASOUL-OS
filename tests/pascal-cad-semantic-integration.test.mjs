import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const adapter = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')
const gateway = await readFile(new URL('../features/architecture/pascal-cad-scene.ts', import.meta.url), 'utf8')

test('Pascal CAD v2.3 materializes native walls, hosted doors/windows and room slabs', () => {
  assert.match(adapter, /WallNode\.parse/)
  assert.match(adapter, /DoorNode\.parse/)
  assert.match(adapter, /WindowNode\.parse/)
  assert.match(adapter, /SlabNode\.parse/)
  assert.match(adapter, /recoverSemanticRooms/)
  assert.match(adapter, /floatingOpenings/)
  assert.match(adapter, /pascalSemanticIntegrationVersion: '2\.3'/)
})

test('Pascal semantic gate fails closed on missing opening hosts', () => {
  assert.match(adapter, /if \(floatingOpenings \|\| doors !== expectedDoors \|\| windows !== expectedWindows\)/)
  assert.match(adapter, /Pascal semantic gate failed/)
})

test('CAD Pascal entrypoint uses the native semantic adapter', () => {
  assert.match(gateway, /buildNativePascalCadScene/)
  assert.match(gateway, /diagnostics: PascalSemanticCadDiagnostics \| null/)
})
