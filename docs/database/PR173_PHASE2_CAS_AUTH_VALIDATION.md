# Phase 2: prepared clients and isolated Auth/PostgREST validation

Production activation remains disabled (`TASK_WORKFLOW_WRITES_ENABLED = false`).
No production migration, RLS change, merge or EAS build is included.

## CAS selection

Keep updated_at as an opaque PostgreSQL microsecond timestamp, not a JS Date or
millisecond number. The reviewed trigger replaces supplied timestamps with
greatest(clock_timestamp(), OLD.updated_at + 1 microsecond) on **all** task updates,
after the existing generic timestamp trigger. Row locks serialize updates.
Expected old status and exact timestamp are checked in the invoker RPC; status
transitions never change progress. Tests cover simultaneous requests, stale
status/version, same-transaction ABA and non-status edits/spoofed timestamps.

This guarantee requires installation of that trigger on every task update path,
verified ordering, permissions preventing trigger bypass, and reader precision.
Before installation, generic transaction-stable now() alone is insufficient.
No new version column is needed under these prerequisites. Privileged maintenance
that bypasses triggers is outside this client contract and requires its own gate.
Ordinary field/progress edits remain separate operations; this does not claim
full optimistic concurrency for every existing generic content-edit endpoint.

## Important HTTP discovery

The initial SQLSTATE 40001 conflict caused PostgREST 14 to repeatedly retry the
rejected direct write and consume CPU. It was canceled only in the isolated test
database; no transition/audit committed. The prepared SQL now uses PT409 with the
same TASK_TRANSITION_CONFLICT message: non-retryable HTTP 409. This is a protocol
correction, not weakened CAS. SQL and HTTP tests assert the revised contract.
Clients also recognize genuine 40001 errors without automatically retrying.

Authoritative explanation:
https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b

## Web and Android preparation

Web has a gated transition endpoint, normal getUser/membership authentication,
explicit tenant header, creator/RLS-authorized RPC, shared payload mapping and
sanitized conflict/ambiguous-outcome messages. SaveTask routes activated status
changes through this path and rejects combined field/progress edits instead of
silently dropping them or executing a partial two-write save. No duplicate client
activity event is emitted after a database-audited transition. Generic Web PATCH
cannot act as an alternative direct status writer once the workflow flag enables.

Android reads raw updated_at, prepares all six explicit actions behind the flag,
and sends the same RPC payload. Confirmed conflicts refresh reads with captured
session/organization revision guards; no write retry, context clearing or
progress fabrication occurs. The existing pre-activation To Do compatibility
action remains unchanged while the flag is false; the activated path uses RPC.

The flags are rollout gates, not authorization boundaries or version-code checks.
The database validates current JWT actor, membership, tenant, creator and CAS.

## Isolated environment and evidence

Dedicated internal Docker network: basoul-pr173-auth-network. Separate ephemeral
PostgreSQL 17.6 container: basoul-pr173-auth-db (tmpfs, no shared volume or database
ports). GoTrue v2.196.0: basoul-pr173-auth-clean; PostgREST v14.17:
basoul-pr173-postgrest; read-only HTTP helper: basoul-pr173-http-client.
No external HTTP access is used; requests execute inside the internal network.
No production account, password, key, token or database is used.

Fresh Auth database basoul_pr173_auth_phase2_clean was initialized with the
official supabase_auth_admin role and auth schema/search path. Synthetic signup
uses actor1..actor4@synthetic.invalid, autoconfirm and randomly generated local
credentials. Initial misconfigured Auth/database artifacts are retained for
diagnosis; no vendor table workaround or destructive reset was performed.
Repository bootstrap, activity foundation and IAM foundation/table policies were
installed; unrelated Storage policies/services are excluded. Auth.uid consumes
the JWT claims set by real PostgREST, not a manually assigned actor SQL fixture.

Run `node scripts/validate-task-auth-http.mjs` against this prepared dedicated
stack. It verifies isolation, logs in through real Auth HTTP, verifies identities,
executes the production shared payload/error mapper, creates one uniquely keyed
synthetic task fixture, and checks real PostgREST/RPC authorization and atomicity.
Secrets remain in process memory/own local service configuration and are never
printed or committed. Existing users are reused; test fixtures are retained.

Executed HTTP cases: password login/getUser; malformed Auth JWT; invalid/expired
PostgREST JWT; active owner membership; non-creator owner, viewer and other-tenant
rejection; unknown enum rejection; direct legacy write rejection with PT409;
simultaneous RPC requests (one 200, one 409); one audit event; preserved progress;
cross-tenant row invisibility; actual audit INSERT denial rolls back transition;
unrelated authorized project reads remain available. The audit-denial injection
changes permissions only in this disposable test database, not production RLS.

These are real authenticated backend HTTP tests, not running Web UI/Android APK
E2E certification. Production flags were not toggled for tests. Browser/native
component wiring, error handling and gates have focused automated coverage;
physical testing, production schema/grant preflight and release availability
remain separate activation requirements. Production-matching GoTrue/PostgREST
version/configuration, reason UX/mandatory semantics, and full historical schema
variants still need rollout review. General field-edit CAS is a separate gap.

React review: no new fetching effects or dependencies; conflict refresh is
event-driven and session/revision guarded. Existing Arabic labels, RTL, approved
assets/colors and authentication semantics remain unchanged.

Local quality results on 2026-10-11: repository suite 291/291; focused CAS/contract/
compatibility 51/51; both fresh/upgrade PostgreSQL regressions PASS; real Auth/
PostgREST HTTP runner PASS. Web/Mobile TypeScript PASS; lint 0 errors / 19 existing
warnings; Expo Doctor 21/21; Web production audit zero vulnerabilities; Mobile
production audit PASS under unchanged exact exceptions expiring 2026-10-16T00:00:00Z.
No dependency, manifest, backend, signing or brand changes. Flags remain false.
