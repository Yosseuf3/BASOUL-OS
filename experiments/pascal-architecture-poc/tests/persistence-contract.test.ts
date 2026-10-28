import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const migrationUrl = new URL('../sql/architecture-scenes.proposed.sql', import.meta.url)

test('proposed scene persistence is deny-by-default and organization scoped', async () => {
  const sql = (await readFile(fileURLToPath(migrationUrl), 'utf8')).toLowerCase()
  assert.match(sql, /enable row level security/)
  assert.match(sql, /force row level security/)
  assert.match(sql, /private\.has_permission\(organization_id, 'read'\)/)
  assert.match(sql, /private\.has_permission\(organization_id, 'create'\)/)
  assert.match(sql, /private\.has_permission\(organization_id, 'update'\)/)
  assert.match(sql, /private\.has_permission\(organization_id, 'delete'\)/)
  assert.match(sql, /revoke all on public\.architecture_scenes from anon/)
  assert.match(sql, /architecture_scene_scope_immutable/)
})
