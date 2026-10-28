import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const clean = () => ({ vulnerabilities: {}, metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 } } });

function runAudit({ report = clean(), exit = 0, raw, mutate = () => {} } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'basoul-audit-policy-'));
  try {
    mkdirSync(join(directory, 'scripts'));
    mkdirSync(join(directory, 'mobile', 'src'), { recursive: true });
    writeFileSync(join(directory, 'scripts', 'audit-mobile-production.mjs'), readFileSync('scripts/audit-mobile-production.mjs'));
    for (const file of ['package.json', 'package-lock.json', 'app.json']) {
      writeFileSync(join(directory, 'mobile', file), readFileSync(join('mobile', file)));
    }
    writeFileSync(join(directory, 'mobile', 'App.tsx'), 'export default function App() {}');
    mutate(directory);
    const mock = join(directory, 'mock-npm.cjs');
    writeFileSync(mock, `process.stdout.write(${JSON.stringify(raw ?? JSON.stringify(report))}); process.exitCode = ${exit};`);
    return spawnSync(process.execPath, [join(directory, 'scripts', 'audit-mobile-production.mjs')], {
      encoding: 'utf8', env: { ...process.env, npm_execpath: mock },
    });
  } finally {
    assert.equal(dirname(realpathSync(directory)), realpathSync(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
}

test('clean scanner evidence passes without an exception', () => {
  const result = runAudit();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No security exceptions/);
});

for (const [name, id] of [['node-forge', 'GHSA-86w9-cpqp-85rv'], ['braces', 'GHSA-vfj7-8cjw-p6xm'], ['new-package', 'GHSA-new-advisory']]) {
  test(`rejects ${name} HIGH finding, including previously excepted advisories`, () => {
    const report = clean();
    report.metadata.vulnerabilities.high = 1;
    report.vulnerabilities[name] = { severity: 'high', via: [{ url: `https://github.com/advisories/${id}`, severity: 'high' }] };
    assert.notEqual(runAudit({ report, exit: 1 }).status, 0);
    assert.notEqual(runAudit({ report, exit: 0 }).status, 0, 'scanner exit 0 cannot conceal a reported finding');
  });
}

test('missing, malformed, incomplete and failed scanner evidence never passes', () => {
  for (const options of [{ raw: '' }, { raw: 'not json' }, { report: {} },
    { report: { metadata: { vulnerabilities: { high: 0, critical: 0 } } } },
    { exit: 1 }, { report: { error: 'network failure' } }]) {
    assert.notEqual(runAudit(options).status, 0);
  }
});

test('unreviewed vulnerable forge lockfile is rejected before audit', () => {
  const result = runAudit({ mutate(directory) {
    const path = join(directory, 'mobile', 'package-lock.json');
    const lock = JSON.parse(readFileSync(path));
    lock.packages['node_modules/node-forge'].version = '1.4.0';
    writeFileSync(path, JSON.stringify(lock));
  } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unreviewed mobile dependency/);
});

test('runtime tooling import is rejected despite a clean audit', () => {
  const result = runAudit({ mutate(directory) {
    writeFileSync(join(directory, 'mobile', 'src', 'unsafe.ts'), 'import forge from "node-forge";');
  } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Build tooling referenced/);
});

test('code-signing and application identity boundaries stay fail closed', () => {
  for (const mutation of [app => { app.android.package = 'other.product'; }, app => { app.updates = { url: 'https://example.invalid' }; }]) {
    const result = runAudit({ mutate(directory) {
      const path = join(directory, 'mobile', 'app.json');
      const config = JSON.parse(readFileSync(path));
      mutation(config.expo);
      writeFileSync(path, JSON.stringify(config));
    } });
    assert.notEqual(result.status, 0);
  }
});
