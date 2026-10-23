import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateMobileAudit, runMobileAudit } from '../scripts/audit-mobile-production.mjs';

const report = (high = 0, critical = 0, vulnerabilities = {}) => ({ metadata: { vulnerabilities: { high, critical } }, vulnerabilities });

test('mobile gate permits a clean patched graph without calendar/version exceptions', () => {
  assert.equal(evaluateMobileAudit(report(), 0).ok, true);
  assert.equal(evaluateMobileAudit(report(0, 0, { example: { severity: 'moderate' } }), 0).ok, true);
});
test('mobile gate blocks high/critical findings even if npm reports success', () => {
  for (const status of [0, 1]) {
    assert.equal(evaluateMobileAudit(report(1), status).ok, false);
    assert.equal(evaluateMobileAudit(report(0, 1), status).ok, false);
    assert.equal(evaluateMobileAudit(report(0, 0, { braces: { severity: 'high' } }), status).ok, false);
  }
});
test('mobile gate fails closed on malformed reports and unsuccessful npm', () => {
  for (const value of [null, {}, { metadata: { vulnerabilities: {} }, vulnerabilities: {} },
    report(-1), report(0.5), { ...report(), error: { code: 'ENOAUDIT' } },
    report(0, 0, []), report(0, 0, { unknown: { severity: 'unknown' } })]) {
    assert.equal(evaluateMobileAudit(value, 0).ok, false);
  }
  assert.equal(evaluateMobileAudit(report(), 1).ok, false);
  assert.equal(evaluateMobileAudit(report(), null).ok, false);
});
test('actual audit runner fixes Mobile scope and handles process/JSON failures', () => {
  let observed;
  const result = runMobileAudit((command, args, options) => {
    observed = { command, args, options };
    return { status: 0, stdout: JSON.stringify(report()) };
  });
  assert.equal(result.ok, true);
  assert.equal(observed.command, process.execPath);
  assert.deepEqual(observed.args.slice(1), ['audit', '--omit=dev', '--audit-level=high', '--json']);
  assert.match(observed.options.cwd.replaceAll('\\', '/'), /\/mobile$/);
  assert.equal(observed.options.shell, false);
  for (const response of [{ error: new Error('offline') }, { signal: 'SIGTERM' }, { status: 0, stdout: 'invalid' }]) {
    assert.equal(runMobileAudit(() => response).ok, false);
  }
});
test('Android gate precedes Expo access; Web/Mobile CI checks stay independent and strict', () => {
  const android = readFileSync(new URL('../.github/workflows/basoul-android-preview-build.yml', import.meta.url), 'utf8');
  assert.ok(android.includes('run: npm run audit:production'));
  assert.ok(android.indexOf('run: npm run audit:production') < android.indexOf('- name: Verify Expo authentication'));
  assert.match(android, /workflow_dispatch:/);
  const quality = readFileSync(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
  assert.match(quality, /npm audit --omit=dev --audit-level=high/);
  assert.match(quality, /  web:/);
  assert.match(quality, /  mobile:/);
  assert.match(quality, /npm run audit:production/);
  assert.doesNotMatch(quality, /continue-on-error/);
});
