# PR #173 focused release-blocker remediation

No SQL here is applied to production. Enforcement remains a review-only candidate
under docs/database; workflow writes remain disabled. No RLS or schema migration
is activated by this PR.

## Bootstrap / upgrade

Fresh bootstrap now defines the five-value public.task_status enum and uses it
for tasks.status. The existing enum upgrade adds Review without replacing the
enum or rewriting rows. Commit enum expansion before installing enforcement.
Fresh bootstrap + repository IAM foundation/table RLS and the representative
pre-Review enum upgrade are exercised by the same real PostgreSQL runner.

An existing text-status installation is NOT silently converted by bootstrap.
Enforcement preflight rejects it with TASK_STATUS_SCHEMA_UNSUPPORTED. Such an
installation needs separately reviewed dependency/constraint inventory and an
explicit conversion migration. This test does not prove replay of every historical
storage/architecture migration, production schema parity, or Auth/PostgREST behavior.

## Older approved Android build

Source f0b0c25150b515665ec5a9efb5e41ae29d015bad, services/workspace.ts:
advanceMobileTask uses direct update, no expected-status/version protocol;
To Do -> In Progress fabricates minimum 15, In Progress -> Review minimum 80,
Review -> Done fabricates 100. Waiting has no mapping. Task presentation lacks
Waiting labels. The old App refresh clears organization context before loading;
PR #172 already repairs ordinary mutation-failure context loss in newer source.

Safe unchanged-writer compatibility is impossible under the approved CAS and
progress contract. Local direct requests are rejected rather than bypassed.
No automatic retries, silent conversion, or permission expansion is introduced.
Activation remains BLOCKED. Owner options: keep enforcement off while upgrading
supported writers, or approve a minimum-supported-client rollout with explicit
update-required handling. Neither option is activated here. No physical APK PASS.

## Transactional audit candidate

Existing activity_events supports entity_id, user_id, organization_id, created_at
and metadata. Existing recordActivity uses separate HTTP writes and is not atomic.
An invoker AFTER UPDATE trigger records only actual successful status changes in
the same transaction. Metadata includes task, tenant, actor, old/new statuses,
timestamp and optional bounded reason. RPC reason is transaction-local and cleared.
Audit permission/constraint failure aborts the task change. Rejected/stale/repeated
requests cannot create success events. Existing tenant RLS is unchanged.

The candidate's RPC signature gains optional p_reason; its previous candidate
signature is removed atomically to avoid ambiguous API overloads. Future writers
must not additionally call recordActivity for the same transition. Existing
notification delivery is not added. Mandatory reason rules and notifications are
separate activation decisions. The existing activity table is not immutable under
its current update/delete permissions; tamper-proof audit retention would require
separate schema/RLS authorization, not hidden changes in this PR.

The status trigger advances updated_at monotonically, avoiding transaction-stable
now() versions when multiple status changes occur in one transaction.

## Reproduction / evidence limits

Run `node scripts/validate-task-postgres.mjs` with the dedicated
basoul-pr173-validation container already running. The runner requires network
none, no published ports, no volume mounts and tmpfs data. It creates uniquely named
synthetic databases and retains them for inspection; it never deletes resources.
It uses the repository IAM permission functions and table RLS policies (excluding
unrelated Storage policies), non-superuser authenticated role and simulated auth.uid.
It tests 25 transitions, preservation, creator/viewer/tenant rejection, CAS conflicts,
audit atomicity/duplicates and actual concurrent row locking on both schema paths.
It is not GoTrue/JWT/PostgREST, production, or physical-device verification.

Activation still requires supported-writer upgrade/owner decision, API-level Auth
and RLS verification, production read-only schema/grant preflight, required reason
semantics, notification/duplicate-client-event review and separately authorized
migration rollout. PR stays draft; no merge, production deployment or EAS build.

Local validation on 2026-10-11: full suite 282/282; focused contract/compatibility
42/42; fresh/upgrade PostgreSQL runner PASS (including audit failure rollback,
repeated requests, old direct payload rejection, same-transaction ABA versions and
concurrent status updates). Web/Mobile TypeScript PASS; lint 0 errors / 19 existing
warnings; Expo Doctor 21/21; Web production audit zero vulnerabilities; Mobile
production audit PASS under unchanged exceptions expiring 2026-10-16T00:00:00Z.
These results do not remove the explicitly stated activation/old-client blockers.
