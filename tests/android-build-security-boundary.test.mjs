import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('Android preview workflow enforces strict audit before credential use and build',()=>{
  const workflow=readFileSync('.github/workflows/basoul-android-preview-build.yml','utf8');
  const install=workflow.indexOf('run: npm ci');
  const audit=workflow.indexOf('run: npm run audit:production');
  const identity=workflow.indexOf('npx eas-cli@latest whoami');
  const build=workflow.indexOf('npx eas-cli@latest build');
  assert.ok(install>=0&&audit>install&&identity>audit&&build>identity);
  assert.doesNotMatch(workflow,/continue-on-error/);
});
