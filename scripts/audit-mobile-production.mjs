import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptPath = fileURLToPath(import.meta.url);
const mobileRoot = resolve(dirname(scriptPath), '../mobile');

// No advisory, version or calendar exceptions. A patched clean graph can pass;
// an affected graph stays blocked regardless of runtime classification.
export function evaluateMobileAudit(report, status) {
  const counts = report?.metadata?.vulnerabilities;
  if (!counts || !['high', 'critical'].every(key => Number.isInteger(counts[key]) && counts[key] >= 0)
    || !report.vulnerabilities || typeof report.vulnerabilities !== 'object'
    || Array.isArray(report.vulnerabilities) || report.error) {
    return { ok: false, message: 'Mobile audit failed: incomplete or invalid npm audit report.', findings: [] };
  }
  const entries = Object.entries(report.vulnerabilities);
  if (entries.some(([, value]) => !value || !['info', 'low', 'moderate', 'high', 'critical'].includes(value.severity))) {
    return { ok: false, message: 'Mobile audit failed: invalid vulnerability severity.', findings: [] };
  }
  const findings = entries.filter(([, value]) => ['high', 'critical'].includes(value.severity))
    .map(([name, value]) => `${name}: ${value.severity} (${Array.isArray(value.nodes) ? value.nodes.join(', ') : ''})`);
  if (counts.high || counts.critical || findings.length) {
    return { ok: false, message: `Mobile security BLOCKED: ${counts.high} HIGH, ${counts.critical} CRITICAL; no exceptions permitted.`, findings };
  }
  if (status !== 0) return { ok: false, message: 'Mobile audit failed: npm did not complete successfully.', findings: [] };
  return { ok: true, message: 'Mobile production dependency audit: 0 HIGH/CRITICAL vulnerabilities.', findings: [] };
}

export function runMobileAudit(spawn = spawnSync) {
  const npmCli = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (!existsSync(npmCli)) return { ok: false, message: 'Mobile audit failed: npm CLI unavailable; run through npm.', findings: [] };
  const audit = spawn(process.execPath, [npmCli, 'audit', '--omit=dev', '--audit-level=high', '--json'], {
    cwd: mobileRoot, encoding: 'utf8', shell: false, timeout: 120000, maxBuffer: 8 * 1024 * 1024,
  });
  if (audit.error || audit.signal) return { ok: false, message: 'Mobile audit failed: npm process error or timeout.', findings: [] };
  let report;
  try { report = JSON.parse(audit.stdout); }
  catch { return { ok: false, message: 'Mobile audit failed: npm returned invalid JSON.', findings: [] }; }
  return evaluateMobileAudit(report, audit.status);
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const result = runMobileAudit();
  (result.ok ? console.log : console.error)(result.message);
  for (const finding of result.findings) console.error(finding);
  process.exitCode = result.ok ? 0 : 1;
}
