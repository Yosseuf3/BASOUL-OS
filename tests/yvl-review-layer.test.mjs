import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("YVL schemas and generated artifacts validate", async () => {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["scripts/validate-yvl-tokens.mjs", "--check-generated"], { cwd: new URL("../", import.meta.url), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("review showcase is isolated and exposes stable targets", async () => {
  const html = await read("design-system/yvl/showcase/index.html");
  for (const id of ["colors", "typography", "spacing", "radii", "shadows", "motion", "hud", "patterns", "iconography", "accessibility"]) assert.match(html, new RegExp(`data-yvl-testid="${id === "root" ? "" : "section-"}${id}"`));
  assert.match(await read("design-system/yvl/showcase/showcase.css"), /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(html, /<script\b/i);
});
