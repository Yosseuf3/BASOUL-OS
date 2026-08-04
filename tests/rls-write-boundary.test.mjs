import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("core workspace writes use the server authorization boundary", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const resource of ["projects", "tasks", "clients", "content_items", "knowledge_items", "finance_transactions"]) {
    assert.match(page, new RegExp(`authorizedWorkspaceWrite\\(\"${resource}\"`));
    assert.doesNotMatch(page, new RegExp(`from\\(\"${resource}\"\\)\\.(insert|update)`));
  }
});

test("the server strips client identity claims and injects the verified user", async () => {
  const auth = await readFile(new URL("../lib/auth/authorized-workspace.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/workspace/[resource]/route.ts", import.meta.url), "utf8");
  for (const field of ["user_id", "organization_id", "created_by", "owner_id"]) assert.match(auth, new RegExp(field));
  assert.match(auth, /getUser\(accessToken\)/);
  assert.match(route, /resolved\.auth\.organizationId/);
  assert.match(route, /eq\("organization_id", resolved\.auth\.organizationId\)/);
  assert.match(auth, /ensure_personal_organization/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SERVICE/);
});

test("IAM migrations cover every business table with organization RLS", async () => {
  const foundation = await readFile(new URL("../supabase/migrations/20260802204811_iam_foundation.sql", import.meta.url), "utf8");
  const rls = await readFile(new URL("../supabase/migrations/20260802204818_iam_rls.sql", import.meta.url), "utf8");
  const businessTables = [
    "projects", "tasks", "clients", "content_items", "knowledge_items", "finance_transactions",
    "activity_events", "notifications", "architectural_drawings", "architectural_reviews",
    "architectural_review_findings", "architectural_analysis_runs", "architectural_plan_elements",
    "architectural_review_comments", "project_files", "project_notes",
  ];
  for (const table of businessTables) {
    assert.match(foundation, new RegExp(`'${table}'`));
    assert.match(rls, new RegExp(`'${table}'`));
  }
  for (const permission of ["read", "create", "update", "delete", "manage_members", "manage_organization"]) {
    assert.match(foundation, new RegExp(`'${permission}'`));
  }
  assert.match(rls, /force row level security/);
  assert.match(foundation, /existing_role in \('owner','admin'\)/);
  assert.doesNotMatch(foundation + rls, /raw_user_meta_data|user_metadata|auth\.role\(\)/);
});
