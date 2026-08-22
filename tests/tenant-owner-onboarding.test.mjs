import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("workspace loading never creates a tenant implicitly", async () => {
  const source = await readFile(new URL("../lib/data/workspace-service.ts", import.meta.url), "utf8");
  const authorized = await readFile(new URL("../lib/auth/authorized-workspace.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ensure_personal_organization/);
  assert.doesNotMatch(authorized, /ensure_personal_organization/);
  assert.match(source, /ORGANIZATION_ONBOARDING_REQUIRED/);
});

test("server authorization resolves an existing active membership without provisioning", async () => {
  const source = await readFile(new URL("../lib/auth/authorized-workspace.ts", import.meta.url), "utf8");
  assert.match(source, /select\("organization_id,role"\)/);
  assert.match(source, /eq\("status", "active"\)/);
  assert.match(source, /maybeSingle\(\)/);
});

test("new owner onboarding creates isolated organization and owner membership", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260822121500_owner_onboarding_tenant_isolation.sql", import.meta.url), "utf8");
  assert.match(migration, /create_owned_organization/);
  assert.match(migration, /'owner','active'/);
  assert.match(migration, /User already belongs to an active organization/);
  assert.match(migration, /Pending organization invitation must be accepted/);
  assert.match(migration, /organization_profiles/);
});

test("team invitation origination and revocation are owner-only", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260822121500_owner_onboarding_tenant_isolation.sql", import.meta.url), "utf8");
  const rbac = await readFile(new URL("../lib/organizations/rbac.ts", import.meta.url), "utf8");
  assert.match(migration, /caller_role <> 'owner'/);
  assert.match(migration, /Only organization owners may invite members/);
  assert.match(migration, /Only organization owners may revoke invitations/);
  assert.match(rbac, /caller === "owner" && role !== "owner"/);
});

test("login routes authenticated identities through organization resolution", async () => {
  const login = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8");
  const onboarding = await readFile(new URL("../app/onboarding/page.tsx", import.meta.url), "utf8");
  assert.match(login, /router\.replace\("\/onboarding"\)/);
  assert.match(onboarding, /resolveOrganizationAccess/);
  assert.match(onboarding, /createOwnedOrganization/);
});
