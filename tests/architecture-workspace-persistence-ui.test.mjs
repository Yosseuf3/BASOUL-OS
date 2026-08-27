import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8')
const client = await readFile(new URL('../features/architecture/architecture-persistence-client.ts', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')

test('architecture workspace loads projects and project-scoped scenes through authenticated APIs', () => {
  assert.match(client, /supabase\.auth\.getSession\(\)/)
  assert.match(client, /\/api\/workspace\/projects/)
  assert.match(client, /\/api\/architecture\/scene\?projectId=/)
  assert.match(page, /selectedProjectId/)
  assert.match(page, /loadArchitectureScene\(selectedProjectId\)/)
})

test('architecture workspace exposes explicit unsaved, saving, saved and error states', () => {
  assert.match(page, /SCENE · UNSAVED/)
  assert.match(page, /SCENE · SAVING/)
  assert.match(page, /SCENE · SAVED/)
  assert.match(page, /SCENE · ERROR/)
  assert.match(page, /saveArchitectureScene/)
})

test('Pascal runtime is controlled by the BASOUL-owned architecture scene', () => {
  assert.match(viewer, /scene\?: ArchitectureScene \| null/)
  assert.match(viewer, /setScene\(activeScene\.nodes/)
  assert.match(viewer, /sceneReadyKey=\{sceneKey\}/)
  assert.match(viewer, /export function createBasoulStarterScene/)
})

test('workspace does not execute migrations or expose service-role credentials', () => {
  assert.doesNotMatch(page, /service_role|SERVICE_ROLE|migration.*execute|supabase\.rpc/i)
  assert.doesNotMatch(client, /service_role|SERVICE_ROLE|supabase\.from\(/i)
  assert.match(page, /has not been executed on Supabase Production/)
})
