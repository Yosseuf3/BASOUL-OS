import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const edge = fs.readFileSync('supabase/functions/architectural-analyze-v2/index.ts', 'utf8')
const service = fs.readFileSync('lib/architecture/plan-understanding-service.ts', 'utf8')
const overlay = fs.readFileSync('features/architecture/plan-overlay-viewer.tsx', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260828034500_architectural_plan_element_types_v4.sql', 'utf8')

test('Architectural Understanding v4 uses topology-aware vector inference', () => {
  assert.match(edge, /architectural-understanding-v4/)
  assert.match(edge, /function inferWalls\(/)
  assert.match(edge, /topology_line_v4/)
  assert.match(edge, /paired_lines_v4/)
})

test('Architectural Understanding v4 runs semantic passes for structure openings and spaces', () => {
  assert.match(edge, /"structure","openings","spaces"/)
  assert.match(edge, /focus:\"structure\"\|\"openings\"\|\"spaces\"/)
  assert.match(edge, /gpt-5\.4-mini/)
  assert.match(edge, /vision_bbox_v4/)
})

test('v4 taxonomy includes doors windows stairs columns and shafts across db and client types', () => {
  for (const type of ['door', 'window', 'stair', 'column', 'shaft']) {
    assert.match(service, new RegExp(`"${type}"`))
    assert.match(migration, new RegExp(`'${type}'::text`))
  }
})

test('review overlay exposes debug recognition source confidence and type', () => {
  assert.match(overlay, /Debug Recognition/)
  assert.match(overlay, /getPlanElementRecognitionSource/)
  assert.match(overlay, /getPlanElementConfidenceBand/)
  assert.match(overlay, /confidenceLabels/)
})
