# Production-shaped hardening proposal

Baseline: d3ccab33b43e2153802124fb5f5b61cd823f66d5. Review only;
production enforcement and workflow flags remain disabled. No live migration.

## Read-only findings (2026-10-12)

Canonical project okghyypmkymxvtsuvdvb: PostgreSQL 17, enum task_status with
To Do/In Progress/Waiting/Done. Two existing tasks: In Progress; no null status,
progress or updated_at. Production nevertheless permits null progress/updated_at.
Task and activity RLS is enabled and forced. Tasks UPDATE USING checks tenant
update permission; WITH CHECK adds creator identity. The candidate trigger checks
both OLD/NEW creator and unchanged tenant, closing direct creator takeover while
preserving the existing policies. No owner cross-creator approval is granted.

Dangerous effective grants are direct postgres grants to authenticated, not role
inheritance (neither anon nor authenticated has parent-role membership). Tasks and
activity_events grant TRUNCATE, TRIGGER, REFERENCES and MAINTAIN as well as DML.
Anon has no effective table DML or these dangerous privileges. Public/auth/private
schemas grant USAGE, not CREATE, to application roles. Private member_role and
has_permission are existing SECURITY DEFINER functions with empty search paths,
explicit authenticated EXECUTE, and auth.uid()/active membership authorization.
Private role_rank is not directly executable by authenticated. Public
set_updated_at is invoker and publicly executable but returns a trigger, not a
general status-writing endpoint. Existing public administrative DEFINER functions
have explicit authenticated/service-role grants, not anon grants. The private
protect_last_owner trigger function has default PUBLIC EXECUTE; its private
schema remains inaccessible to anon. Separate IAM review is warranted; these
unrelated functions are unchanged by this proposal.

Future public tables inherit broad privileges from postgres/supabase_admin
default ACLs, including anon/authenticated. Future public functions similarly
receive broad EXECUTE defaults. Catalog ACLs establish current grantor/source,
not the historical command that produced each ACL. This focused proposal revokes
dangerous privileges only on tasks/activity; global default-ACL changes would
affect unrelated future modules and need separate authorization and migration
owner coverage. Every future replacement of these tables needs a grants gate.
Service-role/owner privileges are unchanged; they are not application actors.

## CAS decision

No BIGINT is necessary for the current timestamp protocol when all prerequisites
hold: NOT NULL, opaque microsecond precision, monotonic advancement on all edits,
row locking, expected old status and timestamp, and no trigger bypass. Version
initialization is the existing stored timestamp, unchanged. Hardening refuses
null historical versions before SET NOT NULL; it never backfills or converts
historical progress. Existing rows/timestamps are hash-checked unchanged during
installation. Future edits advance by greatest(clock_timestamp(), OLD+1us),
including same-transaction edits and spoofed timestamp inputs. Generic timestamp
trigger sorts before the validation trigger. This protects status transitions
against intervening edits, not every generic field edit against lost updates.
If exact precision, trigger ordering or privileged writer guarantees cannot be
maintained, revisit BIGINT in a separately reviewed additive protocol migration.

## Audit protection

The transactional task AFTER UPDATE trigger marks generated transition events
with reserved metadata key _basoul_task_transition. A narrowly scoped invoker
activity trigger rejects edits/deletes of marked events and forged marked
inserts. The legitimate nested producer must match authenticated actor, tenant,
transaction CAS context and resulting task state. No SECURITY DEFINER or new RLS
policy is introduced. Existing unrelated activity INSERT/UPDATE/DELETE remains
available under existing policies. Application roles cannot truncate audit data
or attach substitute triggers. Database owners remain privileged; this is not
tamper-proof storage against administrators. Pre-existing unmarked historical
activity is not retrospectively certified as immutable transition audit.

## Validation and rollout gates

Fresh/upgrade PostgreSQL fixtures reproduce production nullable columns, broad
table grants, forced RLS and application schema CREATE denial. They verify
unchanged rows/policies, null-preflight rollback, six allowed/nineteen rejected
transitions, direct legacy rejection, creator/viewer/tenant negatives, stale CAS,
row-lock concurrency, audit atomicity and grant/append-only negative tests.
The real isolated GoTrue/PostgREST runner additionally checks issued JWTs,
concurrent RPC HTTP conflicts, audit PATCH/DELETE/forgery denial and unrelated
project reads. This is backend integration, not browser/APK E2E certification.

Order: compatible readers; committed Review enum; authorized atomic hardening
and enforcement installation; PostgREST schema reload/verification; compatible
Web/Android availability and explicit workflow activation. The candidate files
remain outside auto-applied migrations. Use bounded lock waits; SET NOT NULL may
scan/lock tasks but does not rewrite data. Validate production grants immediately
before rollout. Do not ship enforcement while legacy writers lack an approved
upgrade policy. Rollback cannot simply remove Review; keep additive schema and
disable UI workflow only under a reviewed plan, never restore unsafe grants or
remove server validation as an ad-hoc client bypass.

Next authorization: review local diff and test evidence, then separately authorize
commit/push. Production migration, default-grant/IAM remediation, merge and APK
build remain separately gated. No production changes are part of this work.
