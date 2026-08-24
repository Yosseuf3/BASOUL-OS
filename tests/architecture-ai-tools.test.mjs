import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../packages/architecture-engine/src/tools.ts', import.meta.url), 'utf8')

test('AI tool requires explicit architecture edit permission', () => {
  assert.match(source, /architecture\.edit/)
  assert.match(source, /architecture\.permission\.denied/)
})

test('AI tool validates window geometry before mutation', () => {
  assert.match(source, /architecture\.window\.width_invalid/)
  assert.match(source, /architecture\.window\.height_invalid/)
  assert.match(source, /architecture\.window\.sill_invalid/)
})

test('AI tool rejects a missing or non-wall target', () => {
  assert.match(source, /architecture\.wall\.not_found/)
  assert.match(source, /wall\.type !== 'wall'/)
})

test('AI tool emits organization-aware audit metadata', () => {
  assert.match(source, /organizationId: actor\.organizationId/)
  assert.match(source, /createdBy: actor\.userId/)
  assert.match(source, /architecture\.window\.add/)
})

test('AI tool does not expose raw MCP access', () => {
  assert.doesNotMatch(source, /executeSQL|rawMcpAccess|mcp\.call|@modelcontextprotocol/)
})
