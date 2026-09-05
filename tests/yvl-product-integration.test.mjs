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

test("BASOUL mobile auth uses the approved master identity and visual truth", async () => {
  const [foundation, native, login, status, manifest] = await Promise.all([
    read("packages/ui-tokens/src/index.ts"),
    read("packages/basoul-yvl-adapter/src/native.ts"),
    read("mobile/src/features/auth/LoginScreen.tsx"),
    read("brand/basoul/BRAND_STATUS.md"),
    read("brand/basoul/specs/SHA256_MANIFEST.csv"),
  ]);
  assert.match(status, /Brand Foundation:\s*APPROVED/);
  assert.match(status, /Primary Logo:\s*APPROVED/);
  assert.match(manifest, /brand\/basoul\/assets\/primary-logo\/BASOUL_Primary_Logo_Master\.png/);
  assert.match(foundation, /primary:\s*"#2563eb"/i);
  assert.doesNotMatch(foundation, /primary:\s*"#d7ad43"/i);
  assert.match(native, /primary:\s*foundationColorValues\.primary/);
  assert.match(login, /BASOUL_Primary_Logo_Master\.png/);
  assert.match(login, /<Image\s+source=\{BASOUL_PRIMARY_LOGO\}/);
  assert.match(login, /showBrand=\{false\}/);
  assert.doesNotMatch(login, /<Text[^>]*>BASOUL<\/Text>|AI-NATIVE ECOSYSTEM|BASOUL · MOBILE|مركز القيادة معك دائمًا/);
});

test("mobile product surfaces use the approved BASOUL OS lockup instead of textual brand approximations", async () => {
  const [screen, dashboard, administration, visualTruth] = await Promise.all([
    read("mobile/src/components/Screen.tsx"),
    read("mobile/src/features/dashboard/DashboardScreen.tsx"),
    read("mobile/src/features/administration/AdministrationScreen.tsx"),
    read("docs/design-system/BASOUL_VISUAL_SOURCE_OF_TRUTH.md"),
  ]);
  assert.match(visualTruth, /APPROVED \/ LOCKED FOR PRODUCT MIGRATION/);
  assert.match(visualTruth, /BASOUL OS:\s*Light blue \/ cyan direction/);
  assert.match(visualTruth, /uses \*\*Inter\*\* as the primary product typography direction/);
  assert.match(screen, /BASOUL_OS_Lockup\.png/);
  assert.match(screen, /accessibilityLabel="BASOUL OS"/);
  assert.doesNotMatch(dashboard, /BASOUL · EXECUTIVE WORKSPACE/);
  assert.doesNotMatch(administration, /BASOUL · YVL ADMINISTRATION/);
  assert.match(dashboard, /borderColor:\s*tokens\.colors\.border/);
  assert.match(dashboard, /backgroundColor:\s*tokens\.colors\.info/);
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

test("mobile resolves local adapter peers for TypeScript and Metro", async () => {
  const [adapterPackage, mobilePackage, tsconfig, metro] = await Promise.all([
    read("packages/basoul-yvl-adapter/package.json"),
    read("mobile/package.json"),
    read("mobile/tsconfig.json"),
    read("mobile/metro.config.js"),
  ]);
  assert.match(adapterPackage, /"peerDependencies"/);
  assert.match(mobilePackage, /"@yosseuf\/yvl-tokens": "file:\.\.\/packages\/yvl-tokens"/);
  assert.match(tsconfig, /"@yosseuf\/yvl-tokens\/react-native"/);
  assert.match(metro, /watchFolders/);
  assert.match(metro, /nodeModulesPaths/);
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
