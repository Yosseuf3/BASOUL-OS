# YOSSEUF OS v3.1.0 — IAM Foundation

YOSSEUF OS v3.1.0 is the first stable release package for organization-aware identity and access management. It introduces a consistent organization boundary across the platform while preserving existing business workflows.

## Highlights

- Organization creation with automatic owner membership.
- Owner, admin, member, and viewer roles with explicit read, create, update, delete, membership, and organization-management permissions.
- Protected membership administration, including last-owner enforcement and restrictions on privileged role changes.
- Organization ownership on Projects, Tasks, CRM, Finance, Knowledge, Documents, Architecture, Activity, and Notifications data.
- Deny-by-default row-level security designed to prevent cross-organization access.
- Authenticated server write boundaries for supported workspace resources.
- Authorization regression tests covering policy shape, write boundaries, privileged membership handling, and release safeguards.
- Expo patch alignment to `~57.0.10` with regenerated mobile lockfile and no intended behavior change.

## Compatibility

- Web and mobile product version: `3.1.0`.
- Expo SDK patch line: `~57.0.10`.
- PostgreSQL target: Supabase PostgreSQL 17.
- Existing Projects, Tasks, CRM, Finance, Knowledge, Documents, and Architecture workflows remain supported.

## Included pull requests

- [#37 — Complete IAM foundation v3.1.0](https://github.com/Yosseuf3/YOSSEUF--OS/pull/37)
- [#36 — YOSSEUF OS v3.0.3 Foundation Hardening](https://github.com/Yosseuf3/YOSSEUF--OS/pull/36)
- [#35 — Release YOSSEUF OS v3.0.2 — Foundation v1 Migration](https://github.com/Yosseuf3/YOSSEUF--OS/pull/35)
- [#32 — Integrate YOSSEUF Foundation v1.0.0](https://github.com/Yosseuf3/YOSSEUF--OS/pull/32)

All 34 pull requests merged to `main` at release preparation time were verified as ancestors of the release candidate.

## Validation

- PR #37 CI passed.
- Staging IAM smoke suite passed 14/14.
- Logical Production backup and isolated restore rehearsal passed before release preparation.
- Schema, indexes, constraints, RLS policies, Auth user counts, Storage metadata, and business row counts were verified during the recovery rehearsal.
- Production deployment remains a separate, explicit approval step.

## Upgrade note

This release contains additive IAM schema and RLS migrations. Apply them only through the separately approved Production migration runbook, with a fresh verified backup, canonical organization owner approval, parity checks, and rollback coverage in place.

## Release integrity

- Source merge: `91d2310f8cf44a45a22cddb2e996d0779f14fcdd`.
- Release candidate tag: `v3.1.0-rc.1`.
- Stable tag: `v3.1.0`.
- No Production deployment or database migration is performed by creating this release.
