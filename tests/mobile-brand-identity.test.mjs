import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const identity = JSON.parse(readFileSync(resolve(root, "packages/basoul-yvl-adapter/src/identity.json")));
const appConfig = JSON.parse(readFileSync(resolve(root, "mobile/app.json")));
const aliases = {
  "@basoul/yvl-adapter/native": "packages/basoul-yvl-adapter/src/native.ts",
  "@yosseuf/yvl-tokens/react-native": "packages/yvl-tokens/generated/react-native.ts",
};
const element = (type, props) => ({ type, props });

// Execute actual transpiled components/tokens with host primitives and external I/O mocked.
// Assets resolve to real repository files, not a guessed matching source-string pattern.
function load(relative, { states = [], config = appConfig, platform = "android" } = {}) {
  const filename = resolve(root, relative);
  const compiled = { exports: {} };
  const require = (name) => {
    if (aliases[name]) return load(aliases[name]);
    if (name === "./tokens" && filename.includes("yvl-tokens")) return load("packages/yvl-tokens/generated/tokens.ts");
    if (name === "react") return { useState: (initial) => [states.length ? states.shift() : initial, () => {}], useCallback: (fn) => fn, useEffect: () => {}, useRef: (value) => ({ current: value }) };
    if (name === "react/jsx-runtime") return { jsx: element, jsxs: element, Fragment: "Fragment" };
    if (name === "react-native") return { Image: "Image", View: "View", SafeAreaView: "SafeAreaView", ScrollView: "ScrollView", KeyboardAvoidingView: "KeyboardAvoidingView", Text: "Text", TouchableOpacity: "TouchableOpacity", ActivityIndicator: "ActivityIndicator", Platform: { OS: platform }, StatusBar: { currentHeight: 24 }, StyleSheet: { create: (styles) => styles } };
    if (name.endsWith("app.json")) return config;
    if (name.endsWith(".json")) return JSON.parse(readFileSync(resolve(dirname(filename), name)));
    if (name.endsWith(".png")) { const path = resolve(dirname(filename), name); readFileSync(path); return { path }; }
    if (name.endsWith("/supabase")) return { isMobileConfigured: true, supabase: {} };
    if (name.endsWith("/organizations/context")) return load("mobile/src/organizations/context.ts");
    if (name.endsWith("/executive")) return { buildExecutiveSnapshot: () => ({ overdueTasks: 0, focusTasks: [], recommendations: [] }) };
    if (name === "expo-status-bar") return { StatusBar: "StatusBar" };
    return new Proxy({}, { get: (_, key) => String(key) });
  };
  const js = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  runInNewContext(js, { module: compiled, exports: compiled.exports, require }, { filename });
  return compiled.exports;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

test("native identity resolves approved palette, never legacy gold, preserving YVL mechanics", () => {
  const native = load("packages/basoul-yvl-adapter/src/native.ts").basoulYvlNative;
  const yvl = load("packages/yvl-tokens/generated/react-native.ts").yvlNativeTokens;
  for (const [key, expected] of Object.entries({ primary: "#2563EB", accent: "#2563EB", secondary: "#38B2F6", violet: "#8B5CF6", background: "#0B1020", surface: "#1B2230", textPrimary: "#FFFFFF", textSecondary: "#E5E7EB" })) assert.equal(native.colors[key], expected);
  assert.notEqual(native.colors.primary.toLowerCase(), "#d7ad43");
  assert.equal(native.colors.raised, yvl.color.surfaceElevated);
  assert.equal(native.radius.md, yvl.radii.md);
  assert.equal(native.typography.family.body, "System", "Inter loading remains explicitly deferred, not falsely declared");
  const approval = readFileSync(resolve(root, "docs/design-system/BASOUL_VISUAL_SOURCE_OF_TRUTH.md"), "utf8");
  for (const value of Object.values(identity)) assert.ok(approval.includes(value), `Missing approved provenance for ${value}`);
});

test("Web identity CSS is generated from the same shared identity and consumed by its adapter", () => {
  execFileSync(process.execPath, ["scripts/generate-basoul-identity.mjs", "--check"], { cwd: root });
  const css = readFileSync(resolve(root, "packages/basoul-yvl-adapter/src/web.css"), "utf8");
  assert.ok(css.includes('@import "./identity.css"'));
  for (const [semantic, token] of Object.entries({ background: "background", electric: "primary", sky: "secondary", violet: "violet" })) assert.ok(css.includes(`--basoul-${semantic}: var(--basoul-identity-${token});`));
});

test("approved action and accent-text pairings preserve readable contrast", () => {
  const { colors } = load("packages/basoul-yvl-adapter/src/native.ts").basoulYvlNative;
  const luminance = (hex) => {
    const rgb = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const contrast = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); };
  assert.equal(colors.accentText, identity.secondary);
  assert.ok(contrast(colors.textPrimary, colors.primary) >= 4.5);
  assert.ok(contrast(colors.accentText, colors.background) >= 4.5);
  assert.ok(contrast(colors.accentText, colors.surface) >= 4.5);
});

test("login renders accessible original BASOUL logo without replacing artwork", () => {
  const tree = load("mobile/src/features/auth/LoginScreen.tsx").LoginScreen();
  const images = nodes(tree).filter((node) => node.type === "Image");
  assert.equal(images.length, 1);
  assert.equal(images[0].props.source.path, resolve(root, "brand/basoul/assets/primary-logo/BASOUL_Primary_Logo_Master.png"));
  assert.equal(hash(images[0].props.source.path), "3643eb9645d50164eeac39e463b887119f4bc1a5ffc77f54d90f5cf9a10de486");
  assert.equal(images[0].props.accessibilityLabel, "BASOUL");
  assert.equal(images[0].props.resizeMode, "contain");
  assert.equal(images[0].props.accessible, true);
});

for (const [platform, behavior] of [["android", "height"], ["ios", "padding"]]) {
  test(`Login uses a keyboard-bounded, naturally growing RTL scroll form on ${platform}`, () => {
    const tree = load("mobile/src/features/auth/LoginScreen.tsx", { platform, states: ["", "", false, "validation error"] }).LoginScreen();
    assert.equal(tree.type, "KeyboardAvoidingView");
    assert.equal(tree.props.behavior, behavior);
    assert.equal(tree.props.style.flex, 1);
    assert.equal(tree.props.keyboardVerticalOffset, undefined, "No device-specific offset");
    const scroll = tree.props.children;
    assert.equal(scroll.type, "ScrollView");
    assert.equal(scroll.props.style.flex, 1);
    assert.equal(scroll.props.keyboardShouldPersistTaps, "handled", "Login tap must reach the button while IME stays open");
    assert.equal(scroll.props.contentInsetAdjustmentBehavior, "automatic");
    assert.equal(scroll.props.contentContainerStyle.flexGrow, 1);
    for (const key of ["height", "maxHeight", "flex", "flexShrink"]) assert.equal(scroll.props.contentContainerStyle[key], undefined, `Do not constrain content with ${key}`);
    assert.equal(scroll.props.contentContainerStyle.direction, "rtl");
    const form = nodes(scroll);
    const inputs = form.filter((node) => node.props?.onChangeText);
    assert.equal(inputs.length, 2);
    assert.equal(inputs[0].props.keyboardType, "email-address");
    assert.equal(inputs[1].props.secureTextEntry, true);
    assert.equal(typeof inputs[1].props.onSubmitEditing, "function");
    assert.ok(form.some((node) => node.props?.children === "validation error"));
    assert.ok(form.some((node) => typeof node.props?.onPress === "function" && nodes(node).some((child) => child.props?.children === "تسجيل الدخول")));
  });
}

test("authenticated dashboard renders compact accessible original BASOUL OS lockup", () => {
  const tree = load("mobile/src/features/dashboard/DashboardScreen.tsx").DashboardScreen({ data: { projects: [], drawings: [], reviews: [] }, onNavigate() {}, onRefresh() {}, refreshing: false });
  const image = nodes(tree).find((node) => node.type === "Image");
  assert.ok(image);
  assert.equal(image.props.source.path, resolve(root, "brand/basoul/assets/product-lockups/BASOUL_OS_Lockup.png"));
  assert.equal(hash(image.props.source.path), "f6b5487910e395cdab7a6796873f97116615269ce702c393270742f14b287308");
  assert.equal(image.props.accessibilityLabel, "BASOUL OS");
  assert.equal(image.props.resizeMode, "contain");
  assert.equal(image.props.accessible, true);
  assert.ok(image.props.style.maxWidth <= 220 && image.props.style.height <= 48);
});

test("launcher resolves to the pinned approved artwork and protected Android identity", () => {
  const icon = resolve(root, "mobile", appConfig.expo.icon);
  assert.equal(hash(icon), hash(resolve(root, "brand/basoul/assets/app-icons/BASOUL_App_Icon_1024.png")));
  assert.equal(hash(icon), "8e02fee509d0aebc42d5f0f6f27802fbb9f491c076631bc87bc694639dbfd50d");
  assert.equal(appConfig.expo.android.package, "com.yosseufradwan.os");
  assert.equal(appConfig.expo.extra.eas.projectId, "6f770730-8c8e-49b0-81b9-f9773faf567a");
  assert.equal(appConfig.expo.version, "4.0.0");
  assert.equal(appConfig.expo.android.versionCode, 32);
});

test("footer renders version from configuration, not a stale release literal", () => {
  for (const version of [appConfig.expo.version, "9.8.7"]) {
    const config = { ...appConfig, expo: { ...appConfig.expo, version } };
    const tree = load("mobile/App.tsx", { states: [{ user: { id: "test" } }, false], config }).default();
    const texts = nodes(tree).filter((node) => node.type === "Text").map((node) => [].concat(node.props.children).join(""));
    assert.ok(texts.includes(`v${version}`));
    assert.ok(!texts.some((text) => text.includes("v3.0.2")));
  }
  // Ensure active branding cannot import a legacy logo anywhere in Mobile.
  const require = createRequire(import.meta.url);
  const { readdirSync } = require("node:fs");
  function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)]); }
  for (const path of [resolve(root, "mobile/App.tsx"), ...walk(resolve(root, "mobile/src"))].filter((path) => /\.[jt]sx?$/.test(path))) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /(?:require\s*\(|from\s*)["'][^"']*(?:yosseuf[^"']*logo|logo[^"']*yosseuf|brand\/yosseuf)/i);
  }
});
