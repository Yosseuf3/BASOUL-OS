import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const editing = await readFile(new URL('../features/architecture/pascal-scene-editing.ts', import.meta.url), 'utf8')
const panel = await readFile(new URL('../features/architecture/architecture-editor-panel.tsx', import.meta.url), 'utf8')
const page = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8')

test('editing remains behind BASOUL ArchitectureScene boundary', () => {
  assert.match(editing, /ArchitectureScene/)
  assert.match(editing, /WallNode\.parse/)
  assert.match(editing, /DoorNode/)
  assert.match(editing, /WindowNode/)
  assert.doesNotMatch(editing, /supabase/i)
  assert.doesNotMatch(editing, /from\(['"]architecture_scenes['"]\)/i)
})

test('editor supports walls doors windows and deletion', () => {
  assert.match(editing, /export function updateWallGeometry/)
  assert.match(editing, /export function updateOpeningGeometry/)
  assert.match(editing, /export function addWall/)
  assert.match(editing, /export function addOpening/)
  assert.match(editing, /export function removeEditableElement/)
  assert.match(panel, /ArchitectureEditorPanel/)
  assert.match(panel, /EDITOR · LIVE/)
})

test('workspace marks edits unsaved and persists only through existing save flow', () => {
  assert.match(page, /function applyEditedScene/)
  assert.match(page, /setStatus\("unsaved"\)/)
  assert.match(page, /saveArchitectureScene/)
  assert.match(page, /ArchitectureEditorPanel/)
  assert.match(page, /PERSISTENCE · PRODUCTION/)
})
