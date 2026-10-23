# Batch 3 completion and Web release candidate review

Local review: 2026-10-22. Repository `E:\Codex\Repos\BASOUL-OS`; baseline `4eddecd4134e407fc6f697f1532465caf0e7095d`, branch `codex/five-state-task-compatibility`. This report supplements the roadmap and Batch 1/2/3 reports without overwriting their evidence. No commit, staging, remote migration, deployment or workflow activation is included.

## Decision

**Web RC is not approved for release.** Local product hardening is implemented; the final validation results below distinguish verified flows from outstanding contracts and operational approvals. Android remains blocked by HIGH advisories independently of Web.

## Legacy conversion protection

All current Finding/Note conversion entry points use `convert_project_source_to_task`, retaining source locks, opaque source CAS, idempotent retry, tenant/actor checks and atomic task/source/audit writes. Current task creation transports advertise `x-basoul-task-create-contract: atomic-source-v1`; the database candidate rejects authenticated task INSERTs without that compatibility marker or the transaction-local conversion context. The Next task POST endpoint also rejects an absent marker instead of masking an older caller with the server SDK's marker. Rejection includes bilingual upgrade guidance. Reads are unchanged.

The marker declares a supported client protocol; it is **not an authorization credential**. RLS, current organization/actor checks and existing task guards still authorize every write. A deliberately forged marker cannot grant another tenant's permissions. Older multi-request converters do not advertise this protocol and fail on their first task INSERT, before an orphan task can be created. Legacy `architectural_findings` writes are withheld; their reads/history remain, narrowed by active tenant access. A caller intentionally implementing a new multi-request converter while falsely declaring the supported protocol is not something an HTTP version header can distinguish from ordinary task creation; clients must continue using the atomic RPC.

## Engineering reconciliation

The actual collision is `database/migrations/011_architectural_intelligence_foundation.sql` versus `supabase/migration_v3.0.0_alpha.5.sql` / `alpha.6.sql`:

- Historical reviews reference `drawing_assets`, require engine/disclaimer fields and use processing/ready/failed/archived states. Historical findings also reference that graph.
- Current Web/Mobile review services and `architectural-analyze-v2` use `architectural_drawings` and `architectural_review_findings`. Alpha.6's IF NOT EXISTS does not repair the earlier review table. No active application consumer of legacy finding writes was found in the inspected application/service directories.
- The additive candidate mirrors each new modern PDF/image drawing into a matching legacy asset, in the same INSERT transaction. Identity collisions fail closed; no existing asset is overwritten. Existing review FKs remain intact. An absent legacy table is handled without requiring a destructive FK replacement.
- Missing review timestamp/engine/disclaimer columns are added without rewriting historical values. New producers explicitly supply provenance/disclaimer fields. Historical review states are represented in the clients rather than labeling failures/archives as ready.
- Restrictive legacy tenant policies prevent mirrored metadata remaining readable after membership loss. Existing owner RLS is retained. Legacy asset updates/deletion and legacy finding writes are withheld to preserve history; modern atomic conversion remains the supported write path.

The full historical-manifest upgrade fixture seeds an archived review and converted legacy finding before reconciliation and verifies the original status, provenance, disclaimer and task link after repeat application. Existing legacy-only records are not automatically transformed into modern findings or invented PDF metadata. A production data inventory and an explicitly reviewed legacy-only mapping are still needed before enabling engineering broadly. Analyzer/provider ingestion and CAD gateway/converter corpus coverage are not inferred from database rehearsal.

## Membership notifications

Acceptance, the existing membership_changed audit event and the inviter's bilingual inbox item commit together. A source_kind field identifies membership items. `membership_notification_target` checks the recipient, explicit organization, current owner/admin role and surviving membership before returning a fixed administration target. Web provides a copyable notification URL and rechecks it on opening; Mobile opens its supported read-only administration overview. Stale organization generations cannot navigate a newly selected workspace. Cross-tenant, non-recipient and revoked administrator links fail closed. There is no arbitrary destination URL or self-notification.

Links resolve within the active organization; opening a link in a different workspace does not silently switch tenants. The user must select the authorized organization. Mobile does not gain a member-editor or invitation-management feature.

## File access

The established Storage contract is uploader-only within an authorized project/organization. Tests exercise an owner/uploader, member/uploader, denial to another member or an organization owner who is not the uploader, revocation, signed expiry and cross-tenant rejection. Metadata visibility does not grant byte access. Web gives explicit bilingual feedback for a file not shared with the current account. Signed download lifetime is reduced from ten minutes to sixty seconds.

**Cross-user team sharing is not implemented by broadening the existing policy.** There is no existing file ACL/share-grant contract authorizing it. This remains a product authorization decision and implementation blocker. Existing signed URLs are bearer capabilities until their bounded expiration; membership removal prevents new authenticated reads/signing but cannot retract bytes already downloaded or invalidate every previously issued bearer URL without a different delivery design. No objects or keys were deleted/rotated to simulate revocation.

## Invitation delivery

The local mail fixture runs an SMTP capture process and a second GoTrue listener inside the existing dedicated containers on their internal-only network. It accepts only synthetic.invalid recipients and publishes no port. Actual GoTrue SMTP delivery is exercised with a transient rejection, explicit retry, one captured email, verification-link acceptance and rejection of another invitation after confirmation. The final integration couples this with the existing owner invitation/identity attachment/organization acceptance RPCs. Expiry and duplicate acceptance are covered by the team fixture.

The Edge handler refuses to treat an existing unverified Auth identity as proof of email delivery or attach it on that basis; it returns an explicit delivery-unconfirmed response. This prevents a misleading success after an ambiguous earlier delivery. Provider reconciliation/resend for an ambiguous real delivery still requires operational handling; no exactly-once external inbox promise is made. Deno Edge deployment, external mailbox receipt, SPF/DKIM/DMARC, provider suppression/bounce handling and production credentials are not tested by a local SMTP capture.

## Native and dependency validation

The dedicated API35 emulator and installed Expo Go are used, without an APK/EAS build or workflow activation. The harness uses a unique Auth storage key only for the exact loopback synthetic environment, preserving existing app storage and unrelated sessions. It waits for enabled controls and scrolls inside the actual content viewport. Initial attempts exposed disabled-control/stale-session harness failures; these are not counted as full native PASS. Final native evidence is recorded below.

Expo Doctor initially identified a new SDK 57 patch mismatch: 57.0.30 versus supported 57.0.31. Only Expo 57.0.31 and its lockfile-selected dependencies were installed. Transitives include Expo core/CLI/config patches and the SDK's xcode 4 build-tool dependency; no SDK 58, EAS or iOS build occurred. Dependency listing is valid and Doctor returns 21/21.

Current audits: Web production dependencies **0** findings; Web development/build tooling **5 HIGH** (`eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch`, `braces`). The audit proposes a major downgrade to eslint-config-next 14.2.35, which is not applied to Next 16. Android production audit remains **15 HIGH**, zero moderate after the supported patch. No findings are suppressed and no exception is extended. Full JSON evidence is ignored under `.git/basoul-local/`.

## Validation evidence

- Full repository regression: **359/359 passed**, zero failures, in `completion-quality-current.log`. The Mobile test subset is 61/61; focused team collaboration coverage is 11/11.
- Final `quality:all`: **exit 0** on the final source. Web/Mobile TypeScript, lint (zero errors; 19 existing warnings), production build, bundle budgets and Expo Doctor **21/21** passed. Evidence: `completion-quality-current.log`.
- Final historical/HTTP/Storage/browser integration: **exit 0**, `completion-integration-verified.log`. Covers nonempty historical upgrade and repeat DDL, atomic concurrent/idempotent source conversion, source CAS, injected rollback/recovery, immutable audit/link checks, tenant/role boundaries, real Storage failure/retry/expiry/revocation, team invitations, actual SMTP and browser project/organization journeys.
- Actual GoTrue SMTP failure/retry, one captured synthetic email, verification and coupled organization invitation acceptance passed. This proves local delivery only; external delivery and long-lived Auth token expiry are not claimed.
- Final actual Android emulator execution: **exit 0**, fully automated on final source, `completion-native-current.log`. Authentication, task creation/edit/archive, organization switching, project access, fixture-driven membership revocation and error recovery passed with the workflow OFF. Earlier incomplete attempts are not counted as full PASS. No native invitation/member editor or activated five-state transition coverage is claimed.

The workflow gate remains OFF. No newly activated five-state transition E2E is claimed. Temporary fixture processes/containers are stopped after validation; the pre-existing emulator is preserved.

## Web RC checklist and release order

- [x] Preserve baseline, current branch, existing uncommitted work and error.log; no automatic checkpoint commit.
- [x] Implement compatibility refusal, atomic source conversion and tenant-scoped operation generation guards.
- [x] Prepare additive engineering/team candidates and explicit deployment prerequisites.
- [x] Recheck production versus tooling audit exposure; keep Android HIGH gate visible.
- [x] Finish final fixture results, exact inventory and local credential-pattern review below.
- [ ] Approve either uploader-only pilot file scope or a separately reviewed project/file share-ACL contract. Do not advertise team byte sharing before this is resolved.
- [ ] Inventory real historical engineering variants; rehearse their data snapshot without assuming every drawing has a modern counterpart. Exclude unsupported engineering entry points from any pilot scope.
- [ ] Configure and verify an approved real mail provider, canonical HTTPS origin/redirect allowlist and delivery-failure procedures in an explicitly authorized test environment.
- [ ] Resolve the Web tooling advisories with supported fixes and rerun the security gates; no waiver or exception extension is part of this task.
- [ ] Have operators approve and inventory the migration-ledger entries, deployment configuration, backups and recovery rehearsal. Local SQL candidates are not automatically rollout-ready migrations.
- [ ] Stage task transport/server compatibility before the upgraded clients; the protocol header is restricted to task POSTs and does not change Auth/Storage/Edge CORS; install reviewed database functions/guards before exposing dependent UI. Unsupported old writes remain refused.
- [ ] Run the authorized deployment's browser/Auth/Storage/mail journeys with an isolated organization. Local successes do not approve deployment.
- [ ] Obtain separate activation approval and activated E2E evidence before enabling the five-state workflow for even the test organization. Expand only after pilot acceptance; Android release is a separate gate.

Rollback: pause pilot entry points and dependent writes, preserve the task compatibility/history guards, and return to a compatible reviewed client. Keep additive columns and legacy history; do not drop bridged assets, erase source links, downgrade to an unsafe old converter or delete Storage objects. Rehearse function/client rollback against a retained isolated snapshot and verify counts, actor/tenant access and audit links. Production backup/recovery execution is not authorized here.

## Final inventory and remaining work

All achievable supported local validation is complete. Overall Batch 3 still has the cross-user sharing contract and external/historical coverage limitations stated above. Web RC remains HOLD; Android is separately blocked by 15 HIGH advisories. The report is not a commit authorization.

The following 35 files were added or changed during this completion execution, relative to its starting hash inventory. This is not the entire accumulated Batch 1/2/3 worktree diff and is not a staged checkpoint inventory:


- `app/api/workspace/[resource]/route.ts`
- `app/page.tsx`
- `docs/database/proposed-batch3-completion.sql`
- `docs/database/proposed-project-workflows.sql`
- `docs/database/proposed-team-collaboration.sql`
- `docs/operations/BATCH_3_COMPLETION_AND_WEB_RC.md`
- `features/architecture/pdf-image-review-view-source.tsx`
- `features/notifications/notifications-view.tsx`
- `lib/architecture/review-service.ts`
- `lib/auth/authorized-workspace.ts`
- `lib/notifications/notification-service.ts`
- `lib/organizations/administration.ts`
- `lib/organizations/request.ts`
- `lib/projects/project-file-service.ts`
- `lib/supabase.ts`
- `lib/types.ts`
- `mobile/App.tsx`
- `mobile/package-lock.json`
- `mobile/package.json`
- `mobile/src/config/supabase.ts`
- `mobile/src/features/dashboard/DashboardScreen.tsx`
- `mobile/src/features/notifications/NotificationsScreen.tsx`
- `mobile/src/organizations/operation.ts`
- `mobile/src/services/workspace.ts`
- `mobile/src/types/domain.ts`
- `packages/shared-types/src/task-create-transport.ts`
- `scripts/validate-invitation-mail-local.mjs`
- `scripts/validate-organization-local.mjs`
- `scripts/validate-project-workflows-local.mjs`
- `scripts/validate-task-http-local.mjs`
- `scripts/validate-task-mobile-local.mjs`
- `scripts/validate-team-collaboration-local.mjs`
- `supabase/functions/architectural-analyze-v2/index.ts`
- `supabase/functions/organization-admin/index.ts`
- `tests/team-collaboration.test.mjs`

Final preservation review: baseline HEAD and branch unchanged; index empty; error.log, AGENTS.md, CLAUDE.md and earlier roadmap/Batch reports retain their starting hashes. Git diff whitespace check passes. Targeted credential-pattern review found no private-key, privileged-key or JWT literals in the completion changes; this is a local pattern review, not a guarantee about unknown external credentials. Existing unrelated work remains preserved. Logs/captures are kept under ignored .git/basoul-local, excluded from any proposed checkpoint. All five dedicated fixture containers are stopped and no fixture listeners remain on 3107/35439/8083; the pre-existing emulator is preserved. No commit, push, deployment, remote migration or workflow activation occurred.
