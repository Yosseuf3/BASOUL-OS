import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/api/integrations/ai/conversation/route.ts", import.meta.url), "utf8");

test("BASOUL OS AI gateway delegates tenant authority to BASOUL AI", () => {
  assert.match(route, /https:\/\/ai\.basoul\.net/);
  assert.match(route, /new URL\("\/api\/conversation"/);
  assert.match(route, /request\.headers\.get\("authorization"\)/);
  assert.match(route, /authorization,/);
  assert.doesNotMatch(route, /organization[_-]?id/i);
  assert.doesNotMatch(route, /service[_-]?role/i);
  assert.doesNotMatch(route, /cookie/i);
});

test("BASOUL OS AI gateway is streaming, no-store and fail-closed", () => {
  assert.match(route, /Missing BASOUL session bearer token/);
  assert.match(route, /application\/x-ndjson/);
  assert.match(route, /upstream\.body/);
  assert.match(route, /cache: "no-store"/);
  assert.match(route, /BASOUL_AI_URL must use HTTPS outside local development/);
  assert.match(route, /BASOUL AI is unavailable/);
});
