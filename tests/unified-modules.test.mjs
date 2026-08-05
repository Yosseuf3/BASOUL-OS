import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("business modules reuse existing resources instead of duplicating products", async () => {
  const registry = await readFile(new URL("../packages/platform/src/registry.ts", import.meta.url), "utf8");
  for (const pair of [["crm", "clients"], ["projects", "projects"], ["tasks", "tasks"], ["finance", "finance_transactions"], ["documents", "content_items"]]) {
    assert.match(registry, new RegExp(`${pair[0]}: "${pair[1]}"`));
  }
});

test("unified API returns versioned envelopes and organization scope", async () => {
  const route = await readFile(new URL("../app/api/platform/modules/[module]/route.ts", import.meta.url), "utf8");
  assert.match(route, /PlatformApiEnvelope/);
  assert.match(route, /organizationId: auth\.organizationId/);
  assert.match(route, /business\.read/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SERVICE/);
});

test("AI and Digital Human gateways expose read-only health", async () => {
  const route = await readFile(new URL("../app/api/platform/gateways/[gateway]/route.ts", import.meta.url), "utf8");
  const service = await readFile(new URL("../lib/platform/gateway-service.ts", import.meta.url), "utf8");
  assert.match(route, /export async function GET/);
  assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);
  assert.match(service, /method: "GET"/);
  assert.match(service, /cache: "no-store"/);
});
