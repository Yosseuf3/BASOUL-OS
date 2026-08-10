import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("Platform manifest exposes BASOUL identity while preserving OS compatibility", async () => {
  const source = await readFile(new URL("../packages/platform/src/manifest.ts", import.meta.url), "utf8");
  assert.match(source, /id: "basoul-platform"/);
  assert.match(source, /name: "BASOUL"/);
  assert.match(source, /authority: "BASOUL HQ"/);
  assert.match(source, /product: "BASOUL OS"/);
  assert.match(source, /minimumVersion: "3\.1\.0"/);
  assert.match(source, /production: "read-only-unless-approved"/);
});

test("Platform registry contains every required business module and gateway", async () => {
  const source = await readFile(new URL("../packages/platform/src/registry.ts", import.meta.url), "utf8");
  for (const id of ["crm", "projects", "tasks", "finance", "knowledge", "documents", "notifications", "ai-core", "digital-human"]) {
    assert.match(source, new RegExp(`id: "${id}"`));
  }
});
