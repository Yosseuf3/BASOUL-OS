import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../features/architecture/pascal-runtime-viewer.tsx', import.meta.url), 'utf8')
const editor = await readFile(new URL('../features/architecture/architecture-editor-panel.tsx', import.meta.url), 'utf8')
const editing = await readFile(new URL('../features/architecture/pascal-scene-editing.ts', import.meta.url), 'utf8')

test('3D runtime exposes direct editable-element selection and native highlight bridge', () => {
  assert.match(viewer, /DIRECT SELECT · LIVE/)
  assert.match(viewer, /emitter\.on\(`\$\{kind\}:click`/)
  assert.match(viewer, /setExternalSelectedIds\(selectedId \? \[selectedId\] : \[\]\)/)
  assert.match(viewer, /onSelectionChange\?\.\(event\.node\.id\)/)
})

test('direct manipulation uses a snapped 3D translate gizmo and suppresses camera drag conflicts', () => {
  assert.match(viewer, /TransformControls/)
  assert.match(viewer, /mode="translate"/)
  assert.match(viewer, /translationSnap=\{0\.1\}/)
  assert.match(viewer, /setInputDragging\(true\)/)
  assert.match(viewer, /enabled=\{!inputDragging\}/)
})

test('3D deltas are mapped into BASOUL ArchitectureScene geometry', () => {
  assert.match(editing, /export function editableElementAnchor/)
  assert.match(editing, /export function translateEditableElement/)
  assert.match(editing, /return updateWallGeometry/)
  assert.match(editing, /return updateOpeningGeometry/)
  assert.doesNotMatch(editing, /supabase|service_role|SERVICE_ROLE|\.rpc\(/i)
})

test('workspace synchronizes list and 3D selection and keeps edits explicitly unsaved', () => {
  assert.match(page, /selectedElementId/)
  assert.match(page, /onSelectionChange=\{setSelectedElementId\}/)
  assert.match(page, /onSceneChange=\{applyDirectManipulation\}/)
  assert.match(page, /setStatus\("unsaved"\)/)
  assert.match(editor, /selectedId: string/)
  assert.match(editor, /SELECTION · SYNCED/)
})
