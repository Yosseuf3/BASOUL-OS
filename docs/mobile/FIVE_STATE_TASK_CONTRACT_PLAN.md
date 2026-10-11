# Five-state task contract preparation (not activated)

Preparation baseline: f0b0c25150b515665ec5a9efb5e41ae29d015bad.
Phase 1 implementation baseline: d8a6b80750b7df8b43a7f8f31fa61db72ad14308,
which contains merged PR #172. Its merge/history are unchanged.

The shared-types source defines To Do, In Progress, Waiting, Review,
Done and precisely six approved edges. Web/shared/Mobile domain types now alias
the same contract. Readers consume safe labels for five states and unknowns.
Waiting is an external-dependency branch; Review is acceptance
pending. Done has no outgoing ordinary transition. Self transitions are not
transitions; future non-status edits must preserve status and use normal RLS.

Status and progress are independent. Transition preparation preserves the
stored integer percentage, including 15/80 historical values, 100 during review
and 100 on acceptance. No automatic percentage increase/decrease or historical
conversion occurs. Actual execution estimates require an explicit separate edit.
This preparation does not require 100 as a precondition for acceptance; an
additional invariant would require separate approval and legacy compatibility.

Authorization inputs must come from a trusted authenticated boundary. Active
membership, legitimate update permission, matching tenant and matching creator
remain mandatory. An owner cannot approve another creator's task merely because
they are owner. Future reviewer assignment requires separately designed backend
authorization and explicit approval; it is not present in this contract.

## Proposed additive SQL — documentation only, DO NOT EXECUTE

```sql
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'Review' BEFORE 'Done';
```

Verify live type/schema/version and migration history first. Create an approved
tracked migration only after separate authorization. Commit enum expansion
before any statement uses Review. No UPDATE, rename, row conversion, RLS change
or historical progress migration is proposed. Reconcile bootstrap schema/type
generation with the live enum under that future migration scope.

Rollback retains the additive value. Disable new transitions and roll back to
five-state-tolerant readers; do not remove Review or convert existing rows.

## Enforcement comparison and recommendation

Recommend database-level validation as the common invariant boundary, because
Mobile currently writes directly to Supabase and Web uses the workspace API.
An authenticated server-only service without restricting other write paths
cannot guarantee enforcement. Preserve RLS and creator restrictions; no service
role or SECURITY DEFINER bypass is needed for transition validation.

A reviewed BEFORE UPDATE validator can compare OLD/NEW statuses for every
writer, allow unchanged status for ordinary edits, and reject non-graph edges.
It must not fabricate progress. Inserts should default to To Do; creation with
another status needs an explicit policy decision before enforcement activation.
Existing rows are grandfathered, not rewritten. Audit successful transitions
with tenant/task/actor/old/new/time inside the transaction. Record blocking/rework
reasons through a separately approved data contract. No trigger is installed now.

Use compare-and-swap filters (id, tenant, creator, expected status, expected
updated_at) in both future clients/server. Zero matched rows means conflict,
not success; refresh and ask the user, never blindly retry. A trigger alone does
not capture a client's stale expected version. The pure preparation tests check
the planned expectation; real atomic concurrency tests remain necessary.

Future notifications must be scoped to authorized recipients, deduplicated and
emitted only on committed transitions; no notifications are added now. Repair
the existing activity service's missing tenant identity within separately
approved implementation scope. Failure messages must remain sanitized and must
not invalidate otherwise valid organization context (PR #172).

## Ordering and approval gates

1. Review/approve this compatibility draft; PR #172 was merged separately.
2. Implement tolerant readers/labels/filters for all five states and unknown
   values. Do not silently reinterpret Waiting or hide its records.
3. Separately approve, apply and commit the additive enum migration; verify rows
   and RLS unchanged and API schema compatibility before enabling Review writes.
4. Implement Web and Android actions, permission checks and CAS expectations.
   Old Android builds lack Waiting handling and CAS; do not assume compatibility.
5. Test real PostgreSQL/RLS, rollback and old-client behavior in an isolated
   environment. Activate database enforcement only after explicit rollout
   approval and supported-writer compatibility. Reject unsupported old requests
   safely; never bypass enforcement to preserve an obsolete workflow.
6. Separate authorization for EAS preview, then emulator and physical E2E.

The new tests execute pure production contract functions, not a backend mock
that accepts arbitrary statuses. They are not claimed to prove live database
enum parity, real RLS enforcement or atomic concurrency. Those integration gates
are deferred until authorized database preparation. The live enum still lacks
Review; no production five-state compatibility PASS is claimed.

## Phase 1 compatibility gates

TASK_WORKFLOW_WRITES_ENABLED remains false. Existing To Do/In Progress/Done Web
write behavior remains compatible; new Waiting writes and all Review writes are
rejected by both UI/service and authenticated workspace API before database I/O.
An existing Waiting row can keep Waiting while other fields are edited. Unknown
existing states cannot be silently rewritten during editing. This is rollout
gating, not activation of the new state machine. Android only exposes the existing
To Do start action, preserving its stored percentage; no Review/Waiting workflow
buttons are activated. Web no longer fabricates 100 when status changes to Done.
Actual progress edits remain explicit. No historical percentages are changed.

Supabase bootstrap schema now accepts all five values; it is not executed.
Two review-only SQL candidates live under docs/database, not supabase/migrations.
The enforcement candidate uses invoker functions, current tenant permission and
creator checks, row locking, transaction-local expected state/version validation,
and sanitized conflict/error identifiers. RLS policies are untouched. It rejects
old direct status writers without the expected-state protocol; upgrade/verify all
supported writers before any activation. The GUC expectations are not credentials
and never substitute for auth/RLS. Trigger and RPC must be installed atomically
after enum expansion commits. The private timestamp trigger ordering, privileges,
API exposure, direct-write rejection and CAS races require real DB validation.

Blocking/rework reason persistence, insert-state policy and committed audit/
notification integration remain activation prerequisites; no implied schema or
permission expansion is included. No blind retries are implemented. Rollback
disables workflow writes but retains five-state-tolerant readers and enum values.

React review: no new data-fetch effects, subscriptions or component dependencies;
status labels are pure shared functions. Existing RTL/branding/styles remain.
Native task action visibility is gated; no decorative identity changes are made.

## Phase 1 local validation and evidence limits

- Full suite: 279/279 PASS, including 34 contract tests, 8 compatibility tests
  and existing organization/App regression coverage with two new Mobile guard tests.
- Web/Mobile TypeScript PASS; lint 0 errors / 19 existing warnings.
- Expo Doctor 21/21 PASS; Web production audit zero vulnerabilities;
  Mobile production audit PASS under unchanged exact exceptions (2026-10-16 expiry).
- Preservation hashes verified against all three original backup artifacts
  before implementation; modifications now intentionally integrate that preparation.
- Web compatibility tests verify shared helpers and source wiring/server guards;
  Android tests execute task/search/timeline components and mutation services.
  No new authenticated browser/device E2E or live PostgreSQL test is claimed.
- No manifests/lockfiles, branding, app identity, backend, signing, RLS,
  production records or PR #172 history changed.

Next approval: review/merge compatibility separately, authorize isolated real
PostgreSQL testing, then migration/rollout and enforcement activation only after
their own gates. EAS and physical testing require later separate authorization.
