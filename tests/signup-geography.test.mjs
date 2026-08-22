import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("login exposes a separate account creation path", async () => {
  const login = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8");
  const signup = await readFile(new URL("../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(login, /href="\/signup"/);
  assert.match(signup, /supabase\.auth\.signUp/);
  assert.match(signup, /router\.replace\("\/onboarding"\)/);
  assert.doesNotMatch(signup, /createOwnedOrganization/);
});

test("signup keeps identity creation separate from organization creation", async () => {
  const signup = await readFile(new URL("../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(signup, /Confirm your email/);
  assert.match(signup, /organization invitation/);
  assert.doesNotMatch(signup, /organization_id/);
});

test("owner onboarding uses cascading country region and city selectors", async () => {
  const onboarding = await readFile(new URL("../app/onboarding/page.tsx", import.meta.url), "utf8");
  assert.match(onboarding, /level=countries/);
  assert.match(onboarding, /level: "cities"/);
  assert.match(onboarding, /changeCountry/);
  assert.match(onboarding, /changeRegion/);
  assert.match(onboarding, /<select required value=\{countryCode\}/);
  assert.match(onboarding, /value=\{region\}/);
  assert.match(onboarding, /value=\{city\}/);
});

test("geography provider remains server-side and validates supported levels", async () => {
  const route = await readFile(new URL("../app/api/geography/route.ts", import.meta.url), "utf8");
  assert.match(route, /countriesnow\.space/);
  assert.match(route, /level === "countries"/);
  assert.match(route, /level === "cities"/);
  assert.match(route, /unsupported geography level/);
  assert.match(route, /Geography data is temporarily unavailable/);
});
