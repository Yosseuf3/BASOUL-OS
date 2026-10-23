# Web release readiness — final inspection

Inspection date: 2026-10-23. Repository: `Yosseuf3/BASOUL-OS`; branch: `codex/repository-reconciliation`; baseline/inspected HEAD: `755a20083084765e0ee679deb66272a369fbbda9`. [Draft PR #174](https://github.com/Yosseuf3/BASOUL-OS/pull/174).

**Decision: HOLD release.** Web CI succeeds, but the existing protected-main integration path remains blocked by Mobile security. Hosted Preview validation, authorized target database preflight and external email delivery are not certified. This inspection changes documentation only; it authorizes no release, deployment, migration, permission expansion or workflow activation.

## GitHub required checks

Read-only GitHub API inspection confirms active ruleset **Protect Main Branch**, ID `19746250`, targeting `refs/heads/main`. It requires a pull request, prohibits deletion/non-fast-forward updates, and requires **Web quality** and **Mobile quality**, both from GitHub Actions integration `15368`. Strict required-check policy is enabled. The legacy branch-protection endpoint returns 404; that does not negate the active ruleset.

| Check on inspected PR HEAD | Actual result | Interpretation |
|---|---|---|
| Web quality | SUCCESS, 2026-10-23 14:43:49 UTC | Required Web gate passed |
| Mobile quality | FAILURE, 14:42:00 UTC | Required main integration gate blocked |
| runtime-validation | FAILURE, 14:41:59 UTC | Additional failing mobile workflow; not listed as required in the inspected ruleset |
| verify-eas-build | SUCCESS, 14:42:09 UTC | Status-check workflow success; not proof of a new EAS build or native execution |

[Quality Gate run 39971800336](https://github.com/Yosseuf3/BASOUL-OS/actions/runs/39971800336). Mobile's exact failing command is `npm run audit:production`, invoking `node ../scripts/audit-mobile-production.mjs`, exit 1: **4 HIGH, 0 CRITICAL; no exceptions permitted**. Affected package entries are `expo`, `@expo/cli`, `@expo/code-signing-certificates`, and `node-forge`. Existing dependency analysis identifies the `node-forge@1.4.0` chain through Expo tooling. Historical counts of 15 Android HIGH and 5 Web tooling HIGH are not the current baseline.

## Web release gate

`.github/workflows/quality.yml` already runs separate Web and Mobile jobs. Web checks release/foundation/accessibility, production npm audit, lint, TypeScript, tests, production build and bundle budget. Its build uses placeholder Supabase configuration, so success does not validate a hosted backend.

Web can be assessed independently as a product, but **cannot proceed through protected main independently under the current required-check configuration**. No Mobile check was removed, made optional or bypassed. No alternate deployment route was used. Draft status and passing CI are not release approval. The safe integration route is a supported Mobile dependency remediation followed by both required checks passing; if unavailable, retain the draft and hold integration. A different release topology would require an explicitly approved future design, not an implicit exception here.

## Existing Vercel configuration

Authenticated connector inspection found exactly one linked project: **yosseuf-os**, project `prj_uHdvrknlDGmNyvHNu0dzWEOPzSkA`, team `team_VBfclN55jUH4c2bOGLjHPQE2`. Reuse it; no duplicate project/environment was created. Project metadata reports Next.js and Node `24.x`, whereas CI/local evidence uses Node `22.13.1`. This is configuration drift requiring review before hosted validation; no setting was changed.

`vercel.json` explicitly sets Git deployment OFF for `main` and `codex/repository-reconciliation`. It defines Web plus the containerized `cad_gateway`, a Web-to-CAD service binding, service-scoped ignore commands, and a Web catch-all rewrite. The ignore script's selective build/skip behavior is separate from explicit Git disabling. No deployment for the inspected HEAD was found in the GitHub deployment query; this is consistent with intentional disabling and is not a failed build or a hosted PASS.

GitHub environments named Preview and Production exist with no environment protection rules or deployment branch policy in their returned metadata. These labels do not demonstrate backend isolation or override main protection. Vercel reports no custom environments. Encrypted environment metadata lists only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, each scoped jointly to production and preview. Values were not decrypted. This shared scope is an isolation warning, not proof of a separate test database. Provider-side SMTP configuration was not available through this metadata.

## Historical Preview failure root cause

Read-only Vercel build logs establish a concrete failure separate from current Git disabling:

- `dpl_AXhyZL4RHU4QevB47GCvvpnh7b4S`, `dpl_HFYFYpqPPZnuqSfXffBmDbHvB7fF`, and `dpl_Fa3woVMqRVpwiqMyXrdqSiXqhu24`, all at historical SHA `66f5dffd37c2a122e0346ca334fb54b39ea4e41b`, failed while publishing the built `cad_gateway` image. The registry rejected the manifest because its repository had reached the maximum allowed number of images; `buildah push` exited 125. These logs do not establish a Next.js compilation failure.
- `dpl_9na4h9kpzQZnRWEkuG8BqxSgwWGJ` and `dpl_FkuQntWkmYWNqKzETSufh5UhWrYj` report `ERROR` with **`git_info_fail`**; returned build logs were empty. The metadata identifies a Git-information failure but does not establish its underlying credential/ref cause. Do not attribute these two failures to registry capacity without evidence.
- Earlier Preview `dpl_FBS7gXrS2YPve67X7dfZXugiuvNT`, SHA `d3ccab33b43e2153802124fb5f5b61cd823f66d5`, is READY. An older READY build does not certify the current SHA.

[Latest inspected failed Preview](https://vercel.com/yosseuf-os/yosseuf-os/AXhyZL4RHU4QevB47GCvvpnh7b4S). Safe follow-up: have the existing project owner review registry capacity/retention and rollback-image requirements, and resolve Git integration/ref visibility if reproducible. No images were deleted, capacity changed or builds retried. Capacity may have changed since those historical attempts; no present-capacity PASS is claimed.

## Database preflight

**Authorized hosted non-production preflight: NOT EXECUTED.** Root/mobile contain example env files only; no relevant Supabase/database/SMTP/mail process variable names were found. Shared production/preview Vercel keys cannot establish an authorized isolated database. No secrets were decrypted and no remote database was queried. Existing stopped synthetic Docker fixtures and previous rehearsal results are not a substitute for a live, identified hosted target. No fixture was recreated or migrated during this read-only assessment.

Reuse `docs/database/web-rc-preflight.sql` only after target identity and non-production authorization are established. It runs a read-only transaction with a 15-second timeout and rollback. It checks RLS tables, `public.client_status`, candidate RPCs, legacy insert guard, anonymous RPC privileges, note/task tenant links and workflow OFF. **It is post-install validation**, not an installer: it assumes candidate objects and historical `drawing_assets`/`architectural_findings` exist. An uninstalled candidate or absent historical relation must be diagnosed against the exact target migration ledger, not automatically repaired.

Prior local `reconciliation-historical.log` records PASS for fresh and upgrade paths: 37 ordered migrations, review enum plus eight transactional candidates, preservation/idempotence, failed-DDL rollback/reapply, CAS archive and dump/restore fingerprints. Its explicit limitation is synthetic Auth/Storage catalog fixtures, not hosted or production-data parity. Retain this evidence; obtain target-specific schema/ledger/RLS/trigger/function-grant and historical-data diagnostics before release. No remote migration is authorized by this report.

## External email

**External delivery: NOT EXECUTED.** No previously approved real test recipients or non-production provider configuration were evidenced. No external email was sent. Prior actual isolated GoTrue SMTP evidence covers delivery rejection, explicit retry, one captured synthetic email, verification-link acceptance and duplicate confirmed-user rejection. This does not prove external inbox delivery, DNS alignment or provider webhook behavior.

Before an approved external test: identify the existing non-production provider/account, verified sender/domain, SPF/DKIM/DMARC configuration, recipient allowlist, callback origin and invitation redirect allowlist; keep credentials server-side. Then validate failure/retry/idempotency, expiry, acceptance and access after revocation using only approved recipients. Do not point an invitation test at the production backend merely because Vercel supplies shared keys.

## File permissions reconciliation

The implemented contract is **uploader-only file bytes with current organization/project authorization**. It does not provide arbitrary team sharing. `lib/projects/project-file-service.ts` rejects a different `user_id` before signing, with Arabic/English feedback; signed download URLs expire after 60 seconds. Organization leases/scoped clients protect stale organization operations. Physical deletion deliberately returns retention/recovery guidance.

Storage policy `project_file_storage_select_own` in `20260828042500_project_files_storage_policy_name_collision_fix.sql` requires the first path segment to match `auth.uid()`, a matching project in segment two, and current organization read permission. Upload additionally requires create permission. The project-workflows candidate adds restrictive registered-metadata validation before object insertion. These constraints align with the application guard; organization owner status alone does not grant someone else's bytes. Metadata visibility must not be advertised as byte-sharing authorization.

Reused isolated Storage/browser evidence covers upload/download/signing, duplicate retry without overwrite, missing-object failures, foreign actor/organization denial, reference integrity and revocation. New signing/authenticated retrieval are denied after access revocation; an already issued bearer URL can remain usable until TTL. Instant signed-URL revocation is not claimed. These tests do not certify remote policies, which require the authorized target preflight.

Safe product options: explicitly approve an uploader-only pilot and describe its scope accurately, or approve a separate organization/project-scoped sharing policy before implementing grants. No ACL, RLS permission or role was broadened here.

## Reused validation and security evidence

No unrelated audit or full regression was repeated. Existing exact-baseline publication evidence records `quality:all` exit 0, **364/364 local tests**, Web/Mobile TypeScript, lint (0 errors; 19 existing warnings), Next `16.4.3` production build/bundle budget and Expo Doctor 21/21. `publication-integration-final.log` records isolated browser/Auth/PostgREST/Storage/SMTP PASS, two organizations, role negatives, CAS/conversion/audit, project journeys and notification access revocation; temporary services stopped and workflow remained OFF.

The prior refreshed audit reports **Web production 0 and full Web graph 0 vulnerabilities** after the supported Next patch and upstream braces advisory withdrawal. Today's actual Web CI production-audit success corroborates the production gate; the full graph result is reused evidence, not a new audit. Mobile remains blocked by the fresh CI result of **4 HIGH**. No exceptions, suppressions or security bypasses were added. Neither this report nor local test success establishes production readiness.

## Remaining blockers and recommended release action

1. Resolve Mobile's mandatory security check with supported patches, then obtain both required checks on the current up-to-date PR. Keep the draft/merge hold meanwhile.
2. Review existing Vercel registry capacity, Git-information failures and Node-version drift. Preserve rollback assets; do not delete registry images without a reviewed retention decision.
3. Identify an already approved isolated backend and prove Preview configuration cannot reach production. Run only read-only preflight under the present authorization; schema application requires separate approval.
4. Establish approved external email configuration/recipients and execute the bounded invitation test. Current local SMTP evidence remains useful but insufficient for external delivery.
5. Confirm pilot file scope (uploader-only), or obtain approval for scoped sharing before any expansion.
6. After prerequisites and separate Preview deployment authorization, validate the exact release SHA on the existing project with the existing isolated test organization/environment, workflow OFF. Recheck migration/rollback and feature-gate evidence, then obtain explicit merge and production-release decisions. Neither is authorized now.

Only this report was added. Application source, dependency locks, workflows, branch protection, Vercel settings and remote data were unchanged. `AGENTS.md`, `CLAUDE.md` and `error.log` remain untracked and excluded; `error.log` SHA-256 remains `48493AE1A7D1C90A1A0114AC00A7686102CB4BC320301B7D4277C28284E51786`. No commits, pushes, deployments, remote migrations, EAS builds or feature activation occurred.
