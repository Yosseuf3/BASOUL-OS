import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("identity resolver uses per-user metadata then email fallback", async () => {
  const identity = await readFile(new URL("../lib/auth/user-identity.ts", import.meta.url), "utf8");
  assert.match(identity, /metadata\.full_name/);
  assert.match(identity, /metadata\.name/);
  assert.match(identity, /emailLocalPart\(email\)/);
  assert.match(identity, /initialsFor\(displayName\)/);
  assert.doesNotMatch(identity, /Yosseuf/);
});

test("signup captures a full name into Supabase auth metadata", async () => {
  const signup = await readFile(new URL("../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(signup, /الاسم الكامل/);
  assert.match(signup, /Full name/);
  assert.match(signup, /full_name: fullName\.trim\(\)/);
  assert.match(signup, /autoComplete="name"/);
  assert.match(signup, /!fullName\.trim\(\)/);
});

test("sidebar and executive dashboard resolve the current auth session identity", async () => {
  const switcher = await readFile(new URL("../components/shell/workspace-switcher.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../features/dashboard/dashboard-view.tsx", import.meta.url), "utf8");
  assert.match(switcher, /resolveUserIdentity\(data\.session\.user\)/);
  assert.match(switcher, /identity\.displayName/);
  assert.match(switcher, /identity\.initials/);
  assert.match(dashboard, /resolveUserIdentity\(data\.session\.user\)\.displayName/);
  assert.doesNotMatch(dashboard, /userName = "Yosseuf"/);
});
