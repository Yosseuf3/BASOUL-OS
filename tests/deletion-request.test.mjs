import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const exports = {};
runInNewContext(ts.transpileModule(readFileSync('lib/privacy/deletion-request.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, encodeURIComponent, Error });
const build = exports.buildDeletionRequestEmail;

test('isolated synthetic identity produces only a support email draft, not an authenticated action', () => {
  const url = new URL(build(' isolated-reviewer@example.invalid ', 'account-and-personal-data'));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'yosseuf.radwan@gmail.com');
  assert.match(url.searchParams.get('body'), /isolated-reviewer@example.invalid/);
  assert.match(url.searchParams.get('body'), /verified separately/);
  assert.equal(url.searchParams.has('cc'), false);
  assert.equal(url.searchParams.has('bcc'), false);
});

test('header injection and invalid/oversize addresses fail closed', () => {
  for (const email of ['', 'not-email', 'a@b.invalid\r\nBcc:other@example.invalid', 'a'.repeat(255)+'@example.invalid']) {
    assert.throws(() => build(email, 'account-and-personal-data'));
  }
});

test('request scope is constrained, encoded and never silently upgraded', () => {
  assert.throws(() => build('a@example.invalid', 'delete-all-organizations'));
  const url = new URL(build('test+privacy@example.invalid', 'specific-personal-data'));
  assert.match(url.searchParams.get('body'), /Scope.*specific-personal-data/);
  assert.match(url.searchParams.get('body'), /test\+privacy@example.invalid/);
});

test('actual form submission prepares a draft and invalid input cannot leave a success link', () => {
  const compiled=ts.transpileModule(readFileSync('app/account-deletion/DeletionRequestForm.tsx','utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
  }).outputText;
  for (const [email,valid] of [['isolated-reviewer@example.invalid',true],['invalid',false]]) {
    const state=[email,'account-and-personal-data',null,'stale-link']; let hook=0;
    const output={};
    runInNewContext(compiled,{exports:output,Error,require:name=>{
      if(name==='react')return{useState:()=>{const index=hook++;return[state[index],value=>{state[index]=value;}];}};
      if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
      if(name==='@/lib/privacy/deletion-request')return exports;
      throw Error('Unexpected form dependency');
    },fetch:()=>{throw Error('Form must not send a request');}});
    let prevented=false;
    output.DeletionRequestForm().props.onSubmit({preventDefault(){prevented=true;}});
    assert.equal(prevented,true);
    if(valid){assert.match(state[3],/^mailto:yosseuf\.radwan@gmail\.com\?/);assert.equal(state[2],null);}
    else {assert.equal(state[3],null);assert.match(state[2],/valid account email/);}
  }
});

test('request page remains explicitly public, distinguishes requests from erasure and never promises the internal target', () => {
  const gate=readFileSync('app/template.tsx','utf8');
  const page=readFileSync('app/account-deletion/page.tsx','utf8');
  const form=readFileSync('app/account-deletion/DeletionRequestForm.tsx','utf8');
  assert.match(gate, /"\/account-deletion"/);
  assert.match(page, /DeletionRequestForm/);
  assert.match(form, /does not send or register/);
  assert.doesNotMatch(page+form, /30 days|30 يوم|auth\.admin|deleteUser|localStorage/);
});
