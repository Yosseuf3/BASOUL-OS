import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../design-system/yvl/", import.meta.url);

test("YVL semantic color contract is complete", async () => {
  const { color } = JSON.parse(await readFile(new URL("tokens/colors.json", root), "utf8"));
  for (const token of ["background", "surface", "surface-elevated", "electric-blue", "cyan", "silver", "white", "text-muted", "borders", "focus", "success", "warning", "danger"]) {
    const key = token === "borders" ? "border" : token;
    assert.match(color[key], /^#[0-9A-F]{6}$/i, `missing ${token}`);
  }
});

test("YVL package exposes web and native-compatible aliases", async () => {
  const index = await readFile(new URL("../packages/yvl-tokens/src/index.ts", import.meta.url), "utf8");
  const colors = await readFile(new URL("../packages/yvl-tokens/src/colors.ts", import.meta.url), "utf8");
  assert.match(index, /yvlVersion = "1\.0\.0"/);
  assert.match(index, /yvlTokens/);
  assert.match(colors, /yvlColorCssVariables/);
  assert.match(colors, /--yvl-color-focus/);
});
