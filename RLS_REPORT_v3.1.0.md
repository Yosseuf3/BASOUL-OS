# RLS Review Report — v3.1.0

Environment reviewed: YOSSEUF Platform Staging (`ogqdfucxwjutkpoahezn`)

## Business tables

The following tables were reviewed and have forced RLS with separate SELECT, INSERT, UPDATE, and DELETE policies: `projects`, `tasks`, `clients`, `content_items`, `knowledge_items`, `finance_transactions`, `activity_events`, `notifications`, `architectural_drawings`, `architectural_reviews`, `architectural_review_findings`, `architectural_analysis_runs`, `architectural_plan_elements`, `architectural_review_comments`, `project_files`, and `project_notes`.

SELECT requires active organization membership. INSERT requires create permission and verified row `user_id`. UPDATE requires update permission in both USING and WITH CHECK and preserves verified row identity. DELETE requires delete permission. Anonymous access is revoked.

## IAM tables

- `organizations`: member SELECT, member-level UPDATE, owner-only DELETE, no direct INSERT.
- `organization_memberships`: member SELECT only; mutations run through role-validating RPCs.
- The last active owner cannot be demoted, suspended, or removed.

## Storage

Both private buckets validate the first storage path segment against `auth.uid()` for SELECT, INSERT, UPDATE, and DELETE. Upsert therefore has complete SELECT/INSERT/UPDATE policy coverage.

## Findings

- Closed: legacy policies were user-only and did not model organizational tenancy.
- Closed: historical Storage policies omitted UPDATE.
- Closed: public schema business tables now have organization ownership and forced RLS.
- Accepted design constraint: the legacy `user_id` column remains as row actor/creator identity while `organization_id` is the tenancy boundary.

Result: PASS on Staging. Production was not inspected or changed.
