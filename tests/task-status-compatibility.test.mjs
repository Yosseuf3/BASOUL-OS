import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
function load(relative, stateOverride) {
  const filename = resolve(root, relative), compiled = { exports: {} };
  const require = (name) => {
    if (name === "react") return { useState: (initial) => [stateOverride ?? initial, () => {}], useMemo: (fn) => fn() };
    if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === "react-native") return { Text: "Text", TextInput: "TextInput", View: "View", TouchableOpacity: "TouchableOpacity", StyleSheet: { create: (value) => value } };
    if (name === "@basoul/yvl-adapter/native") return { basoulYvlNative: { colors: {}, space: {}, radius: {} } };
    if (name.endsWith("/Screen")) return { Screen: "Screen" };
    const target = resolve(dirname(filename), `${name}.ts`);
    return load(existsSync(target) ? target : resolve(dirname(filename), `${name}.tsx`));
  };
  runInNewContext(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports: compiled.exports, module: compiled, require, Date, Intl });
  return compiled.exports;
}
const contract = load("packages/shared-types/src/task-status-contract.ts");
const task = (status, id) => ({ id, status, project_id: "project", title: `Android ${id}`, priority: "High", progress: 15, due_date: "2026-10-20" });
const data = { tasks: [task("Waiting", "waiting"), task("Review", "review"), task("unexpected", "unknown")], projects: [], notifications: [] };
test("read labels distinguish Waiting, Review and safe unknown values", () => {
  assert.notEqual(contract.taskStatusLabel("Waiting"), contract.taskStatusLabel("Review"));
  assert.equal(contract.taskStatusLabel(null), "حالة غير معروفة");
  assert.equal(contract.taskStatusClass({}), "unknown");
  assert.equal(contract.TASK_WORKFLOW_WRITES_ENABLED, false);
});
test("compatibility guards reject Review/new Waiting/unknown writes before activation", () => {
  for (const status of ["Review", "Waiting", "unexpected", null]) assert.throws(() => contract.assertCompatibilityTaskWrite(status));
  assert.doesNotThrow(() => contract.assertCompatibilityTaskWrite("Waiting", "Waiting"));
  assert.throws(() => contract.assertCompatibilityTaskWrite("To Do", "unexpected"), /UNKNOWN/);
});
test("Android task component renders Waiting and Review distinctly without next-stage actions", () => {
  const { TasksScreen } = load("mobile/src/features/tasks/TasksScreen.tsx", "All");
  const rendered = JSON.stringify(TasksScreen({ tasks: data.tasks, projects: [], onBack() {}, onCreate() {}, onAdvance() {} }));
  for (const status of ["Waiting", "Review", "unexpected"]) assert.ok(rendered.includes(contract.taskStatusLabel(status)));
  assert.ok(!rendered.includes("بدء التنفيذ"));
});
test("Android search and timeline retain Waiting/Review/unknown records safely", () => {
  const search = load("mobile/src/features/search/GlobalSearchScreen.tsx", "Android").GlobalSearchScreen;
  const timeline = load("mobile/src/features/timeline/TimelineScreen.tsx").TimelineScreen;
  for (const screen of [search, timeline]) {
    const rendered = JSON.stringify(screen({ data, onBack() {} }));
    for (const item of data.tasks) assert.ok(rendered.includes(item.title));
    assert.ok(rendered.includes(contract.taskStatusLabel("Waiting"))); assert.ok(rendered.includes(contract.taskStatusLabel("Review")));
  }
});
test("Dashboard keeps Waiting open rather than accepted/completed", () => {
  const snapshot = load("mobile/src/decision/executive.ts").buildExecutiveSnapshot(data);
  assert.equal(snapshot.openTasks, 3);
});
test("Web readers use shared labels and all status columns, with unknown grouping", () => {
  const web = readFileSync(resolve(root, "app/page.tsx"), "utf8");
  assert.match(web, /\["All", \.\.\.TASK_STATUSES, "Unknown"\]/);
  assert.match(web, /!isTaskStatus\(t.status\)/); assert.match(web, /taskStatusLabel\(task.status\)/);
  assert.match(web, /assertCompatibilityTaskWrite\(input.status, current\?\.status\)/);
});
test("Web server blocks unsupported statuses independently of the UI", () => {
  const server = readFileSync(resolve(root, "app/api/workspace/[resource]/route.ts"), "utf8");
  assert.match(server, /assertCompatibilityTaskWrite\("status" in body \? body.status : "To Do"\)/);
  assert.match(server, /assertCompatibilityTaskWrite\(body.status, previous.data.status\)/);
  assert.match(server, /eq\("organization_id", resolved.auth.organizationId\)/);
  assert.match(server, /eq\("user_id", resolved.auth.user.id\)/);
});
test("prepared SQL is isolated from migrations and uses invoker authorization and CAS", () => {
  const sql = readFileSync(resolve(root, "docs/database/proposed-task-transition-enforcement.sql"), "utf8");
  const executable = sql.replace(/--[^\n]*/g, "");
  assert.match(executable, /SECURITY INVOKER/); assert.ok(!executable.includes("SECURITY DEFINER"));
  assert.match(sql, /FOR UPDATE/); assert.match(sql, /p_expected_updated_at/);
  assert.match(sql, /user_id=auth.uid\(\)/); assert.match(sql, /private.has_permission/);
  assert.match(sql, /TASK_TRANSITION_CONFLICT/); assert.match(sql, /NEW.progress IS DISTINCT FROM OLD.progress/);
});
