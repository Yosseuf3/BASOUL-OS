import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("BASOUL adapter consumes canonical YVL without redefining it", async () => {
  const [web, native, pkg] = await Promise.all([
    read("packages/basoul-yvl-adapter/src/index.ts"),
    read("packages/basoul-yvl-adapter/src/native.ts"),
    read("packages/basoul-yvl-adapter/package.json"),
  ]);
  assert.match(pkg, /"@basoul\/yvl-adapter"/);
  assert.match(web, /@yosseuf\/yvl-tokens\/generated/);
  assert.match(native, /@yosseuf\/yvl-tokens\/react-native/);
  assert.match(web, /foundationColorValues/);
  assert.doesNotMatch(web + native, /#[\da-f]{3,8}\b/i);
});

test("adapter exposes the complete semantic contract and compatibility bridge", async () => {
  const [source, css] = await Promise.all([
    read("packages/basoul-yvl-adapter/src/index.ts"),
    read("packages/basoul-yvl-adapter/src/web.css"),
  ]);
  for (const semantic of ["background","surface","surfaceRaised","textPrimary","textSecondary","border","accent","success","warning","danger","focus","disabled","spacing","radius","elevation","typography","motion"]) {
    assert.match(source, new RegExp("\\b" + semantic + "\\b"));
  }
  assert.match(css, /--ys-surface-canvas: var\(--basoul-background\)/);
  assert.match(css, /--basoul-accent: var\(--ys-action-primary\)/);
});

test("shared web and native primitives consume only the BASOUL YVL adapter", async () => {
  const [web, native] = await Promise.all([
    read("components/ui/yvl-primitives.tsx"),
    read("mobile/src/components/yvl-primitives.tsx"),
  ]);
  assert.match(web, /export function Button/);
  assert.match(web, /export function Dialog/);
  assert.match(web, /export function TableContainer/);
  assert.match(native, /@basoul\/yvl-adapter\/native/);
  assert.match(native, /YvlButton/);
  assert.match(native, /YvlTextInput/);
  assert.doesNotMatch(native, /@yosseuf\/ui-tokens|nativeDarkTheme/);
});

test("target web and mobile screens are adapter governed", async () => {
  const files = [
    "features/administration/administration-view.tsx",
    "mobile/src/features/auth/LoginScreen.tsx",
    "mobile/src/features/dashboard/DashboardScreen.tsx",
    "mobile/src/features/command-center/CommandCenterScreen.tsx",
    "mobile/src/features/administration/AdministrationScreen.tsx",
  ];
  const sources = await Promise.all(files.map(read));
  assert.match(sources[0], /yvl-primitives/);
  for (const source of sources.slice(1)) assert.match(source, /@basoul\/yvl-adapter|yvl-primitives/);
  assert.ok(sources.every((source) => !/@yosseuf\/ui-tokens|nativeDarkTheme/.test(source)));
});

test("machine-readable inventory has no missing semantic mappings", async () => {
  const inventory = JSON.parse(await read("docs/design-system/yvl-style-inventory.json"));
  assert.equal(inventory.adapter, "packages/basoul-yvl-adapter");
  assert.deepEqual(inventory.missingSemanticMappings, []);
  assert.ok(inventory.totals.yvlCompliantReferences > 0);
  assert.ok(Array.isArray(inventory.files) && inventory.files.length > 0);
});
