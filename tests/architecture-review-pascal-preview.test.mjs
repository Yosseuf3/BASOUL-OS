import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const preview = fs.readFileSync('features/architecture/architecture-analysis-3d-preview.tsx', 'utf8')
const overlay = fs.readFileSync('features/architecture/plan-overlay-viewer.tsx', 'utf8')

test('review analysis flows through BASOUL reconciliation before Pascal', () => {
  assert.match(preview, /reconcileDetectedPlanElements\(detected\)/)
  assert.match(preview, /normalizeReconciledSceneForPascal\(reconciled\.scene\)/)
  assert.match(preview, /element\.status === 'rejected'/)
})

test('plan overlay mounts the reconciled 3D preview for the selected drawing', () => {
  assert.match(overlay, /ArchitectureAnalysis3DPreview/)
  assert.match(overlay, /drawingId=\{drawing\.id\}/)
})

test('Pascal remains outside the architecture-engine reconciliation boundary', () => {
  const engine = fs.readFileSync('packages/architecture-engine/src/reconciliation.ts', 'utf8')
  assert.doesNotMatch(engine, /@pascal-app\//)
})
