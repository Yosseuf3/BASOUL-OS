# Web RC finalization — 2026-10-22

Scope: local release preparation on `codex/five-state-task-compatibility`, baseline `4eddecd4134e407fc6f697f1532465caf0e7095d`. Supplements `BATCH_3_COMPLETION_AND_WEB_RC.md`; preserves its evidence and all earlier work. No new product batch, permission expansion or remote execution.

## Decision

**HOLD for release. Achievable local RC preparation is complete**, with successful final configured quality and integration runs. Remaining security and owner/operator gates are below. Local success is not deployment approval. Android's existing 15 HIGH findings remain an independent Android release blocker; they do not imply Web runtime exposure.

## Web security disposition

The five HIGH package findings are one transitive chain, not five independent runtime vulnerabilities:

`eslint-config-next@16.3.3 → @next/eslint-plugin-next@16.2.12 → fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3`.

Underlying advisory: [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), recursive brace-pattern processing can exhaust the Node stack. Registry checks returned braces 3.0.3 and micromatch 4.0.8 as current versions; the advisory lists no patched version. The current plugin 16.4.2 still depends on fast-glob 3.3.1, and fast-glob 3.3.3 still uses affected micromatch. npm's proposed eslint-config-next 14.2.35 downgrade is incompatible with the current Next 16 toolchain and is not applied. No audit override, suppression, dependency removal to hide the finding, or exception extension is used.

Observed plugin consumer: `node_modules/@next/eslint-plugin-next/dist/utils/get-root-dirs.js` calls fast-glob on the trusted ESLint `settings.next.rootDir` configuration. The repository does not accept a user-supplied lint configuration through a product endpoint. The affected chain belongs to development/lint/CI; production dependency audit is independently checked. This narrows observed exposure, not proof that every possible build input is harmless. Run CI for untrusted branches without production secrets and never lint arbitrary uploaded configurations. The full-tooling audit gate remains red until a supported upstream fix exists and is verified.

Final production-mode build evidence: none of braces/micromatch/fast-glob appears in the 30 generated server dependency traces, and `npm ls --omit=dev braces micromatch fast-glob` returns an empty production tree. Together with the zero-finding production audit, this supports the tooling-only classification for this build; it does not waive CI exposure.

## Database installation and preflight

Historical ordering comes from `scripts/task-historical-manifest.mjs`: insert the client baseline repair before v0.5.0, and the historical engineering foundation before alpha.5. Do not sort the two migration directories independently and assume that is a valid combined upgrade.

Reviewed candidate order after the historical baseline:

1. `proposed-task-review-enum.sql`, committed separately before statements that use the new enum value.
2. `proposed-task-rollout-gate.sql`.
3. `proposed-task-security-hardening.sql`.
4. `proposed-task-transition-enforcement.sql`.
5. `proposed-task-notifications.sql`.
6. `proposed-task-edit-cas.sql`.
7. `proposed-project-workflows.sql`.
8. `proposed-team-collaboration.sql`.
9. `proposed-batch3-completion.sql`.

Rehearsal now includes all eight non-enum candidates, strips only standalone transaction wrappers when testing a combined transaction, injects an installation failure, compares complete data/schema/security fingerprints after rollback, reapplies the candidates, exercises CAS archiving, and dump/restores into a separate local database. Reapplication exposed existing duplicate policy/trigger creation in older task candidates; explicit DROP IF EXISTS followed by the identical reviewed definition makes repeated installation possible without deleting rows or weakening policy expressions. Operators must install each candidate transactionally; individual nontransactional statement execution is not approved.

`docs/database/web-rc-preflight.sql` is an explicit READ ONLY post-install check. It verifies required schema/RLS/RPCs, anonymous execution denial, the legacy insert guard, note/task boundaries and workflow OFF, and reports aggregate historical graph counts. It is not an automatic migration or a complete hosted-security advisor. It assumes the historical drawing/findings tables exist; an installation without them needs a separately rehearsed manifest rather than blind execution.

Production preflight remains unexecuted: compare the actual migration ledger, enum labels, existing RPC signatures, trigger/policy definitions and role grants; inventory legacy-only drawings/findings and task links, unscoped rows and cross-project references; inspect real bucket definitions and provider-managed Auth/Storage schemas. Snapshot counts and hashes of tasks, audit events, membership history and source links. Identify custom triggers/policies before replacement. Measure table-lock duration on a representative approved snapshot. Never repair anomalies by deleting records, inventing task links or widening tenant policies.

## Invitation provider configuration (prepared, not applied)

The product uses Supabase Auth SMTP through the administrative invitation API; it does not use a new direct mail SDK. Provider-neutral configuration is sufficient until the owner selects an account/domain. [Supabase SMTP settings](https://supabase.com/docs/guides/auth/auth-smtp) and [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls) are the configuration references.

| Setting | Prepared requirement |
| --- | --- |
| Auth SMTP | Approved host, TLS-capable port, dedicated username and secret stored in the Auth provider's secret configuration; never NEXT_PUBLIC or committed |
| Sender | Owner-approved verified transactional domain and From address; SPF/DKIM and DMARC alignment checked before external delivery |
| Redirect | Exact canonical HTTPS origin in Auth Site URL and redirect allowlist; same origin in Edge `BASOUL_PUBLIC_URL`; no broad production wildcards |
| Web | Matching `NEXT_PUBLIC_SUPABASE_URL` and public anon/publishable key at build time; no privileged key in client configuration |
| Edge | Server-only SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY; verify JWT on the deployed organization-admin function |
| Operations | Rate limits, invite expiry, provider event retention, bounce/suppression monitoring, retry runbook and authorized test recipients |

Lifecycle coverage includes owner authorization, normalized identity attachment, pending-invitation reuse, verified-user acceptance, one membership/audit/inbox result, duplicate acceptance, revoked/expired invitations, revoked membership, forced notification failure rollback and recovery. Actual local GoTrue/SMTP capture tests transient delivery failure, explicit retry, verification and acceptance. External mailbox delivery, provider webhooks, spam placement, DNS, Deno deployment and long-duration Auth token expiry are not certified.

Retry policy: transient provider failures may be retried with a bounded operator-visible retry; reuse the pending organization invitation instead of creating duplicates. An existing unverified Auth identity is ambiguous delivery, not success: retain the delivery-unconfirmed response, reconcile provider status, and use an approved resend/recovery procedure. Do not automatically mark email verified, attach an arbitrary identity, generate a fresh task, or promise exactly-once inbox delivery.

## Proposed scoped file sharing — awaiting owner approval

Current policy stays uploader-only. Active organization/project access is necessary but does not itself grant another user's file bytes. No new ACL table, policy, RPC, signing endpoint or role grant is installed.

Prepared implementation contract for review:

- Keep file identity `(organization_id, project_id, uploader, storage_path)` immutable and validate project membership on every operation. Derive object identity from trusted metadata; reject client-selected foreign paths.
- Owner must choose whether every active project member receives read access or access requires explicit per-file grants. Organization membership alone must not imply access to all projects; decide which existing project access rule is authoritative before implementation.
- Keep metadata visibility separate from byte retrieval. If explicit grants are chosen, record issuer, recipient scope, creation/revocation time and audit event in one authorized transaction; define who may grant/revoke. Do not infer grant authority merely from an administration role.
- Use current membership and project authorization when issuing a short-lived signed URL; do not expose a service-role signer accepting arbitrary object paths. Existing URLs remain valid until their TTL. If immediate revocation is required, approve an authenticated proxy design and its performance/storage implications.
- Require idempotent grant/revoke, role downgrade and membership revocation tests, cross-project/same-org negatives, cross-tenant negatives, signing expiry and stale organization rejection before any policy expansion.

Shortest controlled pilot option: explicitly approve uploader-only file scope and do not advertise team file sharing. Otherwise sharing implementation is a separate approved scope, not a hidden RC permission change.

## Deployment review, rollout and rollback checklist

- [ ] Review the exact eventual checkpoint and lockfile with no logs, credentials or unrelated changes; no commit is authorized by this report.
- [ ] Resolve the supported-toolchain HIGH findings. Runtime-clean audit does not silently waive the full security gate.
- [ ] Approve pilot file scope and supported engineering scope; exclude unreconciled legacy ingestion/CAD paths.
- [ ] Approve a non-production target and recipient allowlist before external mail/configuration verification.
- [ ] Pin Node 22.13.1 and the existing npm lockfile; confirm root build command and bundle budgets on the deployment runner. The local portable runtime is not automatically a hosting setting.
- [ ] Review `vercel.json`: main automatic deployment is disabled, two services web/cad_gateway are declared, the CAD binding and catch-all rewrite exist. This does not prove branch deployments, remote project settings or container runtime are configured; inspect them only after authorization. If CAD is outside RC scope, do not expose its unsupported entry points.
- [ ] Compare Web build-time public configuration with the server/Edge target; validate canonical origin/redirect allowlist, security headers, server-only secrets and log redaction. Never pull production secrets merely to build locally.
- [ ] Approve the migration ledger mapping and representative backup/restore rehearsal; install reviewed schema/guards before dependent clients, preserving compatibility refusal. Check transactional wrapper boundaries and the separately committed enum.
- [ ] Run the read-only preflight and inspect counts/security definitions on the approved target. Stop on any unknown historical variant or active workflow row.
- [ ] Provision a new isolated test organization with synthetic owner/member/viewer accounts and private project/storage paths. No customer organization is a pilot by default.
- [ ] Keep the compiled TASK_WORKFLOW_WRITES_ENABLED false and database activation absent/false. The current production build hard-disables workflow writes; changing environment variables alone cannot authorize or enable them. Any future production activation mechanism requires separately reviewed code and owner approval. The NEXT_PUBLIC_BASOUL_LOCAL_WORKFLOW variable is a loopback fixture switch, not remote activation authority.
- [ ] Run deployed supported Web journeys, HTTP/Auth/Storage/notifications, mail and access-revocation checks in that organization. Record actual browser and backend evidence independently.
- [ ] Obtain separate deployment and eventual activation authorization. Activated five-state E2E and operator acceptance are prerequisites for workflow activation; local OFF-mode success is insufficient.

Rollback plan: stop pilot onboarding and dependent writes; retain additive schema, tenant/history/compatibility guards, audit rows and object references. Revert only to a compatible reviewed client/function set. Do not roll back to an orphan-producing converter. For a failed SQL installation, roll back the entire transaction and compare fingerprints/counts; for post-commit recovery, use an approved verified snapshot and reconcile later writes before restoration. Never drop bridged drawings or delete Storage objects as rollback. Retain pilot evidence and verify access revocation, CAS and audit links after recovery.

## Final execution evidence

- Historical rehearsal: PASS, fresh and upgrade, 37 ordered historical migrations, review enum plus eight candidates, repeat installation, injected atomic rollback and full dump/restore fingerprint. The read-only preflight passed in both paths. Evidence: `.git/basoul-local/web-rc-historical.log`.
- Web/Auth/PostgREST/real Storage/SMTP/browser suite: PASS, exit 0, `.git/basoul-local/web-rc-integration-final.log`. Browser execution covers login, owner A/viewer B, stale request suppression and wizard invalidation, project task creation/navigation, failed upload recovery, duplicate retry, real download, note conversion, membership notification links, wrong-tenant refusal, administrative privilege revocation and restoration. Member writes and suspended-member access with an existing JWT are covered through authenticated HTTP, not claimed as a separate member-browser session.
- Actual invitation delivery remains local synthetic SMTP only; no external email was sent. Storage remains uploader-only; cross-user byte-sharing is intentionally not certified.
- Final `quality:all`: PASS, exit 0, `.git/basoul-local/web-rc-quality-configured.log`: 359/359 tests, Web/Mobile TypeScript, lint zero errors / 19 existing warnings, production build, bundle budgets and Expo Doctor 21/21. The known Pascal import.meta compilation warning remains visible. The first run passed tests, TypeScript and lint, then failed build prerender because required public Supabase variables were absent (`web-rc-quality.log`). No application fallback or production credentials were introduced. The successful configured rerun uses the synthetic loopback URL/public fixture key and workflow OFF; it validates a production-mode build, not the real deployment's configuration. Dependency audits: production zero findings; full Web five HIGH in tooling, no supported patch identified. Android was not rebuilt or re-audited in this Web-only execution.
- Engineering/CAD provider ingestion, external mailboxes/DNS/provider events, deployed Edge runtime and deployed pilot journeys remain outside verified local coverage. No activated Web workflow E2E is claimed.

Changed files in this finalization only (10), compared with its starting hash inventory:

- `docs/database/proposed-task-edit-cas.sql`
- `docs/database/proposed-task-notifications.sql`
- `docs/database/proposed-task-rollout-gate.sql`
- `docs/database/proposed-task-security-hardening.sql`
- `docs/database/proposed-task-transition-enforcement.sql`
- `docs/database/web-rc-preflight.sql`
- `docs/operations/WEB_RC_FINALIZATION.md`
- `scripts/validate-organization-local.mjs`
- `scripts/validate-project-workflows-local.mjs`
- `scripts/validate-task-historical-local.mjs`

This is not the full accumulated worktree or a staged checkpoint. Existing application and dependency changes from previous batches are preserved; this execution adds SQL repeatability, preflight and validation/release preparation rather than another feature batch.

Preservation/security review: branch and baseline HEAD unchanged, index empty, all pre-existing files retained, error.log hash unchanged, git diff whitespace check passes and the targeted credential-pattern scan finds no private-key/privileged-key/JWT literals in these ten files. This pattern scan is not a comprehensive secret-discovery guarantee. Test logs and synthetic captures remain ignored under `.git/basoul-local/`. All six dedicated test containers are stopped; no fixture listeners remain. No Git write operation, deployment, EAS build, external email or remote database operation occurred. The isolated legacy matrix exception is disclosed below.

Execution boundary note: an initial legacy PostgreSQL matrix exercised enabled task transitions in a network-none disposable synthetic database. This exceeded the requested OFF-only workflow scope; the container was stopped and that matrix was not repeated. It did not access a configured remote environment. The subsequent historical rehearsal and Web/Auth/Storage suites explicitly require the workflow to remain OFF. This distinction is preserved rather than claiming that no local test ever enabled the gate.
