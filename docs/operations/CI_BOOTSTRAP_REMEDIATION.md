# Safe CI bootstrap remediation

2026-10-23. Main inspected at `d8a6b80750b7df8b43a7f8f31fa61db72ad14308`; active ruleset `19746250`, strict required `Web quality` and `Mobile quality` from Actions integration 15368; no bypass actors. PR #174 and stacked Draft PR #175 remain unmerged. No protection modification is authorized or performed in this task.

## Refinement of #175

The Android job always verifies successful classifier evidence. A verified Web-only diff skips the six expensive Android steps, not the job itself. Affected Android executes the existing install, strict audit, TypeScript and Doctor commands. Aggregate gates require an explicit successful platform job even for non-affected scope: missing, skipped, cancelled and failed results never pass. Unknown/shared/database/RLS/CI/security changes require both. API/auth/security/permissions path segments conservatively require both even inside Web/Mobile directories. The same existing workflow and quality jobs are reused.

The CI PR itself affects both platforms; its Android audit must continue failing while HIGH findings remain. The previous approved SHA is retained in history; refinement requires review of its new SHA. Neither #175 nor its original checkpoint is present on main.

## Minimal main-based bootstrap design

Prepare against main, not the integration branch. Inventory:

1. `.github/workflows/quality.yml`: add scope classification and the two always-evaluated aggregates; preserve both existing raw jobs byte-for-byte, including unconditional Android installation/audit. Do not introduce path-based step skipping in the bootstrap.
2. `scripts/release-scope.mjs`: scope classifier and fail-closed gate evaluation.
3. `tests/release-scope.test.mjs`: classifier/gate cases, plus bootstrap-specific assertions that the original raw jobs are unchanged. The refinement's conditional-step structural test is not appropriate to this bootstrap variant.
4. `vercel.json`: only add deployment disabling for the dedicated future bootstrap branch, preserving the existing project configuration. No deployment attempt.

No application source, database candidate, dependency manifest/lockfile, security exception or integration feature is part of that CI-only inventory. Do not cherry-pick #175 wholesale onto main: its parent is the integration checkpoint and its refined job structure differs from the intentionally unconditional bootstrap.

This task prepares a private local bootstrap candidate under `.git/basoul-local/ci-bootstrap/`; it is not a published branch/PR, installed workflow or passing protected-target validation. A blocked Draft bootstrap PR would add no evidence that overrides the failing checks, so none was opened automatically. No CI-only bootstrap can presently satisfy both unchanged checks.

## Exact blocker on main

Main's `scripts/audit-mobile-production.mjs` contains an unconditional expiry check before dependency inspection. Executing that exact main script at the current date exits 1 with **“Mobile node-forge audit exception expired on 2026-10-16.”** This occurs before npm audit/dependency access, so merely adding CI infrastructure or updating an unrelated Web file cannot repair it. No system clock or exception was changed. The integration version is stricter with no exceptions and its actual CI reports four HIGH package entries. Copying that stricter script alone would replace an expiry failure with a real vulnerability failure, not make the gate green.

Main also has Next 16.3.8 versus the supported integration patch 16.4.3. The CI-only candidate retains main's dependencies; a fresh candidate Web CI pass is not claimed. The deterministic Mobile failure is already sufficient to establish that the proposed unchanged-check bootstrap cannot pass both gates. No unrelated audit/build suite was repeated to rediscover it.

## Supported transition sequence and authorizations

1. **Security prerequisites:** prepare a separate normal PR against current main with supported dependency remediation and a strict, exception-free audit implementation. Preserve required check names and actual security checks. Do not extend the expired exception, suppress findings or manufacture statuses. If supported clean Android dependencies are unavailable, remain blocked; there is no compliant GitHub-native mechanism that turns that failed mandatory check into permission to merge under these constraints.
2. Require actual Web quality and Mobile quality success on that PR's latest/up-to-date commit. Owner review and **separate explicit merge authorization** are required; no merge in this task.
3. Rebase/rebuild the CI-only bootstrap on that clean main, retaining old raw jobs, no skip conditions, and current project deployment disabling. Open/review its Draft PR when authorized. Both old required checks and both new aggregate checks must execute, with real path/failure tests. Merge requires separate approval and existing protections must pass.
4. After the aggregate implementation is on protected main, verify normal PR/main runs report its stable names. Prepare the exact ruleset read/compare/update/rollback transaction and obtain/reconfirm authorization for **that verified implementation**, replacing only old required entries with both new entries at integration 15368. Never leave an interval with neither pair enforced. No ruleset edit here.
5. Land the reviewed path-aware step optimization via normal checks. CI/security changes require Android evidence, so optimization cannot serve as its own exemption. Verify actual Web-only PR skips Android work and both aggregate gates pass; verify shared/security failure blocks Android. Keep both aggregate checks required.
6. Reconcile #175's already installed CI infrastructure rather than duplicating it, then revalidate #174's entire shared/integration diff. It remains Android-affected and cannot become mergeable by being called a Web-only release.

An alternative of installing conditional raw checks as a bootstrap exemption for CI changes is rejected: CI is cross-platform under the approved contract and must execute Android security. Administrator bypass, check removal/neutralization, direct protected pushes, forged check results and ruleset weakening are not supported options.

GitHub's [required-check documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) requires the enforced checks to pass before merging. [Job dependency guidance](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds) supports always-evaluated aggregates, not a bypass of a failing required audit.

## Evidence and exclusions

Local refinement tests: 368/368 passed, including all five representative path categories, missing/skipped/failed/cancelled evidence negatives, and 20 executions of the actual scope-verification shell guard. Local main-based bootstrap candidate classifier/gate/unchanged-raw-job tests: 3/3 passed. The main audit expiry was reproduced from its exact committed script; this is deterministic evidence, not a hosted bootstrap PASS. Actual revised PR CI results are recorded in #175 when available. No native, EAS, production or remote database checks are part of this CI-only work.

`AGENTS.md`, `CLAUDE.md`, `error.log` and the existing untracked readiness report remain excluded. No secrets or local artifacts belong in the CI commit. Existing commits, Draft PRs, backups and integration branch are preserved. Only reviewed CI corrections and these design documents are published to #175.
