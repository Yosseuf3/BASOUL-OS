# Database Report — v4.0.0-rc.1

Production database changes: **none**.

The RC includes one additive migration for `organization_workspaces`. It uses organization and owner foreign keys, tenant-scoped uniqueness, supporting indexes, least-privilege grants, forced RLS, explicit `TO authenticated` policies, and ownership checks using `auth.uid()`.

No service-role credential is introduced. No policy uses `user_metadata`, `raw_user_meta_data`, or deprecated `auth.role()`. Staging validation and Supabase advisors are required before any Production proposal.

Dependency audit is clean at high/critical severity for both web and mobile. Expo's transitive toolchain retains moderate advisories whose automated remediation proposes an unsafe major downgrade; they are documented for upstream resolution rather than forced into the RC.

## Staging verification

Applied successfully to **YOSSEUF Platform Staging** (`ogqdfucxwjutkpoahezn`) on 2026-08-05. Verification returned RLS enabled, RLS forced, and four policies on `organization_workspaces`.

Supabase advisors reported no new security finding for the v4 table. Existing Staging warnings concern the pre-v4 `set_updated_at` search path and intentionally exposed IAM `SECURITY DEFINER` RPCs; resolving those requires a separate IAM hardening migration. Unused-index notices are expected on the empty Staging dataset and are not evidence that indexes should be removed before workload measurement.
