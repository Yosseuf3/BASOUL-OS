# Proposed path-aware release gates

Date: 2026-10-23. Based on integration checkpoint `755a20083084765e0ee679deb66272a369fbbda9`, PR #174. Dedicated branch: `codex/path-aware-release-gates`. This is a stacked CI architecture proposal targeting the integration branch; PR #174 is preserved.

## Current protection and staged transition

GitHub API lists one active repository ruleset: **19746250 — Protect Main Branch**, targeting `refs/heads/main`. Required checks: **Web quality**, **Mobile quality**, GitHub Actions integration **15368**. Strict checks are enabled; no bypass actors. No ruleset was changed.

The existing quality job names and audit commands are retained. Web stays unconditional. Mobile quality always runs a scope-evidence guard; checkout, Node setup, dependency installation, audit, TypeScript and Doctor execute only for verified Android-affected changes. The guard runs in the workspace before checkout (not the not-yet-created mobile directory). Missing or failed scope fails that raw job. Proposed stable aggregate names are **Web release gate** and **Android release gate**. Both execute with `always()` and inspect explicit dependency results. Missing/failed classification, invalid outputs, or a skipped/cancelled/failed quality job fails the corresponding gate even for non-affected scope. Irrelevant-platform success means only “not affected”; it does not certify that platform for release.

**Replacement proposal requiring separate precise approval after verification:** in ruleset 19746250 replace required contexts `Web quality` / `Mobile quality` with `Web release gate` / `Android release gate`, retaining integration 15368, strict policy, PR and all other rules unchanged. Both aggregate checks must remain required. This proposal is not an approval to apply it. Until then Mobile failures continue blocking main, including Web-only PRs. This change does not establish independent eligibility under the still-active old rules.

No required job is skipped: only unnecessary Android steps are skipped after explicit successful scope verification. CI/security changes themselves require Android work, so this refinement cannot skip its own failing audit. No duplicate quality suite or workflow is added: aggregate jobs only evaluate existing results. A change affecting both platforms cannot be relabeled Web-only to escape Mobile audit. This refinement does not install the implementation on main; the separate bootstrap prerequisite remains.

## Scope contract

| Changed paths | Required platform evidence |
|---|---|
| `app/`, `components/`, `public/`, Next/PostCSS configuration, excluding API/auth/security paths | Web quality/security |
| `mobile/` | Mobile quality/security |
| Shared packages, `lib/`, root dependencies/configuration | Both |
| Database, IAM, RLS, migrations, SQL candidates | Both |
| API/auth/IAM/RLS/security/permission/migration path segments, workflows, security scripts/policy, unknown paths, documentation | Both (conservative default) |
| Empty diff | Both |

The full PR merge-base-to-head diff is used, not only the last push or a changed-file API page. Push events use before/after endpoints. Full Git history is fetched. Renames are evaluated as deletion plus addition so crossing boundaries cannot hide an affected platform. Missing/zero/invalid endpoints or Git errors fail classification. Filenames use NUL delimiters. No workflow-level path filter can leave aggregate checks silently absent. New branches without a trustworthy push base fail closed; PRs have explicit endpoints.

Root tests contain shared/mobile contracts, so the existing Web job can still detect a shared regression. There is no claim that TypeScript alone proves database runtime isolation: existing isolated HTTP/database/browser release evidence remains required for schema changes. This CI proposal adds no remote test access and does not replace schema preflight or rollout approval.

## Validation and limits

Focused tests cover Web-only, Mobile-only, shared code, database/RLS, workflow/security-policy, unknown/empty/mixed paths, affected failures, skipped/cancelled/missing dependencies, invalid classification and unaffected-platform failures. Workflow regression assertions preserve scope verification before conditional Android steps, always-evaluated aggregates, strict Mobile audit invocation and absence of continue-on-error. Successful non-Android classification alone cannot convert a missing job result into success.

Final refined full repository regression: **368/368 passed**, including four focused release-scope/gate/workflow/shell-guard tests; focused ESLint passed. GitHub execution of the proposed checks is required before ruleset replacement; local simulation alone is insufficient. This proposal itself changes workflow/security policy and therefore requires both platforms. The integration baseline has Mobile HIGH findings, so its Android gate is expected to fail without supported remediation. Do not weaken the gate to make this proposal green.

`vercel.json` additionally disables Git deployments for this dedicated branch to preserve the no-deployment instruction. Existing project/services and other branch settings remain unchanged. No EAS/remote-migration/activation workflow is dispatched. Existing disabled workflows remain disabled.

## Release blockers

Web: active old ruleset still requires failing Mobile quality; this proposal is unmerged/unapproved for protection replacement. Hosted Preview registry/Git failures, Node-version drift, authorized isolated database preflight, external invitation delivery and uploader-only file pilot scope remain as recorded in `WEB_RELEASE_READINESS_FINAL.md`. That pre-existing untracked report is not included in this CI commit.

Android: strict audit remains blocked by four HIGH package entries through Expo/node-forge. No suppression, exception extension, major Expo upgrade or release authorization is introduced. Keep Android release blocked even if a future Web-only aggregate passes.

Review sequence: inspect the dedicated Draft PR and actual check outputs; remediate affected security failures; validate representative GitHub path cases in an approved test process; obtain precise ruleset-replacement approval; then apply only the approved protection edit. Merge, deployment, feature activation and production release each remain outside this authorization.

Reference: [GitHub job dependency semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds) explain why aggregate checks use `always()` and explicitly reject skipped affected jobs.
