import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const compiledModule = { exports: {} };
const source = readFileSync(new URL("../packages/shared-types/src/task-status-contract.ts", import.meta.url), "utf8");
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
  { exports: compiledModule.exports, module: compiledModule });
const { TASK_STATUSES, TASK_STATUS_MEANING, canTransitionTask, isTaskStatus, prepareTaskTransition } = compiledModule.exports;
// Explicit approved graph: no permissive mock backend and no live writes.
const allowed = new Set(["To Do|In Progress", "In Progress|Waiting", "Waiting|In Progress",
  "In Progress|Review", "Review|In Progress", "Review|Done"]);
const task = { id: "test-task", organizationId: "test-org", creatorId: "test-user", status: "In Progress", progress: 15, updatedAt: "2026-10-11T00:00:00Z" };
const actor = { userId: "test-user", organizationId: "test-org", membershipActive: true, canUpdate: true };
const expected = (record) => ({ status: record.status, updatedAt: record.updatedAt });

test("canonical contract has precisely the five approved distinct values", () => {
  assert.deepEqual(Array.from(TASK_STATUSES), ["To Do", "In Progress", "Waiting", "Review", "Done"]);
  assert.notEqual(TASK_STATUS_MEANING.Waiting, TASK_STATUS_MEANING.Review);
});
for (const from of ["To Do", "In Progress", "Waiting", "Review", "Done"]) {
  for (const to of ["To Do", "In Progress", "Waiting", "Review", "Done"]) {
    test(`transition ${from} -> ${to}: ${allowed.has(`${from}|${to}`) ? "allowed" : "rejected"}`, () => {
      assert.equal(canTransitionTask(from, to), allowed.has(`${from}|${to}`));
      const record = { ...task, status: from };
      if (allowed.has(`${from}|${to}`)) assert.equal(prepareTaskTransition(record, actor, expected(record), to).status, to);
      else assert.throws(() => prepareTaskTransition(record, actor, expected(record), to), /REJECTED/);
    });
  }
}
test("unknown values fail closed without coercion or silent mapping", () => {
  for (const value of [null, undefined, "waiting", "Blocked", "Review ", 1]) {
    assert.equal(isTaskStatus(value), false); assert.equal(canTransitionTask(value, "Done"), false);
    assert.throws(() => prepareTaskTransition(task, actor, expected(task), value), /UNKNOWN/);
  }
});
test("every valid transition preserves actual progress, including Waiting and rework", () => {
  for (const edge of allowed) for (const progress of [0, 15, 62, 80, 100]) {
    const [status, target] = edge.split("|"); const record = { ...task, status, progress };
    assert.equal(prepareTaskTransition(record, actor, expected(record), target).progress, progress);
  }
});
test("existing four-state records and percentages are readable without conversion", () => {
  for (const status of ["To Do", "In Progress", "Waiting", "Done"]) {
    const record = Object.freeze({ ...task, status });
    assert.equal(isTaskStatus(record.status), true); assert.equal(record.progress, 15);
  }
});
test("tenant permission and creator restrictions cannot be overridden by owner authority", () => {
  for (const change of [{ userId: "other-owner" }, { organizationId: "other-org" }, { membershipActive: false }, { canUpdate: false }, { userId: "" }]) {
    assert.throws(() => prepareTaskTransition(task, { ...actor, ...change }, expected(task), "Review"), /FORBIDDEN/);
  }
});
test("self-acceptance needs the same verified permission and creator ownership", () => {
  const record = { ...task, status: "Review", progress: 100 };
  assert.equal(prepareTaskTransition(record, actor, expected(record), "Done").progress, 100);
  assert.throws(() => prepareTaskTransition(record, { ...actor, canUpdate: false }, expected(record), "Done"), /FORBIDDEN/);
});
test("stale status or revision rejects a concurrent transition plan", () => {
  assert.throws(() => prepareTaskTransition(task, actor, { ...expected(task), status: "To Do" }, "Review"), /CONFLICT/);
  assert.throws(() => prepareTaskTransition(task, actor, { ...expected(task), updatedAt: "older" }, "Review"), /CONFLICT/);
});
test("preparation is pure and does not mutate existing task or actor", () => {
  const record = Object.freeze({ ...task }), identity = Object.freeze({ ...actor });
  prepareTaskTransition(record, identity, expected(record), "Waiting");
  assert.equal(record.status, "In Progress"); assert.equal(record.progress, 15);
});
test("invalid recorded percentages are rejected, never silently normalized", () => {
  for (const progress of [-1, 101, NaN, 12.5]) {
    const record = { ...task, progress };
    assert.throws(() => prepareTaskTransition(record, actor, expected(record), "Review"), /PROGRESS_INVALID/);
  }
});
