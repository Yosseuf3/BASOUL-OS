-- LOCAL/REVIEW ONLY. Not a deployment instruction or approved migration.
-- Run from repository root using psql ONLY against a dedicated synthetic DB.
-- Precondition: existing schema + activity + notifications + IAM/table RLS.
-- Owner must separately approve equivalent tracked migrations before rollout.
\set ON_ERROR_STOP on
-- PostgreSQL enum expansion MUST commit before any statement uses Review.
\i docs/database/proposed-task-review-enum.sql
BEGIN;
\i docs/database/proposed-task-rollout-gate.sql
\i docs/database/proposed-task-security-hardening.sql
\i docs/database/proposed-task-transition-enforcement.sql
\i docs/database/proposed-task-notifications.sql
\i docs/database/proposed-task-edit-cas.sql
NOTIFY pgrst, 'reload schema';
COMMIT;
-- Client workflow and notification flags remain disabled in source.
