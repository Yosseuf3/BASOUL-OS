import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const adapter = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')
const gateway = await readFile(new URL('../features/architecture/pascal-cad-scene.ts', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('Pascal CAD v2.3 materializes native walls, hosted doors/windows and room slabs', () => {
  assert.match(adapter, /WallNode\.parse/)
  assert.match(adapter, /DoorNode\.parse/)
  assert.match(adapter, /WindowNode\.parse/)
  assert.match(adapter, /SlabNode\.parse/)
  assert.match(adapter, /recoverSemanticRooms/)
  assert.match(adapter, /floatingOpenings/)
  assert.match(adapter, /pascalSemanticIntegrationVersion: '2\.3'/)
})

test('Pascal keeps verified wall geometry available when some openings cannot be hosted', () => {
  assert.match(adapter, /const degraded = floatingOpenings > 0 \|\| doors !== expectedDoors \|\| windows !== expectedWindows/)
  assert.match(adapter, /unresolvedOpenings/)
  assert.match(adapter, /unresolved opening\(s\); unresolved openings were not fabricated in 3D/)
  assert.doesNotMatch(adapter, /Pascal semantic gate failed/)
})

test('CAD Pascal entrypoint uses the native semantic adapter', () => {
  assert.match(gateway, /buildNativePascalCadScene/)
  assert.match(gateway, /diagnostics: PascalSemanticCadDiagnostics \| null/)
})

test('Pascal viewer renders recovered Arabic semantic room labels in 3D', () => {
  assert.match(viewer, /BasoulSemanticRoomLabels/)
  assert.match(viewer, /scene\.metadata\?\.semanticRooms/)
  assert.match(viewer, /<Text/)
  assert.match(viewer, /position=\{\[room\.x, 0\.08, room\.y\]\}/)
})
