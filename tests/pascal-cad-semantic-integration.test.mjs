import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const adapter = await readFile(new URL('../features/architecture/pascal-cad-semantic-scene.ts', import.meta.url), 'utf8')
const gateway = await readFile(new URL('../features/architecture/pascal-cad-scene.ts', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('Pascal CAD v3.2 materializes native walls, hosted doors/windows and room slabs', () => {
  assert.match(adapter, /WallNode\.parse/)
  assert.match(adapter, /DoorNode\.parse/)
  assert.match(adapter, /WindowNode\.parse/)
  assert.match(adapter, /SlabNode\.parse/)
  assert.match(adapter, /recoverSemanticRooms/)
  assert.match(adapter, /floatingOpenings/)
  assert.match(adapter, /pascalSemanticIntegrationVersion: '3\.2'/)
  assert.match(adapter, /cadFidelityVersion: '3\.2'/)
})

test('3D Fidelity v3 derives opening width along the host wall and uses trustworthy CAD Z extents', () => {
  assert.match(adapter, /projectedOpeningWidth/)
  assert.match(adapter, /const projections = corners\.map/)
  assert.match(adapter, /Math\.max\(\.\.\.projections\) - Math\.min\(\.\.\.projections\)/)
  assert.match(adapter, /cadOpeningHeight/)
  assert.match(adapter, /height >= 0\.5 && height <= 4\.5/)
  assert.match(adapter, /cadWindowSill/)
  assert.match(adapter, /cadOpeningMaterializationVersion: '3\.1'/)
})

test('3D Fidelity v3.1 preserves CAD door block orientation through Pascal and the visible leaf', () => {
  assert.match(adapter, /cadDoorRotation/)
  assert.match(adapter, /rotation: \[0, rotationY, 0\]/)
  assert.match(adapter, /cadDoorOrientations/)
  assert.match(viewer, /rotation\?: \[number, number, number\]/)
  assert.match(viewer, /cadRotationY/)
  assert.match(viewer, /rotationY: cadRotationY \?\? -Math\.atan2/)
})

test('3D Fidelity v3.2 applies only gated CAD-derived wall thickness and preserves fallback elsewhere', () => {
  assert.match(adapter, /analyzeCadWallThickness/)
  assert.match(adapter, /materializableCadWallThickness/)
  assert.match(adapter, /const inferredThickness = wallThicknessMaterialization\.byEdgeId\.get\(edge\.id\)/)
  assert.match(adapter, /const thickness = inferredThickness \?\? WALL_THICKNESS/)
  assert.match(adapter, /cadWallThicknessMaterializationVersion: '3\.2'/)
  assert.match(adapter, /inferredWallThicknessEdges/)
  assert.match(adapter, /fallbackWallThicknessEdges/)
  assert.match(adapter, /wallThicknessCoverage/)
  assert.match(adapter, /medianInferredWallThickness/)
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
