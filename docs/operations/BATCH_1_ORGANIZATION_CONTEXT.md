# Batch 1: active organization context

Baseline: `4eddecd4134e407fc6f697f1532465caf0e7095d`, branch `codex/five-state-task-compatibility`.
Local implementation review: 2026-10-21. No commit, remote operation, schema rollout or workflow activation is included.

## Implemented contract

An operation captures user, organization and a selection generation. Selection changes invalidate the generation synchronously. Returning A → B → A never restores an old operation. Memberships are verified from the authenticated account; persisted organization IDs are preferences, never authority. Requests and results check the captured generation. Writes are never automatically replayed.

Web has one root provider and a shared external store. Switching unmounts protected forms and local state, and remounts them only after verification. The existing Home selector and dedicated-route selector use the same contract. Loading, verification failure and revoked membership block protected operations with Arabic/English feedback. Shared Pascal scene state is cleared on unmount.

The existing Web SDK services capture a scoped client: tenant filters, payload/reference checks, current identity and membership checks before writes, and stale-result rejection. HTTP calls explicitly carry the selected organization. The server rejects absent or unauthorized organization context rather than selecting the first membership. Project/client references are checked within the selected tenant. Missing update/delete targets fail rather than reporting success. RLS and existing task authorization, CAS, archive and audit contracts remain authoritative.

Mobile's existing organization store now binds selected contexts to the selection generation. The service SDK boundary checks the generation before dispatch and after resolution. Existing record, identity, membership and role checks are preserved. Task edit/archive/transition inputs reject an explicitly foreign task identity. Existing operation handling suppresses stale results and reports organization changes bilingually.

## Covered surfaces

- Web projects, tasks, clients, content, knowledge, finance, activity and notifications through repository/HTTP boundaries and Home operation leases.
- Web project files/notes; drawing, review, comments and plan-understanding services; architecture persistence and CAD submission.
- Web organization administration and organization profile settings.
- Mobile's existing workspace, task and organization services. This batch does not add missing Mobile management screens.

## Boundaries and remaining gaps

- A request already accepted by the server may commit to its original authorized organization. Switching suppresses its result and follow-up operations; it cannot undo a committed transaction. Multi-step file/record conversions remain non-atomic. Interrupted uploads may require later orphan reconciliation.
- Invitation acceptance/onboarding are authenticated bootstrap flows outside an active tenant. Personal profile actions remain account scoped.
- Mobile UI selections carry a generation. Existing headless callers constructing static contexts without the optional capability retain their existing service validation; they cannot claim UI selection invalidation.
- The scoped SDK covers the currently used surfaces, not arbitrary future SDK methods. New service paths must use the organization boundary and add focused coverage.
- Real Storage uploads/removal/signed URLs and deployed Edge Functions were not exercised by the isolated Auth/PostgREST fixture. Their dispatch guards have focused unit coverage.
- No actual Android emulator organization-switching UI test was run in this batch. Service/store tests and Mobile quality checks do not substitute for native E2E.
- No dependency or security-exception changes. Existing Android advisory release blockers remain; local success is not release authorization.

## Validation and inventory

Node 22.13.1: `npm run quality:all` completed with exit 0. 334/334 repository tests, including 60/60 focused Mobile tests; Web/Mobile TypeScript; lint (zero errors; 19 existing warnings); release consistency, YVL, foundation and accessibility gates; production build/static generation and bundle budgets; Expo Doctor 21/21. Existing Pascal import.meta build warning remains. Final HTTP/browser results are recorded below after completion. Evidence: `.git/basoul-local/batch1-quality-final.log`, `batch1-mobile-tests-final.log`. Diagnostic logs and browser artifacts remain under ignored `.git/basoul-local/`. Existing `error.log`, `AGENTS.md`, `CLAUDE.md` and the product roadmap are excluded from this batch.

Review found no SQL/migration, dependency/lockfile or security-exception edits. Pattern scanning found no embedded private keys, privileged tokens or credential-bearing connection URLs in Batch 1 project files. Local fixture credentials are synthetic and tokens are obtained at runtime without logging. The React review checked unconditional hooks, subscription cleanup, generation-keyed state reset, labeled organization selectors and live status feedback; existing design tokens and architecture were retained.

Final isolated integration (`node scripts/validate-task-http-local.mjs --organization`) completed with exit 0, evidence `.git/basoul-local/batch1-integration-final.log`:

- Restored the synthetic historical Auth/PostgREST fixture. Workflow activation count stayed zero throughout.
- Verified authenticated account-only organization discovery and unauthenticated rejection; explicit workspace organization required; unknown membership rejected.
- Owner A / Viewer B reads stayed isolated. Viewer creation and foreign references/edit/delete were rejected. Authorized project create/edit/delete succeeded.
- Task field edit succeeded, stale CAS returned 409, physical deletion returned 409, archive succeeded with exactly one archive audit event.
- Actual Chrome browser login: switching closed A's project wizard; B data excluded A; a delayed B response could not replace A after switching back; architecture retained B; organization settings denied Viewer B without displaying A's profile. No page runtime errors.
- Browser, temporary Next server/gateway and all four fixture containers stopped. No image/volume cleanup or remote environment used.

Final preservation checks: branch and baseline HEAD unchanged; index empty. SHA256 hashes of `error.log`, `AGENTS.md` and `CLAUDE.md` matched their original values. `git diff --check` passed. Inventory below contains 45 project files (36 tracked modifications, nine new files including this report); the four pre-existing untracked files are excluded. No commit or remote operation occurred.

## Next development batch

Complete reliable project-to-task/file/note journeys, including interrupted multi-step operation reconciliation and missing Mobile management flows. First add actual native organization-switching E2E and real local Storage/Edge Function fixtures for this boundary. Preserve the disabled rollout gate until separately authorized release prerequisites are met.

### Exact Batch 1 project inventory (45 files)

- `app/api/platform/organizations/route.ts`
- `app/api/workspace/[resource]/route.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `components/organizations/organization-provider.tsx`
- `docs/operations/BATCH_1_ORGANIZATION_CONTEXT.md`
- `features/architecture/architecture-persistence-client.ts`
- `features/architecture/cad-review-panel.tsx`
- `features/architecture/pascal-runtime-viewer.tsx`
- `lib/architecture/drawing-service.ts`
- `lib/architecture/plan-understanding-service.ts`
- `lib/architecture/review-comment-service.ts`
- `lib/architecture/review-service.ts`
- `lib/auth/authorized-workspace.ts`
- `lib/data/authorized-workspace-client.ts`
- `lib/data/os-repository.ts`
- `lib/data/task-transition-client.ts`
- `lib/data/workspace-service.ts`
- `lib/events/activity-service.ts`
- `lib/notifications/notification-service.ts`
- `lib/organizations/active-context.ts`
- `lib/organizations/administration.ts`
- `lib/organizations/request.ts`
- `lib/organizations/scoped-client.ts`
- `lib/organizations/settings.ts`
- `lib/projects/project-file-service.ts`
- `lib/projects/project-note-service.ts`
- `mobile/src/organizations/context.ts`
- `mobile/src/organizations/operation.ts`
- `mobile/src/organizations/OrganizationBar.tsx`
- `mobile/src/services/organizations.ts`
- `mobile/src/services/task-edits.ts`
- `mobile/src/services/task-transitions.ts`
- `mobile/src/services/workspace.ts`
- `packages/services/src/organization-guard.ts`
- `packages/shared-types/src/organization-scope.ts`
- `scripts/validate-organization-local.mjs`
- `scripts/validate-task-http-local.mjs`
- `tests/mobile-organization-context.test.mjs`
- `tests/mobile-task-edit.test.mjs`
- `tests/organization-foundation.test.mjs`
- `tests/organization-scope.test.mjs`
- `tests/rls-write-boundary.test.mjs`
- `tests/task-transition-confirmation.test.mjs`
- `tests/tenant-owner-onboarding.test.mjs`
