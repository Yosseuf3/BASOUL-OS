import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const repoSource = await readFile(new URL('../packages/architecture-engine/src/persistence.ts', import.meta.url), 'utf8')
const migration = await readFile(new URL('../supabase/migrations/20260824004500_architecture_scenes.sql', import.meta.url), 'utf8')

test('scene repository requires organization and project scope', () => {
  assert.match(repoSource, /architecture\.scope\.organization_required/)
  assert.match(repoSource, /architecture\.scope\.project_required/)
  assert.match(repoSource, /eq\('organization_id', scope\.organizationId\)/)
  assert.match(repoSource, /eq\('project_id', scope\.projectId\)/)
})

test('architecture scenes migration is deny-by-default', () => {
  assert.match(migration, /enable row level security/i)
  assert.match(migration, /force row level security/i)
  assert.match(migration, /private\.has_permission\(organization_id, 'read'\)/)
  assert.match(migration, /private\.has_permission\(organization_id, 'create'\)/)
  assert.match(migration, /private\.has_permission\(organization_id, 'update'\)/)
  assert.match(migration, /private\.has_permission\(organization_id, 'delete'\)/)
  assert.match(migration, /revoke all on public\.architecture_scenes from anon/i)
})

test('architecture scenes RLS enforces project and organization integrity', () => {
  assert.match(migration, /from public\.projects p/i)
  assert.match(migration, /p\.id = architecture_scenes\.project_id/i)
  assert.match(migration, /p\.organization_id = architecture_scenes\.organization_id/i)
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i)
})

test('architecture scenes grants authenticated users CRUD only', () => {
  assert.match(migration, /revoke all on public\.architecture_scenes from authenticated/i)
  assert.match(migration, /grant select, insert, update, delete on public\.architecture_scenes to authenticated/i)
  assert.doesNotMatch(migration, /grant\s+all\s+on\s+public\.architecture_scenes\s+to\s+authenticated/i)
})
