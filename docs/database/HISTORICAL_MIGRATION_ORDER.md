# Historical migration dependency repair

The missing client_status failure was caused by an incomplete replay order, not by a missing enum definition in the repository. The canonical existing migration supabase/migrations/20260802204800_clients_baseline_repair.sql defines clients and its Lead/Active/Inactive enum and explicitly precedes v0.5.0. The old local harness replayed only migration_v*.sql files and omitted that prerequisite.

The corrected plan inserts that existing baseline immediately before migration_v0.5.0.sql, numerically orders legacy versions (including alpha.9 before alpha.11), then applies the remaining timestamped migrations in order. It respects each script's own transaction boundaries; v0.5.0 enum extension commits before its transaction. No historical SQL was rewritten, no new enum values invented, and no production data was accessed.

This plan is for disposable full historical rehearsals and fresh installations. Do not replay ownership-era baseline policies on an existing IAM deployment: the later IAM policy replacements are required to preserve tenant boundaries. Existing deployed databases need their own migration ledger/preflight and only pending reviewed migrations.

Local validation covers fresh and pre-Review upgrade paths through all 37 available migrations, an existing Active client with preserved name/status/created timestamp, repeat-v0.5.0 idempotence, failure injected before candidate COMMIT, zero activation rows, authorized field edit/archive and pg_dump/pg_restore recovery. Recovery compares row hashes, columns/defaults/nullability, function definitions, constraints, RLS/ACLs, policies, triggers and semantic enum order. PostgreSQL may renumber internal enum sort positions during restore; comparison normalizes their order, not their labels or semantics.

Auth and Storage catalog fixtures model the SQL prerequisites only. Auth JWT verification is separately exercised against real local GoTrue/PostgREST; no Storage API upload or hosted service parity is claimed. The HTTP/Mobile fixture now uses this same complete migration order, supplying the architectural tables that Mobile reads as part of its workspace instead of silently accepting a partial schema.

Reproducible local commands (project Node 22 wrapper):

- node scripts/validate-task-historical-local.mjs
- node scripts/validate-task-postgres.mjs
- node scripts/validate-task-http-local.mjs

All targets are hard-coded isolated containers; no remote URL parameter is accepted. Rehearsals create new synthetic databases and never drop existing databases.

The six files database/migrations/005 through 010 mirror the legacy migrations and are not replayed twice. The additional nonduplicate 011_architectural_intelligence_foundation.sql is included immediately before v3.0.0_alpha.5.

## Ordered files
1. supabase/migration_v0.1.0.sql
2. supabase/migration_v0.1.1.sql
3. supabase/migration_v0.3.0.sql
4. supabase/migrations/20260802204800_clients_baseline_repair.sql
5. supabase/migration_v0.5.0.sql
6. supabase/migration_v0.6.0.sql
7. supabase/migration_v0.7.0.sql
8. supabase/migration_v0.8.0.sql
9. supabase/migration_v0.9.2.sql
10. supabase/migration_v0.9.3.sql
11. supabase/migration_v1.0.0_rc1.sql
12. supabase/migration_v1.1.1.sql
13. database/migrations/011_architectural_intelligence_foundation.sql
14. supabase/migration_v3.0.0_alpha.5.sql
15. supabase/migration_v3.0.0_alpha.6.sql
16. supabase/migration_v3.0.0_alpha.9.sql
17. supabase/migration_v3.0.0_alpha.11.sql
18. supabase/migration_v3.0.0_alpha.21.sql
19. supabase/migration_v3.0.0_alpha.22.sql
20. supabase/migration_v3.0.0_beta.2.sql
21. supabase/migration_v3.0.0_beta.3.sql
22. supabase/migrations/20260802204811_iam_foundation.sql
23. supabase/migrations/20260802204818_iam_rls.sql
24. supabase/migrations/20260802204825_iam_indexes.sql
25. supabase/migrations/20260805000100_platform_organization_workspaces.sql
26. supabase/migrations/20260809175830_secure_member_invitations.sql
27. supabase/migrations/20260809181500_administration_audit_actions.sql
28. supabase/migrations/20260809182500_invitation_audit_index.sql
29. supabase/migrations/20260809193000_basoul_administration_boundaries.sql
30. supabase/migrations/20260822121500_owner_onboarding_tenant_isolation.sql
31. supabase/migrations/20260822130633_allow_membership_changed_activity_event.sql
32. supabase/migrations/20260824004500_architecture_scenes.sql
33. supabase/migrations/20260828002500_architecture_scenes_privilege_hardening.sql
34. supabase/migrations/20260828035500_project_files_tenant_upload_repair.sql
35. supabase/migrations/20260828042500_project_files_storage_policy_name_collision_fix.sql
36. supabase/migrations/20260828044500_architectural_drawings_tenant_upload_repair.sql
37. supabase/migrations/20260828051000_architectural_analysis_tenant_context_repair.sql
