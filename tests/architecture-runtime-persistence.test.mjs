import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const route = await readFile(new URL('../app/api/architecture/scene/route.ts', import.meta.url), 'utf8')

test('architecture persistence API requires authenticated organization context', () => {
  assert.match(route, /authenticatedDatabase\(bearer\(request\), requestedOrganization\(request\.headers\)\)/)
  assert.match(route, /eq\("organization_id", auth\.organizationId\)/)
})

test('architecture persistence API validates project tenancy before scene access', () => {
  assert.match(route, /from\("projects"\)/)
  assert.match(route, /eq\("id", projectId\)/)
  assert.match(route, /eq\("organization_id", auth\.organizationId\)/)
  assert.match(route, /architecture\.project\.not_found/)
})

test('architecture scene load and save are scoped by organization and project', () => {
  assert.match(route, /from\("architecture_scenes"\)/)
  assert.match(route, /eq\("organization_id", resolved\.auth\.organizationId\)/)
  assert.match(route, /eq\("project_id", resolved\.projectId\)/)
  assert.match(route, /onConflict: "organization_id,project_id"/)
})

test('architecture scene writes preserve trusted identity', () => {
  assert.match(route, /user_id: resolved\.auth\.user\.id/)
  assert.match(route, /organization_id: resolved\.auth\.organizationId/)
  assert.match(route, /project_id: resolved\.projectId/)
  assert.match(route, /architecture\.scene\.invalid/)
})
