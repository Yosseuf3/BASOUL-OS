import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8')

test('architecture workspace exposes the adopted engine boundaries', () => {
  assert.match(source, /CAD SOURCE · SINGLE/)
  assert.match(source, /FLOOR GRAPH · LIVE/)
  assert.match(source, /2D → 3D · UNIFIED/)
})

test('architecture workspace does not mutate Supabase or expose raw MCP', () => {
  assert.doesNotMatch(source, /from\(['"]architecture_scenes['"]\)|supabase\.rpc|executeSQL|rawMcpAccess|@modelcontextprotocol/)
})

test('architecture workspace is bilingual and returns to dashboard', () => {
  assert.match(source, /useLanguage/)
  assert.match(source, /router\.push\("\/"\)/)
})
