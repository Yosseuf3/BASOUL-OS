import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../supabase/migrations/20260809175830_secure_member_invitations.sql", import.meta.url);
const functionUrl = new URL("../supabase/functions/organization-admin/index.ts", import.meta.url);

test("invitation records are private, tenant-scoped, expiring, and non-owner", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /organization_invitations/);
  assert.match(sql, /force row level security/);
  assert.match(sql, /revoke all on public\.organization_invitations from public, anon, authenticated/);
  assert.match(sql, /role in \('viewer','member','admin'\)/);
  assert.match(sql, /pending','accepted','expired','revoked/);
  assert.match(sql, /organization_invitations_pending_email_idx/);
});

test("positive invitation and role operations are server authorized", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /private\.role_rank\(caller_role\)<30/);
  assert.match(sql, /target_role not in \('viewer','member','admin'\)/);
  assert.match(sql, /change_organization_member_role/);
  assert.match(sql, /deactivate_organization_member/);
  assert.match(sql, /accept_organization_invitations/);
});

test("negative authorization boundaries are explicit", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /Authentication required/);
  assert.match(sql, /Owner invitations are not allowed/);
  assert.match(sql, /Users cannot escalate their own role/);
  assert.match(sql, /Admins cannot modify owners/);
  assert.match(sql, /Invitation identity mismatch/);
  assert.match(sql, /Active membership already exists/);
  assert.match(sql, /private\.has_permission\(invitation\.organization_id,'manage_members'\)/);
});

test("Edge Function keeps Auth Admin server-side and verifies the caller", async () => {
  const source = await readFile(functionUrl, "utf8");
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /userClient\.auth\.getUser/);
  assert.match(source, /auth\.admin\.inviteUserByEmail/);
  assert.match(source, /auth\.admin\.listUsers/);
  assert.match(source, /create_organization_invitation/);
  assert.match(source, /attach_organization_invitation/);
  assert.doesNotMatch(source, /console\.(log|warn|error).*service|NEXT_PUBLIC_SUPABASE_SERVICE|EXPO_PUBLIC_SUPABASE_SERVICE/);
});

test("sensitive invitation operations emit audit events", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const action of ["member_invited", "role_changed", "member_deactivated", "invitation_revoked"]) {
    assert.match(sql, new RegExp(`'${action}'`));
  }
  assert.match(sql, /target_email/);
  assert.match(sql, /invitation_id/);
});

test("web mutations use only the secure Edge Function and mobile stays read-only", async () => {
  const service = await readFile(new URL("../lib/organizations/administration.ts", import.meta.url), "utf8");
  const mobile = await readFile(new URL("../mobile/src/features/administration/AdministrationScreen.tsx", import.meta.url), "utf8");
  assert.match(service, /functions\.invoke\("organization-admin"/);
  assert.doesNotMatch(service, /service_role|SUPABASE_SERVICE/);
  assert.doesNotMatch(mobile, /invite|change_role|deactivate|remove|revoke/);
});
