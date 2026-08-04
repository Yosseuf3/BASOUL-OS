# IAM Verification Report — v3.1.0

Environment: YOSSEUF Platform Staging (`ogqdfucxwjutkpoahezn`)  
Production changes: none

## Verified controls

- Organization foundation: `organizations` with immutable creator identity, unique slug, timestamps, and owner-created onboarding RPC.
- Membership foundation: active/invited/suspended lifecycle; owner/admin/member/viewer roles; last-active-owner protection.
- RBAC: viewer reads; member reads/creates/updates; admin also deletes and manages non-privileged memberships; owner manages privileged memberships and organization deletion.
- Trusted identity: the server verifies the Supabase access token with `auth.getUser`, strips client identity fields, resolves an active organization, and injects `user_id` plus `organization_id`.
- Business ownership: all 16 business tables have a non-null `organization_id`, organization index, safe authenticated default, RLS enabled, and RLS forced.
- Membership mutations: SECURITY DEFINER RPCs validate `auth.uid()` and caller role; internal lookup helpers are isolated in the non-exposed `private` schema.
- Storage: project-file and architectural-drawing buckets remain private and user-folder isolated; UPDATE coverage was added for safe upserts.

## Live Staging evidence

- Catalog verification: 16/16 business tables have forced RLS and four command-specific organization policies.
- Positive authorization probe: an active member created and read an organization project (`visible_rows = 1`).
- Negative role probe: viewer create was rejected with PostgreSQL `42501` RLS violation.
- Negative tenant probe: a non-member cross-organization create was rejected with PostgreSQL `42501` RLS violation.
- Staging began empty; historical baseline migrations were loaded before IAM. A missing fresh-install clients baseline was found and repaired in source.

## Security decisions

- Authorization does not use user-editable metadata or deprecated `auth.role()` checks.
- No service-role key is used by the application authorization boundary.
- No direct INSERT policy exists for organizations or memberships; protected RPCs preserve role escalation and last-owner invariants.

Status: ready for human review after CI. This report does not authorize Production deployment.

## Final manual smoke test

Fourteen live assertions passed in a rollback-isolated Staging transaction: organization creation, member invitation and activation, member project creation, viewer read-only enforcement, admin management of non-privileged members, privileged-membership protection, cross-organization isolation, last-owner protection, and create/read/update/delete health across Projects, Tasks, CRM, Finance, Knowledge, and Documents. Cleanup verification found zero retained smoke users or organizations. A read-only Production comparison confirmed the IAM schema is absent there.
