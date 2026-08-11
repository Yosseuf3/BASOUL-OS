import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("login release label is sourced from canonical APP_INFO", async () => {
  const source = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8");
  assert.match(source, /APP_INFO\.fullLabel/);
  assert.doesNotMatch(source, /BASOUL · v4\.0\.0-beta\.1/);
});
