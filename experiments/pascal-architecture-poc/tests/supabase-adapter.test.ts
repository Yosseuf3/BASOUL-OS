import assert from 'node:assert/strict'
import test from 'node:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseSceneAdapter } from '../lib/supabase-scene-adapter'

function fakeClient() {
  const calls: Array<[string, ...unknown[]]> = []
  const row = {
    id: 'scene-1',
    organization_id: 'org-a',
    project_id: 'project-a',
    name: 'Scene',
    scene: { nodes: {}, rootNodeIds: [] },
  }
  const builder = {
    select(columns: string) { calls.push(['select', columns]); return this },
    eq(column: string, value: unknown) { calls.push(['eq', column, value]); return this },
    async maybeSingle() { calls.push(['maybeSingle']); return { data: row, error: null } },
    async upsert(value: unknown, options: unknown) { calls.push(['upsert', value, options]); return { error: null } },
  }
  const client = {
    from(table: string) { calls.push(['from', table]); return builder },
  } as unknown as SupabaseClient
  return { client, calls }
}

test('Supabase scene adapter scopes reads by organization and project', async () => {
  const { client, calls } = fakeClient()
  const adapter = new SupabaseSceneAdapter(client)
  await adapter.load('org-a', 'project-a')
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'organization_id' && call[2] === 'org-a'))
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'project_id' && call[2] === 'project-a'))
})

test('Supabase scene adapter refuses unscoped operations', async () => {
  const { client } = fakeClient()
  const adapter = new SupabaseSceneAdapter(client)
  await assert.rejects(() => adapter.load('', 'project-a'), /scene_scope_required/)
  await assert.rejects(() => adapter.save({
    id: 'scene-1', organization_id: '', project_id: 'project-a', name: 'Scene', scene: { nodes: {}, rootNodeIds: [] },
  }), /scene_scope_required/)
})
