import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(path, require = () => ({}), globals = {}) {
  const compiled = { exports: {} };
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { module: compiled, exports: compiled.exports, require, ...globals });
  return compiled.exports;
}
const contract = load('packages/shared-types/src/task-status-contract.ts');
const shared = load('packages/shared-types/src/task-transition-client.ts', () => contract);
const input = { taskId: 'task', organizationId: 'org', expectedStatus: 'Waiting',
  expectedUpdatedAt: '2026-10-19T10:00:00.123456+00:00', targetStatus: 'In Progress' };
const confirmed = { id: 'task', organization_id: 'org', status: 'In Progress',
  updated_at: '2026-10-19T10:00:00.123457+00:00', progress: 15 };
const malformed = [null, undefined, [], {}, { ...confirmed, id: 'other' },
  { ...confirmed, organization_id: 'other' }, { ...confirmed, status: 'Waiting' },
  { ...confirmed, updated_at: input.expectedUpdatedAt }, { ...confirmed, updated_at: '' },
  { ...confirmed, updated_at: 'not-a-cas-token' },
  { ...confirmed, progress: 101 }, { ...confirmed, progress: 1.5 }];

test('confirmation keeps microseconds and progress; missing, stale and unrelated rows cannot confirm success', () => {
  const result = shared.confirmedTaskTransition(confirmed, input);
  assert.equal(result.updated_at, confirmed.updated_at);
  assert.equal(result.progress, 15);
  for (const value of malformed) assert.equal(shared.confirmedTaskTransition(value, input), null);
});

function webHarness(response, enabled = true) {
  let calls = 0;
  const web = load('lib/data/task-transition-client.ts', name => name.endsWith('task-status-contract')
    ? { ...contract, TASK_WORKFLOW_WRITES_ENABLED: enabled } : shared,
  { fetch: async () => { calls++; return response(); } });
  return { run: request => web.transitionWebTask({ access_token: 'synthetic' }, request ?? input), calls: () => calls };
}
test('Web confirms only the requested task and never retries ambiguous responses', async () => {
  for (const data of malformed) {
    const h = webHarness(() => ({ ok: true, json: async () => ({ data }) }));
    const result = await h.run();
    assert.equal(result.ok, false); assert.equal(result.code, 'TASK_TRANSITION_UNCONFIRMED');
    assert.equal(h.calls(), 1);
  }
  const h = webHarness(() => ({ ok: true, json: async () => ({ data: confirmed }) }));
  assert.equal((await h.run()).ok, true); assert.equal(h.calls(), 1);
});
test('Web rejects invalid local input before I/O and retains conflict classification', async () => {
  const invalid = webHarness(() => { throw new Error('must not run'); });
  assert.equal((await invalid.run({ ...input, targetStatus: 'Done' })).code, 'TASK_TRANSITION_REJECTED');
  assert.equal(invalid.calls(), 0);
  const conflict = webHarness(() => ({ ok: false, json: async () => ({ code: 'TASK_TRANSITION_CONFLICT', error: 'private detail' }) }));
  const result = await conflict.run();
  assert.equal(result.code, 'TASK_TRANSITION_CONFLICT'); assert.ok(!result.message.includes('private'));
  assert.equal(conflict.calls(), 1);
});
test('Web network or unreadable response leaves outcome unconfirmed without a retry', async () => {
  for (const response of [() => { throw new Error('private transport detail'); },
    () => ({ ok: true, json: async () => { throw new Error('invalid json'); } })]) {
    const h = webHarness(response); assert.equal((await h.run()).code, 'TASK_TRANSITION_UNCONFIRMED');
    assert.equal(h.calls(), 1);
  }
});
function mobileHarness(data, enabled = true, error = null) {
  let validations = 0, calls = 0;
  const mobile = load('mobile/src/services/task-transitions.ts', name => {
    if (name.endsWith('/supabase')) return { supabase: { rpc: async () => { calls++; return { data, error }; } } };
    if (name.endsWith('/organizations')) return { validateOrganizationContext: async () => { validations++; } };
    return name.endsWith('task-status-contract') ? { ...contract, TASK_WORKFLOW_WRITES_ENABLED: enabled } : shared;
  });
  return { run: () => mobile.transitionMobileTask({ organizationId: 'org' },
    { id: 'task', status: input.expectedStatus, updated_at: input.expectedUpdatedAt }, input.targetStatus),
  calls: () => calls, validations: () => validations };
}
test('Mobile validates organization then requires confirmation, preserving uncertain outcomes for UI', async () => {
  const operation = load('mobile/src/organizations/operation.ts');
  for (const data of malformed) {
    const h = mobileHarness(data);
    await assert.rejects(h.run, cause => {
      assert.equal(cause.code, 'TASK_TRANSITION_UNCONFIRMED');
      assert.equal(operation.losesOrganizationAccess(cause), false);
      assert.match(operation.safeOperationError(cause).message, /حدّث البيانات/);
      return true;
    });
    assert.equal(h.validations(), 1); assert.equal(h.calls(), 1);
  }
  const h = mobileHarness(confirmed); await h.run(); assert.equal(h.calls(), 1);
  const conflict = mobileHarness(null, true, { code: 'PT409' });
  await assert.rejects(conflict.run, error => error.code === 'PT409'); assert.equal(conflict.calls(), 1);
});
test('both production workflow gates remain off before authorization or transport', async () => {
  assert.equal(contract.TASK_WORKFLOW_WRITES_ENABLED, false);
  const web = webHarness(() => { throw new Error('must not run'); }, false);
  assert.equal((await web.run()).code, 'TASK_UPDATE_REQUIRED'); assert.equal(web.calls(), 0);
  const mobile = mobileHarness(null, false);
  await assert.rejects(mobile.run, error => error.code === 'TASK_UPDATE_REQUIRED');
  assert.equal(mobile.validations(), 0); assert.equal(mobile.calls(), 0);
});
