# Reviewed local checkpoint inventory — 2026-10-20

Proposed accumulated source checkpoint only. No files have been staged or committed. HEAD remains 34e0d03b752988f9f0d83a3209f741469d7dc651.

Includes prior reviewed product implementation plus current historical rehearsal repair, Android test harness and evidence documentation. Generated SDK/image/APK/AVD/runtime logs/backups/screenshots remain ignored. Exclude preserved error.log and generated AGENTS.md/CLAUDE.md.

Exact proposed files (
66
):

- `app/api/tasks/transition/route.ts`
- `app/api/workspace/[resource]/route.ts`
- `app/page.tsx`
- `docs/database/HISTORICAL_MIGRATION_ORDER.md`
- `docs/database/proposed-task-edit-cas.sql`
- `docs/database/proposed-task-notifications.sql`
- `docs/database/proposed-task-rollout-gate.sql`
- `docs/database/TASK_REASON_UX.md`
- `docs/database/TASK_TRANSITION_CONFIRMATION.md`
- `docs/database/TASK_WORKFLOW_INSTALL_CANDIDATE.sql`
- `docs/operations/DEVELOPMENT_READINESS_2026-10-19.md`
- `docs/operations/FINAL_BLOCKER_RESOLUTION_2026-10-20.md`
- `docs/operations/FINAL_RELEASE_CHECKLIST.md`
- `docs/operations/FINAL_RELEASE_READINESS_2026-10-20.md`
- `docs/operations/LOCAL_ANDROID_VALIDATION.md`
- `docs/operations/LOCAL_CHECKPOINT_INVENTORY_2026-10-20.md`
- `docs/operations/SECURITY_BLOCKER_ANALYSIS_2026-10-20.md`
- `features/notifications/notifications-view.tsx`
- `features/tasks/task-reason-confirmation.tsx`
- `lib/data/authorized-workspace-client.ts`
- `lib/data/os-repository.ts`
- `lib/data/task-transition-client.ts`
- `lib/data/workspace-service.ts`
- `lib/events/activity-service.ts`
- `lib/organizations/workspace-selection.ts`
- `lib/types.ts`
- `mobile/App.tsx`
- `mobile/src/config/supabase.ts`
- `mobile/src/features/auth/LoginScreen.tsx`
- `mobile/src/features/notifications/NotificationsScreen.tsx`
- `mobile/src/features/tasks/TaskDetailsScreen.tsx`
- `mobile/src/features/tasks/TaskReasonConfirmation.tsx`
- `mobile/src/features/tasks/TasksScreen.tsx`
- `mobile/src/organizations/operation.ts`
- `mobile/src/services/task-edits.ts`
- `mobile/src/services/task-transitions.ts`
- `mobile/src/services/workspace.ts`
- `mobile/src/types/domain.ts`
- `package-lock.json`
- `package.json`
- `packages/shared-types/src/task-edit-contract.ts`
- `packages/shared-types/src/task-notifications.ts`
- `packages/shared-types/src/task-status-contract.ts`
- `packages/shared-types/src/task-transition-client.ts`
- `packages/shared-types/src/task-transition-reason.ts`
- `scripts/start-local-android.ps1`
- `scripts/task-fixture-gateway.mjs`
- `scripts/task-historical-manifest.mjs`
- `scripts/validate-task-auth-http.mjs`
- `scripts/validate-task-browser-local.mjs`
- `scripts/validate-task-historical-local.mjs`
- `scripts/validate-task-http-local.mjs`
- `scripts/validate-task-mobile-local.mjs`
- `scripts/validate-task-postgres.mjs`
- `tests/fixtures/historical-host-services.sql`
- `tests/fixtures/historical-storage-catalog.sql`
- `tests/fixtures/task-edit-regression.sql`
- `tests/fixtures/task-notification-regression.sql`
- `tests/mobile-organization-context.test.mjs`
- `tests/mobile-task-edit.test.mjs`
- `tests/task-historical-manifest.test.mjs`
- `tests/task-readiness.test.mjs`
- `tests/task-release-policy.test.mjs`
- `tests/task-status-compatibility.test.mjs`
- `tests/task-transition-confirmation.test.mjs`
- `tests/task-transition-reason.test.mjs`


The ignored .git/basoul-local/checkpoint-sha256.csv records current content hashes after final review. This inventory is not authorization to commit, activate SQL candidates or release with unresolved security findings.
