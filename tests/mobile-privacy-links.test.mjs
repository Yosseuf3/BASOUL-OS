import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function mount(openURL) {
  const state = [null, null]; let index = 0;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  runInNewContext(ts.transpileModule(readFileSync('mobile/src/components/PrivacyLinks.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(name) {
    if (name === 'react') return { useState() { const slot = index++; return [state[slot], value => { state[slot] = value; }]; } };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { Linking: { openURL }, StyleSheet: { create: v => v }, Text: 'Text', View: 'View' };
    if (name === '@basoul/yvl-adapter/native') return { basoulYvlNative: { space: { sm: 8, md: 16 }, colors: {} } };
    if (name === './yvl-primitives') return { YvlButton: 'Button' };
    throw Error(`Unexpected dependency: ${name}`);
  } });
  return { state, render() { index = 0; return exports.PrivacyLinks(); } };
}

test('both compliance actions open exact public HTTPS URLs without identity or session parameters', async () => {
  const calls = []; const app = mount(async url => calls.push(url));
  const buttons = app.render().props.children[0];
  for (const button of buttons) {
    assert.equal(button.props.accessibilityRole, 'link');
    await button.props.onPress();
    // onPress deliberately returns void; openURL resolves on the microtask queue.
    await Promise.resolve();
  }
  assert.deepEqual(calls, ['https://os.basoul.net/privacy', 'https://os.basoul.net/account-deletion']);
  assert.equal(app.state[0], null);
});

test('failed OS URL handling gives bilingual feedback and allows retry', async () => {
  let fail = true;
  const app = mount(async () => { if (fail) throw Error('OS cannot open URL'); });
  app.render().props.children[0][0].props.onPress();
  await new Promise(setImmediate);
  assert.match(app.state[1], /Unable to open/);
  assert.match(app.state[1], /تعذر/);
  assert.equal(app.state[0], null);
  fail = false;
  app.render().props.children[0][0].props.onPress();
  await new Promise(setImmediate);
  assert.equal(app.state[1], null);
});

test('while an OS link operation is pending both actions prevent duplicate submissions', async () => {
  let complete;
  const app = mount(() => new Promise(resolve => { complete = resolve; }));
  app.render().props.children[0][0].props.onPress();
  assert.ok(app.render().props.children[0].every(button => button.props.disabled));
  complete(); await new Promise(setImmediate);
  assert.ok(app.render().props.children[0].every(button => !button.props.disabled));
});
