import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("release metadata is aligned", async () => {
  const root = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  const mobile = JSON.parse(await readFile(new URL("../mobile/package.json", import.meta.url)));
  assert.equal(root.version, "4.0.0-rc.1");
  assert.equal(mobile.version, root.version);
});

test("Foundation adapters expose semantic status roles", async () => {
  const native = await readFile(new URL("../packages/ui-tokens/src/native.ts", import.meta.url), "utf8");
  for (const role of ["primary", "danger", "success", "warning", "info"]) assert.match(native, new RegExp(`${role}:`));
  assert.doesNotMatch(native, /gold:/);
});
