import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
function load(path, require = () => ({})) {
  const compiled = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: compiled, exports: compiled.exports, require });
  return compiled.exports;
}
const contract = load('packages/shared-types/src/task-status-contract.ts');
const reasons = load('packages/shared-types/src/task-transition-reason.ts', () => contract);
test('all six supported edges retain optional reasons; cancellation and reopening remain unsupported', () => {
  let count = 0;
  for (const from of contract.TASK_STATUSES) for (const to of contract.TASK_STATUSES) {
    const result = reasons.taskTransitionReason(from, to, '');
    assert.equal(result.valid, contract.canTransitionTask(from, to));
    if (result.valid) { count++; assert.equal(result.reason, undefined); }
  }
  assert.equal(count, 6);
  assert.equal(reasons.taskTransitionReason('Done', 'In Progress', 'reopen').valid, false);
  assert.equal(reasons.taskTransitionReason('Review', 'Cancelled', 'cancel').valid, false);
  assert.equal(reasons.taskTransitionReason('Review', 'In Progress', '').valid, true);
});
test('reason boundary preserves Unicode, trims whitespace, accepts 1000 and rejects 1001 characters', () => {
  assert.equal(reasons.taskTransitionReason('Review', 'In Progress', '  يحتاج تعديل  ').reason, 'يحتاج تعديل');
  assert.equal(reasons.taskTransitionReason('To Do', 'In Progress', 'x'.repeat(1000)).valid, true);
  assert.equal(reasons.taskTransitionReason('To Do', 'In Progress', 'x'.repeat(1001)).valid, false);
});
function harness(platform, enabled = true, onConfirm = async () => true) {
  const states = [], refs = []; let slot = 0;
  const hooks = { useState: initial => { const index = slot++; if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }]; },
  useRef: initial => { const index = slot++; return refs[index] ??= { current: initial }; } };
  const jsx = (type, props) => ({ type, props });
  const component = load(platform === 'web' ? 'features/tasks/task-reason-confirmation.tsx' : 'mobile/src/features/tasks/TaskReasonConfirmation.tsx', name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { KeyboardAvoidingView:'KeyboardAvoidingView',ScrollView:'ScrollView',Platform:{OS:'android'},Modal: 'Modal', Text: 'Text', TextInput: 'TextInput', TouchableOpacity: 'TouchableOpacity', View: 'View' };
    if (name === '@basoul/yvl-adapter/native') return { basoulYvlNative: { colors: {}, space: {} } };
    return name.endsWith('task-status-contract') ? { ...contract, TASK_WORKFLOW_WRITES_ENABLED: enabled } : reasons;
  }).TaskReasonConfirmation;
  let cancels = 0;
  const render = () => { slot = 0; return component({ from: 'Review', to: 'In Progress', onConfirm, onCancel: () => { cancels++; } }); };
  function nodes(node) { if (!node || typeof node !== 'object') return [];
    return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]; }
  const find = predicate => nodes(render()).find(predicate);
  const setReason = text => { const input = find(n => n.type === 'textarea' || n.type === 'TextInput');
    if (platform === 'web') input.props.onChange({ target: { value: text } }); else input.props.onChangeText(text); };
  const button = text => find(n => (n.type === 'button' || n.type === 'TouchableOpacity') && JSON.stringify(n.props.children).includes(text));
  const press = node => (node.props.onClick ?? node.props.onPress)();
  return { render, setReason, button, press, cancels: () => cancels };
}
for (const platform of ['web', 'mobile']) {
  test(`${platform}: gate hides confirmation; cancel does not mutate`, () => {
    assert.equal(harness(platform, false).render(), null);
    let calls = 0; const h = harness(platform, true, async () => { calls++; return true; });
    h.press(h.button('Cancel')); assert.equal(h.cancels(), 1); assert.equal(calls, 0);
  });
  test(`${platform}: overlong reason blocks submission and feedback is bilingual`, () => {
    let calls = 0; const h = harness(platform, true, async () => { calls++; return true; });
    h.setReason('x'.repeat(1001)); const button = h.button('Confirm');
    assert.equal(button.props.disabled, true); h.press(button); assert.equal(calls, 0);
    const text = JSON.stringify(h.render()); assert.match(text, /يتجاوز/); assert.match(text, /exceeds/);
  });
  test(`${platform}: confirmation trims reason and blocks duplicate pending submission`, async () => {
    let calls = 0, received, release;
    const h = harness(platform, true, reason => { calls++; received = reason; return new Promise(resolve => { release = resolve; }); });
    h.setReason('  إعادة العمل  '); const button = h.button('Confirm');
    h.press(button); h.press(button); assert.equal(calls, 1); assert.equal(received, 'إعادة العمل');
    assert.equal(h.button('Confirm').props.disabled, true); release(false);
    await new Promise(resolve => setImmediate(resolve));
    assert.match(JSON.stringify(h.render()), /Save unconfirmed/); assert.equal(calls, 1);
  });
}
