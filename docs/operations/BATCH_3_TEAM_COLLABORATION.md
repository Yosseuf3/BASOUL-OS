# Batch 3: team collaboration and compatibility

Local review date: 2026-10-21. Baseline `4eddecd4134e407fc6f697f1532465caf0e7095d`, branch `codex/five-state-task-compatibility`. Batch 1/2 changes remain uncommitted and preserved. This is a partial delivery report, not release approval or a claim that every Batch 3 journey is complete.

## Implemented

- Edge administration now explicitly permits only active owner/admin roles. Unknown strings, prototype names, missing roles and inactive memberships fail closed. Invitation creation/revocation still uses the existing owner-only SQL authority.
- Administration listing uses a caller-authorized SQL RPC instead of a privileged table read after a separate membership request. Its candidate function explicitly authenticates and restricts roles and organization. Missing RPC returns bilingual server-update guidance; there is no unsafe fallback. Deploying this Edge change requires installing the reviewed candidate first.
- Invitation acceptance keeps the existing account-level API, validates a confirmed email against `auth.users`, checks attached identity, expires old invitations, locks the same invitation row used by revocation, and does not overwrite an already active membership's role. Repeated acceptance returns zero.
- Acceptance, membership activation, the existing `membership_changed` audit action (metadata event `invitation_accepted`), and the inviter's inbox item commit atomically. A notification insert failure rolls the transaction back. A retry accepts the same pending invitation without duplicate accepted events. Only a different, currently active owner who originally invited the user receives the bilingual system notification; recipient RLS still denies access after membership loss. No external email is sent by the local tests.
- Web acceptance confirms the response count and authenticated account before reporting success. Ambiguous delivery or a switched account requires membership refresh.
- Web/Mobile finding decisions require an opaque `updated_at` version and constrain review ID, actor, tenant and mutable source status. Converted sources cannot be overwritten through this path. Decisions preserve the review's analysis status, removing the unsupported follow-up `completed` write and its partial-success failure. Existing atomic source-to-task conversion remains in place.

`docs/database/proposed-team-collaboration.sql` is a local review candidate, outside the migration ledger. It changes functions only, does not rewrite historical records, and revokes PUBLIC/anon execution. SECURITY DEFINER is retained/used only for the existing private invitation/admin boundaries: caller verification, role/identity checks and fixed search path are explicit. Direct invitation-table privileges remain unchanged. It must not be applied remotely without the separate rollout review.

## Coverage and limits

| Area | Local evidence / remaining limit |
| --- | --- |
| Team membership | Isolated Auth/PostgREST tests cover owner invite, repeated draft ID, wrong identity attachment, confirmed accept/retry, viewer read/write denial, role change, member note/task conversion and revoked JWT access. Extended expiry/unverified/transaction rollback tests are in the fixture. Final execution results are recorded below. |
| Organization/project access | Existing two-organization owner/viewer HTTP and browser tests retained; no broader write/file permissions introduced. |
| Files/notes | Existing real Storage upload/download/sign/retry/reference tests retained. Member-created notes/conversions use the existing authorization contract. Storage remains uploader-scoped; shared team download is not invented. |
| Notifications | Acceptance inbox delivery is transactional and bilingual. Task-transition creator-only/actor-exclusion policy remains unchanged and its activation remains OFF. Membership notification source links and delivery to a not-yet-member invitee are not implemented; inbox system cards currently lack an administration deep link. |
| Legacy clients | Existing transition/edit/conversion upgrade failures remain. Historical standalone task creation followed by an old conversion link write can still leave an orphan task: the database cannot identify that first insert as conversion intent. No unsafe fallback was added. A version/capability rollout across all task writers is still required to close this gap. |
| Engineering | Finding decisions/conversion preserve the real analysis lifecycle. Historical `drawing_assets` versus `architectural_drawings` foreign keys, required engine/disclaimer fields and missing review timestamp columns remain incompatible for analyzer ingestion. Conversion fixtures deliberately supply matching drawing records; this is not an analyzer/provider E2E. No historical FK was dropped or data remapped. |
| Native | A dedicated read-only API35 emulator was started; it had not completed boot during the attempt and was stopped. No Batch 3 native UI workflow was executed. Prior native task E2E is not evidence for these new flows. |
| Edge/email | SQL RPCs and pure Edge authorization logic are tested. The deployed Deno Edge Runtime and actual invitation email delivery are not exercised. No production/staging access. |

## Validation record

- Focused Web/Edge authorization/acceptance plus Mobile organization tests pass locally.
- Repository tests: 354 passed, zero failed in `batch3-regression-final.log`; the six focused team tests include execution of the transpiled production Edge handler with mocked SDK transport, not a deployed Deno runtime.
- Mobile test subset: 61/61. Web/Mobile TypeScript, full quality command, production build, bundle budgets and Expo Doctor 21/21 pass in `batch3-quality-final.log` (exit zero). Whole-repository lint has zero errors / 19 existing warnings. Mobile and Edge paths are excluded by the repository ESLint configuration; no lint coverage is claimed for ignored files.
- Final `batch3-integration-verified.log` exits zero: full historical manifest, nonempty note upgrade, repeat application of both candidates, authenticated project/source CAS/conversion/history tests, real Storage and actual Chrome organization/project journeys pass with workflow activation OFF. Team RPC tests also pass: expiry, wrong identity, unverified-email rejection, owner-only listing, private acceptance inbox, injected notification failure with complete acceptance/audit/membership rollback, explicit retry, revocation and post-revocation access denial. Invitation UI/email delivery is not browser-tested; browser coverage is the existing two-organization/project journey.
- An initial build failed because public Supabase build variables were absent. The repeated quality command uses only loopback `http://127.0.0.1:35439` and a synthetic public key, never production credentials.
- An initial candidate rehearsal rejected an unsupported audit action. The candidate now uses the existing `membership_changed` action with typed event metadata; no audit CHECK constraint was widened.
- Ignored diagnostic logs are under `.git/basoul-local/`; temporary services are stopped by the fixture's finally block.
- Existing Android 15 HIGH / 7 MODERATE and Web tooling five HIGH baseline findings remain visible. This batch does not change dependencies or extend exceptions; no new dependency audit is claimed.

## Exact Batch 3 inventory

These files changed relative to `.git/basoul-local/batch3-start-hashes.json`; overlapping Batch 1/2 edits are preserved.

1. `docs/database/proposed-team-collaboration.sql`
2. `docs/operations/BATCH_3_TEAM_COLLABORATION.md`
3. `lib/architecture/review-service.ts`
4. `lib/organizations/administration.ts`
5. `mobile/src/services/workspace.ts`
6. `packages/shared-types/src/finding-decision.ts`
7. `scripts/validate-project-workflows-local.mjs`
8. `scripts/validate-task-http-local.mjs`
9. `scripts/validate-team-collaboration-local.mjs`
10. `supabase/functions/organization-admin/authorization.ts`
11. `supabase/functions/organization-admin/index.ts`
12. `tests/mobile-organization-context.test.mjs`
13. `tests/team-collaboration.test.mjs`

No commit or staging is included. `error.log`, AGENTS.md, CLAUDE.md and unrelated untracked files are excluded from this inventory.

Final review: all 13 files scanned for embedded private keys, privileged credential literals and JWTs, with zero pattern hits; code review found no embedded production credentials. `git diff --check` passes. The start-snapshot hashes of error.log, AGENTS.md, CLAUDE.md, roadmap and Batch 1/2 reports remain unchanged. No remote operations, dependency changes, migration-ledger edits or workflow activation were performed.

## Next development priority

Finish the remaining compatibility contract and engineering-history mapping before claiming Batch 3 complete. Define/version safe task creation/conversion intent for all legacy writers; choose a canonical engineering graph with a non-destructive historical mapping rehearsal; add authorized membership/project notification source links and test the actual Edge invitation/email boundary with a local mail sink. Team Storage sharing requires an explicit authorized access contract, not a broad policy change. Complete Batch 3 native E2E on a booted compatible local runtime. Remote rollout, workflow activation and release authorization remain separate.
