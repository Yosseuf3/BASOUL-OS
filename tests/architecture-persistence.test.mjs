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
