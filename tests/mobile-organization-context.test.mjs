import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const org = (id, userId = "u1", role = "owner") => ({ userId, organizationId: id, name: `Organization ${id}`, role });
function load(relative, client, cache = new Map()) {
  const filename = resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const compiled = { exports: {} };
  const require = (name) => {
    if (name.endsWith("/supabase")) return { supabase: client };
    if (name === "expo/fetch") return { fetch: async () => { throw new Error("Unexpected file access"); } };
    return load(resolve(dirname(filename), `${name}.ts`), client, cache);
  };
  const js = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(js, { exports: compiled.exports, module: compiled, require, Date, Set, Promise });
  cache.set(filename, compiled.exports); return compiled.exports;
}
const { OrganizationContextStore } = load("mobile/src/organizations/context.ts");
const tick = () => new Promise((done) => setImmediate(done));
function storeFixture(initial = []) {
  const values = new Map(), storage = { getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async (key) => { values.delete(key); } };
  let memberships = initial;
  return { values, storage, store: new OrganizationContextStore(storage, async () => memberships), set: (next) => { memberships = next; } };
}

test("zero organizations produces explicit empty context", async () => {
  const f = storeFixture(); const result = await f.store.refresh("u1");
  assert.equal(result.selected, null); assert.equal(result.memberships.length, 0);
});
test("one active organization is automatically selected with name and role", async () => {
  const f = storeFixture([org("a")]); const result = await f.store.refresh("u1");
  assert.equal(result.selected.organizationId, "a"); assert.equal(result.selected.name, "Organization a"); assert.equal(result.selected.role, "owner");
});
test("multiple organizations require explicit selection when there is no valid preference", async () => {
  const f = storeFixture([org("a"), org("b")]); assert.equal((await f.store.refresh("u1")).selected, null);
});
test("organization switching persists only the selected ID for the current user", async () => {
  const f = storeFixture([org("a"), org("b")]);
  await f.store.refresh("u1", "a"); assert.equal((await f.store.refresh("u1", "b")).selected.organizationId, "b");
  assert.equal(f.values.get("basoul:organization:u1"), "b");
});
test("invalid persisted selection is discarded rather than trusted", async () => {
  const f = storeFixture([org("a"), org("b")]); f.values.set("basoul:organization:u1", "outside");
  assert.equal((await f.store.refresh("u1")).selected, null); assert.equal(f.values.has("basoul:organization:u1"), false);
});
test("revoked membership clears selected context on revalidation", async () => {
  const f = storeFixture([org("a")]); await f.store.refresh("u1"); f.set([]);
  assert.equal((await f.store.refresh("u1")).selected, null);
});
test("logout clears persisted selection and invalidates request generation", async () => {
  const f = storeFixture([org("a")]); const previous = await f.store.refresh("u1"); f.store.clear(); await tick();
  assert.equal(f.store.isCurrent(previous.revision), false); assert.equal(f.values.size, 0);
});
test("account switching never restores another user's selection", async () => {
  const f = storeFixture([org("a")]); await f.store.refresh("u1"); f.set([org("b", "u2"), org("c", "u2")]);
  const result = await f.store.refresh("u2"); assert.equal(result.selected, null); assert.equal(f.values.has("basoul:organization:u1"), false);
});
test("session restoration revalidates membership and role before restoring selection", async () => {
  const f = storeFixture([org("a")]); await f.store.refresh("u1");
  const restored = new OrganizationContextStore(f.storage, async () => [org("a", "u1", "viewer")]);
  assert.equal((await restored.refresh("u1")).selected.role, "viewer");
});
test("cache generation is invalidated as soon as organization switch begins", async () => {
  const f = storeFixture([org("a"), org("b")]); const first = await f.store.refresh("u1", "a");
  const pending = f.store.refresh("u1", "b"); assert.equal(f.store.isCurrent(first.revision), false); await pending;
});
test("late membership responses cannot replace a newly selected organization", async () => {
  const f = storeFixture(); let release; let calls = 0;
  const store = new OrganizationContextStore(f.storage, async () => ++calls === 1 ? new Promise((done) => { release = done; }) : [org("a"), org("b")]);
  const old = store.refresh("u1", "a"); await tick(); const next = await store.refresh("u1", "b");
  release([org("a"), org("b")]); assert.equal(await old, null); assert.equal(next.selected.organizationId, "b");
});
test("explicit selection rejects inactive or cross-account organizations", async () => {
  const f = storeFixture([org("a")]); await assert.rejects(f.store.refresh("u1", "outside"), /no longer active/);
  f.set([org("a", "u2")]); await assert.rejects(f.store.refresh("u1"), /account mismatch/);
});

// Execute production query builders against an in-memory fixture only. No live
// credentials, remote writes, or replicated production authorization logic.
function clientFixture() {
  const calls = [], tables = {
    organization_memberships: [{ user_id: "u1", organization_id: "a", role: "owner", status: "active", organizations: { id: "a", name: "Organization a" } }],
    projects: [{ id: "pa", organization_id: "a", user_id: "colleague" }, { id: "pb", organization_id: "b", user_id: "u1" }],
    tasks: [{ id: "ta", organization_id: "a", user_id: "u1", status: "To Do", progress: 0 }, { id: "tb", organization_id: "b", user_id: "u1" }],
    notifications: [{ id: "na", organization_id: "a", user_id: "u1" }, { id: "other-recipient", organization_id: "a", user_id: "u2" }, { id: "nb", organization_id: "b", user_id: "u1" }],
    architectural_drawings: [], architectural_reviews: [], architectural_plan_elements: [], architectural_review_comments: [], architectural_review_findings: [],
  };
  let identity = "u1";
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: identity } }, error: null }) },
    from(table) {
      const operation = { table, filters: [], kind: "select" }; calls.push(operation);
      const query = {
        select() { return query; }, eq(key, value) { operation.filters.push([key, value]); return query; }, order() { return query; }, limit() { return query; }, in(key, values) { operation.filters.push([key, values]); return query; },
        insert(value) { operation.kind = "insert"; operation.value = value; return query; },
        update(value) { operation.kind = "update"; operation.value = value; return query; },
        then(done, fail) { return Promise.resolve(execute(false)).then(done, fail); },
        single() { return Promise.resolve(execute(true)); },
      };
      function execute(single) {
        const rows = (tables[table] ?? []).filter((row) => operation.filters.every(([key, value]) => key.includes(".") || (Array.isArray(value) ? value.includes(row[key]) : row[key] === value)));
        if (operation.kind === "insert") { tables[table].push({ id: "new", ...operation.value }); return { data: single ? { id: "new" } : null, error: null }; }
        if (single && rows.length !== 1) return { data: null, error: new Error("Scoped record not found") };
        if (operation.kind === "update") rows.forEach((row) => Object.assign(row, operation.value));
        return { data: single ? rows[0] : rows, error: null };
      }
      return query;
    },
  };
  return { client, calls, tables, setIdentity: (next) => { identity = next; }, services: load("mobile/src/services/workspace.ts", client) };
}
test("organization-scoped reads load only active tenant data, including colleague-owned projects", async () => {
  const f = clientFixture(); const data = await f.services.loadMobileWorkspace(org("a"));
  assert.deepEqual(Array.from(data.projects, (p) => p.id), ["pa"]); assert.deepEqual(Array.from(data.tasks, (t) => t.id), ["ta"]);
  for (const call of f.calls.filter((call) => call.table !== "organization_memberships")) assert.ok(call.filters.some(([key, value]) => key === "organization_id" && value === "a"));
});
test("recipient-private notification behavior remains user filtered within the selected tenant", async () => {
  const f = clientFixture(); const data = await f.services.loadMobileWorkspace(org("a"));
  assert.deepEqual(Array.from(data.notifications, (n) => n.id), ["na"]);
});
test("organization-scoped writes specify tenant and authenticated owner without default inference", async () => {
  const f = clientFixture(); await f.services.createMobileTask(org("a"), { title: "Fixture", project_id: "pa", priority: "Low", due_date: null });
  const inserted = f.tables.tasks.find((row) => row.id === "new"); assert.equal(inserted.organization_id, "a"); assert.equal(inserted.user_id, "u1");
});
test("cross-organization project references are rejected before a task write", async () => {
  const f = clientFixture(); await assert.rejects(f.services.createMobileTask(org("a"), { title: "Fixture", project_id: "pb" }), /Scoped record/);
  assert.ok(!f.calls.some((call) => call.kind === "insert"));
});
test("cross-organization task mutations cannot modify a stale record", async () => {
  const f = clientFixture(); await assert.rejects(f.services.advanceMobileTask(org("a"), { id: "tb", status: "To Do", progress: 0 }), /Scoped record/);
  assert.equal(f.tables.tasks.find((row) => row.id === "tb").status, undefined);
});
test("revoked membership and different authenticated user reject reads and writes before workspace I/O", async () => {
  const f = clientFixture(); f.tables.organization_memberships = [];
  await assert.rejects(f.services.loadMobileWorkspace(org("a")), /access denied/);
  f.setIdentity("u2"); await assert.rejects(f.services.createMobileTask(org("a"), {}), /account changed/);
  assert.ok(f.calls.every((call) => call.table === "organization_memberships"));
});
test("fresh role prevents viewer writes even if cached context claims owner", async () => {
  const f = clientFixture(); f.tables.organization_memberships[0].role = "viewer";
  await assert.rejects(f.services.createMobileTask(org("a"), {}), /access denied/);
  assert.ok(!f.calls.some((call) => call.kind === "insert"));
});

test("all Mobile mutation entry points reject foreign-tenant records or contexts", async () => {
  const f = clientFixture();
  for (const table of ["architectural_drawings", "architectural_review_findings", "architectural_plan_elements", "architectural_review_comments"]) f.tables[table].push({ id: "foreign", organization_id: "b", user_id: "u1" });
  const actions = [
    () => f.services.updateMobileReviewCommentStatus(org("a"), "foreign", "resolved"),
    () => f.services.updateMobilePlanElementStatus(org("a"), "foreign", "confirmed"),
    () => f.services.updateMobileFindingDecision(org("a"), { id: "foreign", review_id: "foreign-review" }, "accepted"),
    () => f.services.convertMobileFindingToTask(org("a"), "pa", { id: "foreign" }),
    () => f.services.uploadMobileDrawing(org("a"), "pb", "A", {}),
    () => f.services.retryMobileDrawingAnalysis(org("a"), "foreign"),
    () => f.services.markMobileNotificationRead(org("a"), "nb"),
    () => f.services.createMobileTask(org("b"), {}),
  ];
  for (const action of actions) await assert.rejects(action);
  assert.ok(!f.calls.some((call) => call.kind === "insert"));
  for (const table of ["architectural_drawings", "architectural_review_findings", "architectural_plan_elements", "architectural_review_comments"]) assert.equal(f.tables[table][0].status, undefined);
});

test("notification writes preserve recipient privacy even within an accessible organization", async () => {
  const f = clientFixture(); await assert.rejects(f.services.markMobileNotificationRead(org("a"), "other-recipient"), /Scoped record/);
  assert.equal(f.tables.notifications.find((row) => row.id === "other-recipient").is_read, undefined);
  await f.services.markMobileNotificationRead(org("a"), "na"); assert.equal(f.tables.notifications.find((row) => row.id === "na").is_read, true);
});
