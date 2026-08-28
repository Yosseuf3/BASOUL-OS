import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const service = fs.readFileSync('lib/architecture/drawing-service.ts', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260828044500_architectural_drawings_tenant_upload_repair.sql', 'utf8');

test('architectural drawing upload resolves and persists the selected project organization', () => {
  assert.match(service, /from\("projects"\)/);
  assert.match(service, /select\("organization_id"\)/);
  assert.match(service, /organization_id: organizationId/);
  assert.match(service, /project_id: input\.projectId/);
});

test('architectural drawing persistence no longer relies on default organization inference', () => {
  assert.match(migration, /alter column organization_id drop default/);
  assert.match(migration, /p\.id = architectural_drawings\.project_id/);
  assert.match(migration, /p\.organization_id = architectural_drawings\.organization_id/);
});

test('architectural drawing storage policies bind user folder to project tenant', () => {
  assert.match(migration, /storage\.foldername\(storage\.objects\.name\)/);
  assert.match(migration, /p\.id::text=\(storage\.foldername\(storage\.objects\.name\)\)\[2\]/);
  assert.match(migration, /private\.has_permission\(p\.organization_id,'create'\)/);
});
