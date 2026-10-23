# Batch 2: reliable project workflows

Local work on `codex/five-state-task-compatibility`, HEAD `4eddecd4134e407fc6f697f1532465caf0e7095d`. Batch 1 changes remain uncommitted and preserved. No remote rollout, workflow activation, commit or deployment is authorized or performed.

## Product implementation

- Web project workspace opens its tasks, prefills the correct project when creating a task, and remains underneath the task dialog for return navigation. Notes open their linked task and linked file. File retrieval opens separately, preserving the project. Finding task links target a scoped project/task destination; inaccessible targets receive feedback. Archived tasks opened from project links are read only.
- Mobile keeps its companion scope: open a project, inspect related tasks, create a preselected project task, open/edit a supported task and return to the project. Finding links open existing accessible tasks. Organization/account changes clear originating-project state. Files/notes management remains Web-only; no native file manager or CAD editor was added.
- Safe conversions use one RPC, without a multi-request fallback. Missing reviewed functions fail closed with upgrade feedback. Response confirmation checks task ID, actor, organization and project.
- Note creation uses a stable draft ID and one transactional RPC. Retrying the same draft returns the original note and creates no second audit event; changed inputs with the same ID conflict rather than silently replacing data.

## Local SQL candidate

`docs/database/proposed-project-workflows.sql` is a review candidate, not an activated migration. It adds nullable `project_notes.task_id` and `project_files.content_sha256`, an index for durable upload retry identity, source revision triggers, reference/history guards, conversion audit protection, and two RLS-preserving transaction functions. No historical row is backfilled or relinked; no new task, note or review status is invented.

Conversion locks the project and source (and review for findings), verifies authenticated creator, tenant, project, current permissions and source version, inserts one To Do task, links/completes the source and inserts an immutable audit event in the same transaction. Repeated/concurrent requests return the existing link, including after a lost response. Failure anywhere rolls back. Existing task CAS/status/archive/notification policies remain unchanged. Source links cannot be detached or rewritten and converted sources cannot be physically deleted through this contract.

Project history prevents physical project deletion when tasks (including archived), files, notes, legacy/new drawings, finance or project audit exist. The private history trigger is deliberately SECURITY DEFINER solely to veto deletion even when legacy child RLS hides a row; it checks current delete permission, uses an empty search_path, exposes no data and has no direct application execute grant. Other new functions are SECURITY INVOKER. No project archive flag exists; On Hold is not presented as archival.

## Storage recovery

The existing file schema has no upload-state column. Pending/failed/completed are explicit recovery-receipt states in account/organization-scoped local storage, not invented database states. The durable file row and SHA-256 retry identity are registered before any bytes are sent. A restrictive Storage insert policy requires that reference. New upload retries reuse the original row/path and never blindly upsert or automatically delete an ambiguous object. A failed/duplicate upload is considered complete only after downloading and hashing the actual bytes. Same-name/same-content new uploads can recover from the durable record even if the local receipt was lost.

Incomplete references remain visible and the UI asks the user to reselect the same file. Storage permission must be available to retain a local receipt before dispatch. File bytes are not persisted in browser storage. Canonical server identity replaces losing concurrent local receipts, so a completed retry does not leave a false pending indicator. Physical file/drawing deletion is withheld in the Web services pending an approved retention/recovery policy; removing bytes before a protected metadata cascade could otherwise lose source data. A focused test proves drawing deletion dispatches no removal. Existing deployed Storage deletion permissions are not widened or remotely changed.

Download preparation renders a user-clickable signed download link, avoiding reliance on delayed popups and preserving the originating project. Existing Storage policy still restricts object access to the uploader path; broader teammate sharing is not silently granted. Large/resumable uploads, storage-process crashes and retention cleanup are outside the exercised fixture scenarios.

Historical files have no checksum and are not automatically reclassified or deduplicated. Historical notes already marked done without task links are not guessed or backfilled. Existing ambiguous legacy conversions require reconciliation from actual history. An already accepted request can commit in its original tenant after switching; Batch 1 guards suppress its result and follow-up requests rather than retrying it into another tenant.

## Historical engineering constraint

The complete historical manifest creates both `drawing_assets` and `architectural_drawings`. Its review FK targets the former while later tenant checks/findings target the latter; reviews also require engine_version/disclaimer and do not accept the later UI's `completed` status. Conversion preserves analysis status and the test fixture deliberately supplies both drawing records with the same synthetic ID. This validates conversion of a valid existing source, not fresh analyzer ingestion or every historical engineering installation. The legacy decision-completion helpers still require a separate reconciliation; this batch does not rewrite historical FKs or claim the analyzer pipeline passes.

## Rollout and recovery boundary

Schema-dependent operations require separate review/application authorization before any non-local use. Clients fail closed without the candidate. Rehearsal uses only fixed disposable local containers and synthetic users. The candidate is re-applied to verify idempotent DDL. On incident, stop/revoke the new RPCs and retain new columns, links, checksums and audit; do not drop them or delete linked tasks/files to roll back. Reconcile before restoring writes. No workflow activation is part of this candidate.

Roll out upgraded conversion clients before enforcing the candidate remotely. An old multi-request converter's first standalone To Do insert is indistinguishable from legitimate task creation; a subsequent rejected source-link write cannot roll that earlier request back. This batch cannot prove old-client conversion safety without a capability/version enforcement decision covering all task creators. No remote activation is performed. Source titles longer than the task contract's 160 characters are rejected without truncation; historical oversized sources and unlinked legacy partial conversions require explicit reconciliation.

## Evidence

Validation evidence stays in ignored `.git/basoul-local/`:

- `batch2-tests-complete.log`: 347/347 repository tests, no skipped tests. This includes focused recovery/receipt/conversion/retention tests and 60 Mobile tests; `batch2-mobile-tests-final.log` separately records 60/60.
- `batch2-quality-complete.log`: quality:all exit 0, Web/Mobile TypeScript, zero lint errors (19 existing warnings), release/YVL/foundation/accessibility gates, build/bundle budgets, Expo Doctor 21/21. After the last Web recovery-receipt and feedback adjustments, repository tests passed 347/347 again; `batch2-build-complete.log` records final production build exit 0 (including TypeScript/static generation), `batch2-bundle-complete.log` records all bundle budgets passing, and `batch2-lint-complete.log` records the final touched-code lint exit 0. Existing Pascal import.meta compilation warnings remain.
- `batch2-integration-download-final.log`: real isolated Auth/PostgREST/Storage and actual Chrome E2E passed. Covers concurrent/idempotent note conversion, finding conversion/retry, note draft retry/audit, source CAS, unauthorized/cross-tenant and wrong-project references, immutable links/audit, injected audit failure with transaction rollback/recovery, protected project history including a hidden legacy child, content-identity duplicate rejection, unregistered object rejection, binary upload/download/sign, foreign access denial, and the Batch 1 switching regression.
- Actual project browser E2E passed task project prefill/create/open/return, an aborted upload followed by safe same-file recovery, note create/convert/open/return, and a real signed download whose bytes were read and compared while the project stayed visible.
- Nonempty historical note upgrade retained its exact old timestamp and null task link; applying the candidate twice succeeded. No historical FK/status normalization was attempted.
- Docker Desktop briefly became unavailable after a successful run. Safe startup of its existing installation restored the engine; the complete isolated integration then passed again. No reset, cleanup or image/volume deletion occurred. Storage uses a retained dedicated container and all five fixture services were stopped after testing.

Not executed: actual Android native UI E2E for these new project screens, production/staging integration, provider/analyzer ingestion E2E, large/resumable uploads or Storage-process crash recovery. Existing Android 15 HIGH / 7 MODERATE and Web tooling five HIGH baseline findings are unchanged and were not re-audited in this feature batch; no dependencies or security exceptions were changed. No release approval is implied.

Review found no embedded private key, privileged token or credential-bearing real connection URL in the project changes. Synthetic credentials stay in the local fixture; access tokens are not logged. React review checked unconditional hooks, scoped state reset, accessible action labels and existing YVL tokens. `git diff --check` passed. Index remains empty; baseline HEAD/branch, error.log, AGENTS.md, CLAUDE.md, product roadmap and Batch 1 report are preserved. Exact Batch 2 inventory below excludes all pre-existing unrelated files and ignored diagnostics.

Storage configuration references: [official self-hosted Compose](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control). The local fixture pins `supabase/storage-api:v1.81.0`, uses a filesystem tmpfs, an internal Docker network, no host ports or mounts, and real Auth/PostgREST/Storage services. Standard empty-database bootstrap grants are local fixture setup; RLS is retained.

## Exact Batch 2 inventory (24 files)

- `app/api/workspace/[resource]/route.ts`
- `app/page.tsx`
- `docs/database/proposed-project-workflows.sql`
- `docs/operations/BATCH_2_PROJECT_WORKFLOWS.md`
- `features/architecture/pdf-image-review-view-source.tsx`
- `lib/architecture/drawing-service.ts`
- `lib/architecture/review-service.ts`
- `lib/projects/file-recovery.ts`
- `lib/projects/project-file-service.ts`
- `lib/projects/project-note-service.ts`
- `mobile/App.tsx`
- `mobile/src/features/architecture/architecture-review-screen.tsx`
- `mobile/src/features/create/CreateTaskScreen.tsx`
- `mobile/src/features/projects/ProjectsScreen.tsx`
- `mobile/src/services/workspace.ts`
- `mobile/src/types/domain.ts`
- `packages/shared-types/src/project-conversion.ts`
- `scripts/project-storage-fixture.mjs`
- `scripts/task-fixture-gateway.mjs`
- `scripts/validate-organization-local.mjs`
- `scripts/validate-project-workflows-local.mjs`
- `scripts/validate-task-http-local.mjs`
- `tests/project-file-upload-integrity.test.mjs`
- `tests/project-workflow-recovery.test.mjs`
