# Migration Guide — YOSSEUF Platform v4.0.0-rc.1

1. Keep Production on v3.1.0.
2. Configure Vercel Preview with YOSSEUF Platform Staging.
3. Validate the ordered v3.1 IAM migrations, then `20260805000100_platform_organization_workspaces.sql`, on Staging.
4. Run lint, typecheck, tests, build, dependency audit, accessibility validation, and bundle analysis.
5. Verify organization isolation with two users and two organizations.
6. Verify unified module APIs and read-only gateway status endpoints.
7. Review the breaking-changes and database reports before requesting any Production migration.

Rollback Preview by redeploying the last v3.1 artifact. Do not delete the retained legacy Supabase project. Do not modify Production database objects without a separate approved plan.
