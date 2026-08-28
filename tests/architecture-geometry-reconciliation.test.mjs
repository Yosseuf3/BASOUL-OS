import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const reconciliation = await readFile(new URL('../packages/architecture-engine/src/reconciliation.ts', import.meta.url), 'utf8')
const pascalBridge = await readFile(new URL('../features/architecture/pascal-reconciled-scene.ts', import.meta.url), 'utf8')

test('BASOUL reconciliation owns detected-plan to scene conversion', () => {
  assert.match(reconciliation, /reconcileDetectedPlanElements/)
  assert.match(reconciliation, /opening\.host_missing/)
  assert.match(reconciliation, /snapToleranceMeters/)
  assert.match(reconciliation, /detectionState/)
  assert.match(reconciliation, /intendedRuntime: 'pascal-adapter'/)
})

test('reconciliation does not leak Pascal packages into architecture engine', () => {
  assert.doesNotMatch(reconciliation, /@pascal-app\//)
})

test('Pascal bridge is isolated to the feature adapter boundary', () => {
  assert.match(pascalBridge, /@pascal-app\/core/)
  assert.match(pascalBridge, /WallNode\.parse/)
  assert.match(pascalBridge, /DoorNode\.parse/)
  assert.match(pascalBridge, /WindowNode\.parse/)
  assert.match(pascalBridge, /normalizeReconciledSceneForPascal/)
})
