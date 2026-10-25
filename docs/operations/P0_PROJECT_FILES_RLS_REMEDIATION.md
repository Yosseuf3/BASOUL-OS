# P0 authorization remediation — 2026-10-25

## Status and scope

**Production release HOLD. Production application requires explicit approval.** This branch prepares two forward-only corrective migrations; it does not apply either to Supabase or promote Vercel. Live inspection used project `okghyypmkymxvtsuvdvb` metadata, policy/function definitions and one aggregate mismatch count only. No customer records were used in mutation tests.

## Root cause and impact

PostgreSQL resolves an unqualified column to the innermost query containing that column. In `20260828035500_project_files_tenant_upload_repair.sql`, the parent subquery's `project.organization_id = organization_id` therefore becomes `project.organization_id = project.organization_id`. Live `pg_policies` deparsing confirms this in SELECT, INSERT, UPDATE (both USING and WITH CHECK) and DELETE. The project-ID comparison still correlates to project_files, but the organization comparison does not.

Outer private.has_permission and projects RLS still apply. This is not unconditional anonymous access or proof a single-tenant member can read every tenant. A caller authorized in both organizations can nevertheless attach an A-scoped file to a B project, read/change/delete inconsistent relationships subject to action permissions, and create misleading cross-module references. Parent RLS can hide the defect from tests using only single-organization users. Incorrect stored relationships can subsequently produce authorization/UI inconsistencies. Local reproduction uses a dual-tenant identity and deliberately inconsistent synthetic legacy row.

Production aggregate preflight found **0** mismatched file/project organization relationships at inspection time. This is neither a historical exploitation audit nor permission to weaken the fix.

The 11-function review also confirmed two SECURITY DEFINER authorization defects: `create_organization_invitation` and `revoke_organization_invitation` compare a potentially NULL member_role to `'owner'` using `<>`. In PL/pgSQL an IF whose result is NULL does not execute its rejection branch. An authenticated nonmember (including suspended membership) can reach owner-only invitation creation/revocation when supplied a target organization or invitation ID. Creation of an invitation with an elevated permitted role can lead to unauthorized membership through acceptance. The isolated reproduction successfully creates and revokes an invitation as an outsider before the fix. No such operation was attempted remotely.

## Corrective migrations

1. `20261025043233_project_files_organization_correlation.sql`: ALTER only the four existing policies; explicitly correlate `p.id=project_files.project_id` and `p.organization_id=project_files.organization_id` in every expression. Preserve auth.uid, permission names, role targets, ACLs and forced RLS. No DML/data rewrite or extra grants.
2. `20261025043328_invitation_owner_null_guard.sql`: preserve current function signatures, bodies, fixed search_path, auditing and ACLs; replace only the two owner comparisons with `IS DISTINCT FROM 'owner'`. CREATE OR REPLACE preserves existing function privileges. The broader SECURITY DEFINER model is not replaced or suppressed.

Existing historical migrations remain immutable so deployed migration history is not rewritten. Reapplication of both corrective SQL scripts is exercised locally. Missing expected policies/functions/schema must fail deployment preflight, not be repaired by indiscriminate drops or new grants.

## Review of all 11 flagged public SECURITY DEFINER functions

The advisor warning means authenticated EXECUTE exposure, not automatic proof of a vulnerability. Live ACLs restrict all 11 to postgres/authenticated/service_role, excluding PUBLIC/anon. All 11 have an empty fixed search_path. Definitions were inspected, including private.member_role, private.role_rank (NULL maps to 0) and private.has_permission dependencies.

| Function | Authorization assessment |
|---|---|
| accept_organization_invitations | Requires auth.uid; derives verified account email from auth.users; accepts only caller-email pending unexpired invitations. Does not take a caller-supplied target identity. |
| attach_organization_invitation | Requires identity, manage_members permission on invitation organization, pending/unexpired invitation and target account email match; active membership guard and administration audit. |
| change_organization_member_role | Requires identity and rank >=30; rejects owner target changes and owner promotion; blocks self-escalation; scoped membership update/audit. Existing admin delegation semantics preserved. |
| create_organization | Requires identity; creates a new organization and membership owned by caller. Does not mutate an existing tenant. Legacy onboarding path remains a separate product-policy consideration, not expanded here. |
| create_organization_invitation | **Confirmed NULL owner-check defect; corrected and behaviorally reproduced/tested.** Owner-only semantics preserved for real owners. |
| create_owned_organization | Requires identity; checks existing active membership and pending invitations; inserts caller-owned organization/profile/membership. |
| deactivate_organization_member | Requires identity and rank >=30 (missing role maps to 0); owner-target restriction; scoped update and audit. |
| ensure_personal_organization | Requires identity; discovers caller membership or creates caller-owned organization through create_organization. Legacy onboarding behavior preserved. |
| remove_organization_membership | Requires identity and rank >=30; owner required for privileged targets; scoped delete/audit; last-owner invariants depend on existing trigger. |
| revoke_organization_invitation | **Confirmed NULL owner-check defect; corrected and behaviorally reproduced/tested.** Invitation state/audit behavior preserved. |
| set_organization_membership | Requires identity and rank >=30; validates roles/status; rejects self-escalation; owner required for privileged membership operations; scoped upsert/audit. |

Review is definition/ACL analysis of all 11. Only the two changed functions receive new behavioral tests here; do not claim full runtime coverage for the other nine. Existing owner/admin delegation, concurrent last-owner protection and onboarding policy require their own regression coverage when changed.

## Related CAD / storage inspection

- Live architectural_drawings policies explicitly compare parent and child organization IDs; no equivalent self-comparison found.
- Live architectural_reviews uses generic organization policies but a BEFORE INSERT/UPDATE tenant trigger derives organization from drawing and rejects project/drawing mismatch. Review/finding lineage logic was inspected, not altered or claimed fully integration-tested here.
- Live project-files and architectural-drawings storage policies qualify storage.objects.name and enforce caller folder prefix plus project permission. No same tautology found. Project-file storage SELECT/INSERT/UPDATE/DELETE and denied cross-tenant insertion are exercised using repository storage policies in the isolated SQL fixture; this is not an actual hosted signed-URL/storage-service test.
- Live project_notes policies are organization-scoped without a project/file lineage trigger in inspected metadata. This is a related integrity/authorization review gap requiring a separate focused assessment of supported note relationships; this file-policy correction must not be advertised as covering it.
- Whole-policy metadata search found the exact same-alias organization comparison only in the four project_files policies.
- Other advisor findings (mutable search_path in set_updated_at and disabled leaked-password protection) were recorded but not changed as unrelated configuration work. No advisor or required CI check was suppressed.

## Automated validation

Run `node scripts/test-project-files-rls.mjs` with Docker available. Default image is postgres:17 pinned at digest `sha256:b8faeff7712663c2773a190181e1246e37e364b887611c04658c28b44e2408fe`; BASOUL_RLS_TEST_IMAGE may select an approved local PostgreSQL 17 image. The runner creates a uniquely named disposable container/database, no network or published ports, temporary data, no remote credentials; stops/removes the test container in finally. It loads minimal synthetic host tables plus actual repository permission helpers, old policies, storage policies, owner-invitation definitions and administration audit function. It reproduces old behavior, applies both migrations twice, then asserts behavior as authenticated/anon roles without SUPERUSER/BYPASSRLS.

Coverage: legitimate owner/member file operations; member DELETE denial; viewer, outsider, other-tenant-only owner and suspended-user denial; cross-org INSERT and reparent/organization UPDATE rejection; mismatched legacy SELECT/UPDATE/DELETE suppression; forged-owner UPDATE rejection; historical row preservation; RLS remains forced; storage owner-path boundaries; owner invitation/revocation success and audit; admin/member/viewer/nonmember/suspended invitation denial; missing identity and anon denial. Fixtures are synthetic only. This is targeted PostgreSQL semantics coverage, not a complete production schema rehearsal or hosted HTTP test.

The existing Web quality job now executes this regression. Existing Web/Mobile security and quality checks remain unchanged and mandatory. CI outcomes and PR identity are reported after publication; never infer CI PASS from a local result.

Fresh production auditing during this work discovered GHSA-mrhx-c7xc-m3w5 in baseline zod@4.4.3 (memory exhaustion validating oversized constrained collections). The official advisory identifies 4.6.6 as first patched. A normal supported transitive update resolves zod to 4.6.7, accepted by @pascal-app/core ^4.3.5, @pascal-app/editor ^4.3.6 and tooling ^3.25.0 || ^4.0.0. Only zod's version/resolved/integrity lock entry changes; no new direct dependency, override, suppression or unrelated lock cleanup. This additional change is needed to pass the existing production security gate; baseline's earlier clean audit cannot be reused after a newly disclosed advisory. [Official Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

Local evidence: clean npm ci completed; Node 22.13.1 Web suite **235/235 PASS**. Real PostgreSQL regressions passed against both the official PostgreSQL 17 image and the existing Supabase PostgreSQL 17.6.1.156 image, including old-behavior reproduction and applying both migrations twice. A preliminary test invocation before dependencies were installed failed on missing TypeScript; after clean installation the complete suite passed. No skipped or synthetic-as-hosted PASS claims.

## Production preflight, approval and recovery

Before explicit production application approval: review this PR and exact migration SQL, require passing CI, compare expected live policy/function definitions and grants, confirm current schema compatibility, recompute aggregate mismatch count, review any malformed records without deleting them, capture existing definitions and ensure approved backup/recovery procedures. Apply only the approved correction in a controlled transaction with normal migration tracking; do not bulk-apply unrelated pending candidates.

Both migrations must pass isolated tests before requesting approval. Obtain separate owner approval to apply production SQL. After approved application, read back deparsed policies, function bodies/ACLs and RLS flags, then execute authorized isolated tenant tests. Expected malformed rows become inaccessible, not deleted. If legitimate operations regress, fail closed and repair forward; do not automatically restore vulnerable policies or NULL guards. No actual rollback, production mutation or Vercel promotion is authorized by this document.
