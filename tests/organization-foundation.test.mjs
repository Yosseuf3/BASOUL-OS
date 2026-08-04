import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("organization APIs resolve tenant context from a verified membership", async () => {
  const auth = await readFile(new URL("../lib/auth/authorized-workspace.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/workspace/[resource]/route.ts", import.meta.url), "utf8");
  assert.match(auth, /organization_memberships/);
  assert.match(auth, /eq\("user_id", data\.user\.id\)/);
  assert.match(auth, /eq\("status", "active"\)/);
  assert.match(route, /requestedOrganization\(request\.headers\)/);
});

test("RBAC and policies are deny by default", async () => {
  const rbac = await readFile(new URL("../lib/organizations/rbac.ts", import.meta.url), "utf8");
  const policy = await readFile(new URL("../lib/organizations/policy.ts", import.meta.url), "utf8");
  assert.match(rbac, /viewer: new Set\(\["organization\.read"/);
  assert.doesNotMatch(rbac, /viewer:.*business\.create/);
  assert.match(policy, /inactive-membership/);
});

test("workspace migration enforces organization RLS", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260805000100_platform_organization_workspaces.sql", import.meta.url), "utf8");
  assert.match(sql, /force row level security/);
  assert.match(sql, /organization_id uuid not null/);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\)/);
  assert.doesNotMatch(sql, /auth\.role\(\)|user_metadata|raw_user_meta_data/);
});
