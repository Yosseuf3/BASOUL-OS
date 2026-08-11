import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("role matrix preserves positive and negative authorization boundaries", async () => {
  const rbac = await readFile(new URL("../lib/organizations/rbac.ts", import.meta.url), "utf8");
  assert.match(rbac, /viewer: 10, member: 20, admin: 30, owner: 40/);
  assert.match(rbac, /viewer: new Set\(\["organization\.read"/);
  assert.match(rbac, /member: new Set\(\[.*business\.create.*business\.update/s);
  assert.doesNotMatch(rbac, /member: new Set\(\[.*business\.delete/s);
  assert.match(rbac, /permission !== "organization\.update"/);
  assert.match(rbac, /owner: new Set\(ORGANIZATION_PERMISSIONS\)/);
});

test("database policies are tenant scoped and owner critical settings stay owner-only", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260809193000_basoul_administration_boundaries.sql", import.meta.url), "utf8");
  const foundation = await readFile(new URL("../supabase/migrations/20260802204811_iam_foundation.sql", import.meta.url), "utf8");
  assert.match(migration, /organizations_update_owner/);
  assert.match(migration, /manage_organization/);
  assert.match(migration, /Users cannot escalate their own role/);
  assert.match(foundation, /An organization must retain at least one active owner/);
  assert.match(foundation, /organization_id=target_organization/);
  assert.match(foundation, /Authentication required/);
});

test("sensitive administration actions are audited without client secrets", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260809193000_basoul_administration_boundaries.sql", import.meta.url), "utf8");
  assert.match(migration, /record_administration_event/);
  assert.match(migration, /membership_changed/);
  assert.match(migration, /membership_removed/);
  assert.doesNotMatch(migration, /service_role|SUPABASE_SERVICE/);
});

test("web and mobile use explicit permission helpers", async () => {
  const web = await readFile(new URL("../features/administration/administration-view.tsx", import.meta.url), "utf8");
  const mobile = await readFile(new URL("../mobile/src/features/administration/AdministrationScreen.tsx", import.meta.url), "utf8");
  assert.match(web, /hasOrganizationPermission/);
  assert.match(web, /canManageMember/);
  assert.match(mobile, /hasMobilePermission/);
});

test("administration navigation and direct route require membership.manage", async () => {
  const switcher = await readFile(new URL("../components/shell/workspace-switcher.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/administration/page.tsx", import.meta.url), "utf8");
  assert.match(switcher, /hasOrganizationPermission\(administration\.current\.role as OrganizationRole, "membership\.manage"\)/);
  assert.match(switcher, /canAdminister \? <button/);
  assert.match(page, /hasOrganizationPermission\(administration\.current\.role as OrganizationRole, "membership\.manage"\)/);
  assert.match(page, /if \(!canAdminister\)/);
  assert.match(page, /requires an Owner or Admin role/);
});
