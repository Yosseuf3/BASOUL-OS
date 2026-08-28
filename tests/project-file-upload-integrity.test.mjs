import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const servicePath = new URL("../lib/projects/project-file-service.ts", import.meta.url);
const migrationPath = new URL("../supabase/migrations/20260828035500_project_files_tenant_upload_repair.sql", import.meta.url);

const service = await readFile(servicePath, "utf8");
const migration = await readFile(migrationPath, "utf8");

test("project file uploads inherit organization_id from the selected project", () => {
  assert.match(service, /from\("projects"\)[\s\S]*select\("organization_id"\)[\s\S]*eq\("id", projectId\)/);
  assert.match(service, /organization_id:\s*organizationId/);
  assert.match(service, /const storagePath = `\$\{userData\.user\.id\}\/\$\{projectId\}\//);
});

test("project file migration repairs bucket and enforces project/organization integrity", () => {
  assert.match(migration, /insert into storage\.buckets[\s\S]*'project-files'/);
  assert.match(migration, /alter table public\.project_files force row level security/);
  assert.match(migration, /project\.id = project_id[\s\S]*project\.organization_id = organization_id/);
  assert.match(migration, /project\.id::text=\(storage\.foldername\(name\)\)\[2\]/);
  assert.match(migration, /private\.has_permission\(project\.organization_id,'create'\)/);
  assert.match(migration, /private\.has_permission\(project\.organization_id,'read'\)/);
  assert.match(migration, /private\.has_permission\(project\.organization_id,'update'\)/);
  assert.match(migration, /private\.has_permission\(project\.organization_id,'delete'\)/);
});

test("project files expose only authenticated CRUD grants", () => {
  assert.match(migration, /revoke all on table public\.project_files from authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.project_files to authenticated/);
  assert.match(migration, /revoke all on table public\.project_files from anon/);
});
