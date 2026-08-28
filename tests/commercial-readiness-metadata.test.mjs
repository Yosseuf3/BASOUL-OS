import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("current product metadata reflects the stable BASOUL baseline", () => {
  const app = JSON.parse(read("mobile/app.json")).expo;
  const readme = read("README.md");
  const readmeAr = read("README_AR.md");

  assert.equal(app.name, "BASOUL");
  assert.equal(app.version, "4.0.0");
  assert.equal(app.extra?.product, "BASOUL");
  assert.equal(app.extra?.release, "v4.0.0 Stable");
  assert.match(readme, /Current stable baseline: \*\*BASOUL v4\.0\.0\*\*/);
  assert.match(readmeAr, /الحالة المستقرة الحالية: \*\*BASOUL v4\.0\.0\*\*/);
});

test("runtime registry preserves external identifiers and authority boundaries", () => {
  const registry = read("docs/operations/BASOUL_RUNTIME_REGISTRY_2026-08-28.md");

  assert.match(registry, /okghyypmkymxvtsuvdvb/);
  assert.match(registry, /ogqdfucxwjutkpoahezn/);
  assert.match(registry, /do not create an independent organization authority/i);
  assert.match(registry, /not renamed as cosmetic cleanup/i);
});
