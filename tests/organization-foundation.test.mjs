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

test("business data is tenant-scoped with forced RLS and verified actor identity", async () => {
  const foundation = await readFile(new URL("../supabase/migrations/20260802204811_iam_foundation.sql", import.meta.url), "utf8");
  const rls = await readFile(new URL("../supabase/migrations/20260802204818_iam_rls.sql", import.meta.url), "utf8");
  const businessTables = [
    "projects", "tasks", "clients", "content_items", "knowledge_items", "finance_transactions",
    "activity_events", "notifications", "architectural_drawings", "architectural_reviews",
    "architectural_review_findings", "architectural_analysis_runs", "architectural_plan_elements",
    "architectural_review_comments", "project_files", "project_notes",
  ];

  for (const table of businessTables) {
    assert.match(foundation, new RegExp(`['\"]${table}['\"]`), `${table} must be part of tenant migration`);
    assert.match(rls, new RegExp(`['\"]${table}['\"]`), `${table} must be part of the RLS gate`);
  }

  assert.match(foundation, /organization_id uuid references public\.organizations\(id\)/);
  assert.match(foundation, /alter column organization_id set not null/);
  assert.match(rls, /force row level security/);
  assert.match(rls, /private\.has_permission\(organization_id,''read''\)/);
  assert.match(rls, /private\.has_permission\(organization_id,''create''\) and user_id=\(select auth\.uid\(\)\)/);
  assert.match(rls, /private\.has_permission\(organization_id,''update''\).*user_id=\(select auth\.uid\(\)\)/s);
  assert.match(rls, /private\.has_permission\(organization_id,''delete''\)/);
  assert.match(rls, /revoke all on public\.%I from anon/);
});

test("owner onboarding cannot create a second tenant or bypass a pending invitation", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260822121500_owner_onboarding_tenant_isolation.sql", import.meta.url), "utf8");
  assert.match(sql, /User already belongs to an active organization/);
  assert.match(sql, /Pending organization invitation must be accepted instead of creating a new organization/);
  assert.match(sql, /insert into public\.organization_memberships\(organization_id,user_id,role,status,invited_by\)/);
  assert.match(sql, /values\(created\.id,caller,'owner','active',caller\)/);
});

test("organization profile and invitations are owner-bound", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260822121500_owner_onboarding_tenant_isolation.sql", import.meta.url), "utf8");
  assert.match(sql, /organization_profiles_select.*private\.has_permission\(organization_id, 'read'\)/s);
  assert.match(sql, /organization_profiles_insert_owner.*private\.member_role\(organization_id\) = 'owner'/s);
  assert.match(sql, /organization_profiles_update_owner.*private\.member_role\(organization_id\) = 'owner'/s);
  assert.match(sql, /Only organization owners may invite members/);
  assert.match(sql, /Owner invitations are not allowed/);
  assert.match(sql, /Only organization owners may revoke invitations/);
});

test("storage remains isolated to the authenticated user's folder", async () => {
  const rls = await readFile(new URL("../supabase/migrations/20260802204818_iam_rls.sql", import.meta.url), "utf8");
  assert.match(rls, /bucket_id='architectural-drawings'.*storage\.foldername\(name\).*auth\.uid\(\)/s);
  assert.match(rls, /bucket_id='project-files'.*storage\.foldername\(name\).*auth\.uid\(\)/s);
});
