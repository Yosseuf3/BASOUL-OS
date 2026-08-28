import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const migration = fs.readFileSync('supabase/migrations/20260828042500_project_files_storage_policy_name_collision_fix.sql', 'utf8');

test('project file storage policies qualify storage.objects.name', () => {
  assert.match(migration, /storage\.foldername\(storage\.objects\.name\)/);
  assert.doesNotMatch(migration, /storage\.foldername\(p\.name\)/);
  assert.doesNotMatch(migration, /storage\.foldername\(project\.name\)/);
});

test('project file storage insert policy remains tenant permission aware', () => {
  assert.match(migration, /project_file_storage_insert_own/);
  assert.match(migration, /private\.has_permission\(p\.organization_id,'create'\)/);
  assert.match(migration, /\(storage\.foldername\(storage\.objects\.name\)\)\[1\]=\(select auth\.uid\(\)\)::text/);
});
