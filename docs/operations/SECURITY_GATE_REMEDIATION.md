# Security gate remediation — 2026-10-22

Branch: `codex/repository-reconciliation`. Committed HEAD remains `4eddecd4134e407fc6f697f1532465caf0e7095d`, with the existing accumulated work preserved. This supplements the historical reconciliation report rather than replacing its recorded results.

## Exact cause and mandatory controls

The original failing command was `npm --prefix mobile run audit:production`, also run as `npm run audit:production` from mobile in both `quality.yml` and the mobile runtime validation workflow. Its script rejected an exception expiring 2026-10-16 **before running npm audit**, then required an obsolete Expo57.0.27 topology. Consequently even a future clean patched graph could never pass that script. The actual installed graph is independently vulnerable; fixing the stale script does not clear its findings.

Repository `quality:all` runs functional/build checks and Doctor, but does not run Mobile's production security command. Its success was never proof of the separate security gate passing.

Web and Mobile already have independent CI jobs. Read-only GitHub verification found an active main ruleset, `Protect Main Branch` (19746250), requiring both `Web quality` and `Mobile quality` with strict status checks. The legacy branch-protection endpoint alone returned404; it did not establish that main was unprotected. No ruleset, required context or workflow trigger was changed. Moving the failing Mobile audit into a non-required job, adding continue-on-error or disabling Mobile checks would bypass a required control; none is done.

## Remediation applied

- Replaced expired advisory/version/date exemptions with a strict Mobile audit of the actual production dependency graph. Zero HIGH/CRITICAL may pass; any HIGH/CRITICAL, malformed report, npm failure, process timeout or unavailable CLI fails closed. Missing/contradictory metadata cannot turn a finding green. The target directory is explicitly mobile even when invoked from repository root.
- Removed the exception machinery entirely; no expiry was extended and no affected package is filtered out. A future supported clean graph can pass without modifying policy dates or topology allowlists.
- Added the same strict audit to the manual Android preview build workflow after clean installation and before the first Expo authentication command. That workflow previously lacked an explicit production security step. It remains manual-only/main-only; no EAS build or workflow was dispatched.
- Preserved Web production audit, lint/tests/TypeScript/build/budgets and existing Mobile CI checks. Web/Android release decisions remain separate, while both existing integration checks remain mandatory.

No application, SQL, dependency manifest, lockfile, tenant permission or task-workflow code was changed in this remediation. No package update was applied merely to hide an audit result. CI guidance was reviewed; no Vercel configuration or remote service was modified.

## Supported fix investigation and exposure

| Scope | Actual gate / result | Dependency path and disposition |
| --- | --- | --- |
| Web production | `npm audit --omit=dev --audit-level=high`: exit0, zero findings | Production runtime graph remains clean; prior final build traces also excluded affected tooling |
| Web tooling | Full `npm audit --json`: exit1, five HIGH package entries | eslint-config-next16.3.3 → @next/eslint-plugin-next16.2.12 → fast-glob3.3.1 → micromatch4.0.8 → braces3.0.3. ESLint configuration/root globs are the observed consumer, not a product upload endpoint |
| Android | Corrected `npm --prefix mobile run audit:production`: exit1, 15 HIGH / zero CRITICAL | expo57.0.31 → @expo/cli57.0.32 → node-forge1.4.0, also via @expo/code-signing-certificates0.0.6 |
| Android Metro | Included in the same blocked audit | expo57.0.31 → @expo/metro56.0.2 → metro-file-map0.84.5 → micromatch4.0.8 → braces3.0.3 |

Five/15 package entries include transitive parents, not five/15 independent root vulnerabilities. Build-tool reachability classification does not exempt them or certify an Android binary.

Registry verification returned braces3.0.3 and node-forge1.4.0 as the current releases. Current @next/eslint-plugin-next16.4.2 still depends on fast-glob3.3.1. The primary advisories list no patched release: [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). A forced eslint-config-next14 downgrade, unreviewed fork, version-only override or Expo major migration is not a supported compatible security fix. A local patch without an upstream-supported release and independent validation is not presented as resolving the advisory.

## Verification

- Full repository regression: **364/364 passed**, including five new gate tests, no failures. Existing tenant-isolation, organization and task-workflow tests remain included.
- New tests cover clean patched reports, HIGH/CRITICAL even with npm exit0, malformed/error reports, actual runner Mobile cwd/arguments, npm process/JSON failures, and Android gate placement with unchanged independent Web/Mobile CI checks.
- Lint: zero errors, 19 existing warnings.
- Fresh actual Mobile gate: **BLOCKED, exit1**, with all 15 HIGH package paths printed. This is the expected security denial, not a claimed security PASS.
- Fresh Web production audit: PASS, exit0; full tooling audit: BLOCKED, exit1. Raw Mobile audit independently confirms the same 15 HIGH.
- Web and Mobile TypeScript: PASS, exit0, `.git/basoul-local/security-gate-types.log`.
- The previous clean-install production build, bundle budgets, Doctor21/21, local HTTP/Storage/browser/native and database evidence remains in the reconciliation report. Those expensive suites are not re-run for a gate-only change, and are not claimed as newly executed here. Application/SQL/dependency files remain unchanged.

Logs and JSON are ignored under `.git/basoul-local/security-gate-*`. Existing recoverable backups and error.log are preserved. This execution changes only `scripts/audit-mobile-production.mjs`, `.github/workflows/basoul-android-preview-build.yml`, `tests/mobile-security-gate.test.mjs` and this report.

## Git and release outcome

**Mandatory integration gates remain blocked. No staging, commit, push or new PR.** Main still requires Mobile quality; a corrected fail-closed gate now exposes unresolved advisories directly. Neither independent Web release readiness nor successful functional tests permits bypassing that control. No deployment, EAS build, remote migration or workflow activation occurred.

Safe next actions: consume supported upstream fixes when published (including parent graph updates), verify clean audits and affected regressions, then review/stage the complete accumulated project manifest excluding logs/local files and execute the already authorized integration commit, non-force push and PR. A separately designed replacement for affected tooling is possible engineering work, but must preserve platform support and all current security checks; it is not an immediate safe dependency swap or grounds to claim readiness. Do not weaken the ruleset, suppress findings or renew expired exceptions to complete integration.

Final preservation check: every pre-existing dirty/untracked file matches its starting SHA256, including error.log and previous reports; the real index remains empty and HEAD unchanged. Git diff whitespace check passes. The original audit script is retained in ignored .git/basoul-local/audit-mobile-production-before-remediation.mjs, and existing reconciliation backups remain untouched. No dependency or application/SQL file was changed by this remediation.
