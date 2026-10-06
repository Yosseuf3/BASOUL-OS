import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
// Use the Mobile-installed SDK locally; resolution falls back to the root SDK
// in the Web CI job, which installs root dependencies only.
const { createClient } = createRequire(resolve(root, "mobile/package.json"))("@supabase/supabase-js");
const tick = () => new Promise((done) => setImmediate(done));
const empty = { projects: [], tasks: [], notifications: [], drawings: [], reviews: [], planElements: [], reviewComments: [] };
const fixture = { ...empty, projects: [{ id: "private-project" }] };
const session = { user: { id: "user-1", email: "member@example.test" } };

function descendants(tree) {
  if (Array.isArray(tree)) return tree.flatMap(descendants);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...descendants(tree.props?.children)];
}

// Execute actual App/Account components with persistent hook state and effects.
// Only native host primitives and external I/O are mocked; no production auth
// or navigation logic is duplicated in this harness.
function harness(client, workspace = async () => fixture) {
  const slots = [], pendingEffects = [], modules = new Map();
  let cursor = 0;
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => value !== b[i]);
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, (value) => { slots[index].value = typeof value === "function" ? value(slots[index].value) : value; }];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useCallback(fn, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) slots[index] = { fn, deps };
      return slots[index].fn;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) { pendingEffects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; }); }
    },
  };
  function load(relative) {
    const filename = resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename);
    const compiled = { exports: {} };
    const require = (name) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "Fragment" };
      if (name === "react-native") return { View: "View", SafeAreaView: "SafeAreaView", Text: "Text", TouchableOpacity: "TouchableOpacity", ActivityIndicator: "ActivityIndicator", Pressable: "Pressable", StyleSheet: { create: (styles) => styles }, Platform: { OS: "android" }, StatusBar: { currentHeight: 24 }, Linking: { addEventListener: () => ({ remove() {} }) } };
      if (name === "@basoul/yvl-adapter/native") return load("packages/basoul-yvl-adapter/src/native.ts");
      if (name === "@yosseuf/yvl-tokens/react-native") return load("packages/yvl-tokens/generated/react-native.ts");
      if (name === "./tokens" && filename.includes("yvl-tokens")) return load("packages/yvl-tokens/generated/tokens.ts");
      if (name.endsWith(".json")) return JSON.parse(readFileSync(resolve(dirname(filename), name), "utf8"));
      if (name.endsWith("/supabase")) return { isMobileConfigured: true, supabase: client };
      if (name.endsWith("/mobileAuth")) return { getInitialAuthUrl: async () => null, completeMobileAuthUrl: async () => ({ handled: false }) };
      if (name.endsWith("/workspace")) return { loadMobileWorkspace: workspace, loadMobileOrganizationRole: async () => "owner" };
      if (name.endsWith("/AccountScreen")) return load("mobile/src/features/account/AccountScreen.tsx");
      if (name.endsWith("/yvl-primitives")) return load("mobile/src/components/yvl-primitives.tsx");
      return new Proxy({}, { get: (_, key) => String(key) });
    };
    const js = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    runInNewContext(js, { module: compiled, exports: compiled.exports, require }, { filename });
    modules.set(filename, compiled.exports);
    return compiled.exports;
  }
  const App = load("mobile/App.tsx").default;
  const Account = load("mobile/src/features/account/AccountScreen.tsx").AccountScreen;
  return {
    render() { cursor = 0; return App(); },
    async settle() { for (let i = 0; i < 4; i++) { this.render(); while (pendingEffects.length) pendingEffects.shift()(); await tick(); } return this.render(); },
    openAccount(tree) { const button = descendants(tree).find((node) => node.props?.accessibilityLabel === "الحساب"); assert.ok(button, "Account entry must be reachable"); button.props.onPress(); return this.render(); },
    account(tree) { return descendants(tree).find((node) => node.type === Account); },
    logoutButton(account) { const tree = Account(account.props); const button = descendants(tree).find((node) => node.props?.accessibilityLabel === "تسجيل الخروج"); assert.ok(button); return { component: button, native: button.type(button.props) }; },
    dispose() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

function fakeClient(signOutResult = { error: null }) {
  let listener, current = session, calls = 0;
  return {
    get calls() { return calls; },
    signIn() { current = session; listener("SIGNED_IN", current); },
    auth: {
      getSession: async () => ({ data: { session: current } }),
      onAuthStateChange: (fn) => { listener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => { calls++; if (!signOutResult.error) { current = null; listener("SIGNED_OUT", null); } return signOutResult; },
    },
  };
}

test("authenticated header exposes Account, whose neutral logout control is reachable and touch-safe", async () => {
  const client = fakeClient(), h = harness(client);
  try {
    const tree = await h.settle();
    const entry = descendants(tree).find((node) => node.props?.accessibilityLabel === "الحساب");
    assert.equal(entry.props.accessibilityRole, "button");
    assert.ok(entry.props.style.minHeight >= 44 && entry.props.style.minWidth >= 44);
    assert.equal(descendants(tree).find((node) => node.props?.style?.paddingTop !== undefined).props.style.paddingTop, 24);
    const account = h.account(h.openAccount(tree));
    assert.ok(account);
    const button = h.logoutButton(account);
    assert.equal(button.component.props.tone, "neutral");
    assert.equal(button.native.props.accessibilityRole, "button");
    assert.ok(button.native.props.style({ pressed: false }).some((style) => style?.minHeight >= 44));
    await button.native.props.onPress();
    assert.equal(client.calls, 1, "Use the existing canonical auth.signOut path exactly once");
    const loggedOut = h.render();
    assert.ok(descendants(loggedOut).some((node) => node.type === "LoginScreen"));
    assert.ok(!descendants(loggedOut).some((node) => ["DashboardScreen", "AccountScreen"].includes(node.type)));
    assert.equal(h.account(loggedOut), undefined);
    assert.ok(!descendants(loggedOut).some((node) => node.props?.accessibilityLabel === "الحساب"));
    account.props.onBack();
    assert.ok(descendants(h.render()).some((node) => node.type === "LoginScreen"), "Stale account navigation must not reopen Dashboard after logout");
  } finally { h.dispose(); }
});

test("logout rejects a late workspace refresh and clears navigation, role and cached workspace", async () => {
  let finish;
  const client = fakeClient(), h = harness(client, () => new Promise((resolve) => { finish = resolve; }));
  try {
    const tree = await h.settle();
    const account = h.account(h.openAccount(tree));
    await h.logoutButton(account).native.props.onPress();
    finish(fixture);
    await tick();
    assert.ok(descendants(h.render()).some((node) => node.type === "LoginScreen"));
    // Re-enter with a fresh load still pending: the old private workspace and
    // privileged role must not survive logout or the late response.
    client.signIn();
    const dashboard = descendants(h.render()).find((node) => node.type === "DashboardScreen");
    assert.ok(dashboard);
    assert.equal(dashboard.props.data.projects.length, 0);
    dashboard.props.onNavigate("administration");
    const administration = descendants(h.render()).find((node) => node.type === "AdministrationScreen");
    assert.equal(administration.props.role, "viewer");
  } finally { h.dispose(); }
});

test("pending logout disables the control and prevents a second sign-out request", async () => {
  const client = fakeClient(), canonical = client.auth.signOut;
  let finish;
  client.auth.signOut = async () => { await new Promise((resolve) => { finish = resolve; }); return canonical(); };
  const h = harness(client);
  try {
    const account = h.account(h.openAccount(await h.settle()));
    const pending = h.logoutButton(account).native.props.onPress();
    const busy = h.logoutButton(h.account(h.render()));
    assert.equal(busy.native.props.disabled, true);
    assert.equal(busy.native.props.accessibilityState.busy, true);
    await busy.native.props.onPress();
    finish();
    await pending;
    assert.equal(client.calls, 1);
    assert.ok(descendants(h.render()).some((node) => node.type === "LoginScreen"));
  } finally { h.dispose(); }
});

test("sign-out errors are accessible and retryable without inventing successful logout", async () => {
  const client = fakeClient({ error: new Error("network") }), h = harness(client);
  try {
    const tree = await h.settle();
    let account = h.account(h.openAccount(tree));
    await h.logoutButton(account).native.props.onPress();
    account = h.account(h.render());
    assert.ok(account, "Do not force fake-client success when sign-out fails");
    assert.equal(account.props.signingOut, false);
    assert.ok(account.props.error.includes("تعذر تسجيل الخروج"));
    assert.ok(descendants(account.type(account.props)).some((node) => node.props?.accessibilityRole === "alert"));
    assert.equal(h.logoutButton(account).native.props.disabled, false);
  } finally { h.dispose(); }
});

test("installed Supabase SDK removes persisted session; relaunch returns to Login without organization writes", async () => {
  const storageKey = "basoul-logout-regression";
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"), Buffer.from(JSON.stringify({ sub: session.user.id, exp })).toString("base64url"), "test-signature"].join(".");
  const values = new Map([[storageKey, JSON.stringify({ ...session, access_token: token, refresh_token: "test-refresh", token_type: "bearer", expires_at: exp, expires_in: 3600 })]]);
  const requests = [];
  const storage = { getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => values.set(key, value), removeItem: async (key) => { values.delete(key); } };
  const options = { auth: { storageKey, storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: async (url, options) => { requests.push({ url: String(url), method: options.method }); assert.ok(String(url).includes("/auth/v1/logout")); return new Response(null, { status: 204 }); } } };
  const client = createClient("https://mobile-logout-test.supabase.co", "test-anon-key", options);
  const h = harness(client);
  try {
    const tree = await h.settle();
    const account = h.account(h.openAccount(tree));
    await h.logoutButton(account).native.props.onPress();
    assert.equal(values.has(storageKey), false);
    assert.equal((await client.auth.getSession()).data.session, null);
    assert.ok(descendants(h.render()).some((node) => node.type === "LoginScreen"));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "POST");
    const restarted = createClient("https://mobile-logout-test.supabase.co", "test-anon-key", options);
    const relaunched = harness(restarted);
    try { assert.ok(descendants(await relaunched.settle()).some((node) => node.type === "LoginScreen")); }
    finally { relaunched.dispose(); await restarted.auth.stopAutoRefresh(); }
  } finally { h.dispose(); await client.auth.stopAutoRefresh(); }
});

test("account access keeps current BASOUL branding and no duplicated auth/storage logic", () => {
  const account = readFileSync(resolve(root, "mobile/src/features/account/AccountScreen.tsx"), "utf8");
  const app = readFileSync(resolve(root, "mobile/App.tsx"), "utf8");
  assert.doesNotMatch(account, /YOSSEUF|@yosseuf\/ui-tokens|signOut\(|createClient|AsyncStorage|removeItem/);
  assert.equal((app.match(/supabase\.auth\.signOut\(/g) ?? []).length, 1);
  assert.ok(app.includes('if (!isMobileConfigured || !session)'));
});
