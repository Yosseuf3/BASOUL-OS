# Release recovery — 2026-10-25

Decision: **HOLD for production approval**. No production deployment, migration,
domain change, signing change, or workflow activation was performed.

## Verified source and protection

- Main: `b3f898233f057bd42b0414b3eee8e4a3b5ded8c2`.
- PR #177 reviewed baseline: `9e9ee17e0f10e840db9aad67d1ea0251ee6286bc`.
- Ruleset `19746250`: active on main, no bypass actors; required Actions checks
  `Web quality` and `Mobile quality`, strict up-to-date policy. No rules changed.
- Baseline run `40184290770`: both quality checks PASS; the separately reported
  Android security job FAIL. This is not evidence of a clean Android audit.
- P0 project-file organization correlation and invitation NULL-owner fixes are
  preserved. Production application remains explicitly unapproved.

## Registry root cause and concrete recovery

Deployment `dpl_6iyyPZNDNmrvyXgbhGkTBf7Hd7rk` failed publishing the CAD image.
Complete logs contain `denied: repository has reached the maximum allowed number
of images`; buildah exits 125. The repository exists and contained 50 images.
This evidence identifies image-count quota, not a missing repository or a proven
permission problem.

Reviewed the complete 70 retained-deployment catalog, image digests in build
events and matching commit tags. All were terminal; no reference-fetch failures.
Two historical READY deployments with no CAD digest were previously verified
Web-only deployments. Deleted exactly three tagged images with neither a retained
deployment digest reference nor matching deployment commit tag:

| Image ID | Digest | Tag | Created (UTC) |
| --- | --- | --- | --- |
| image_ERNJOrVRZ6BD6fdmCDEIBicjg92D | sha256:f0c11e67f8f2da8a1d978c8eb7956e8eace35a0de8533c357cbd5c8deb7cff64 | d390c6793213 | 2026-09-01T21:06:22.839Z |
| image_1OLGFvappOyBKoHZjM5SBuKDXnl2 | sha256:09063ca9023a77d5bcbc338a6cb66e17de6aaedc1158b8a0e63379d9336e2ffb | 4b872f6aae48 | 2026-09-01T22:57:20.292Z |
| image_oJ0Twbq4x46ooUF4kKxKkvrZ10L2 | sha256:bf8d0a5a04c87deec3d4745317730183b050ca6a6813c225beaf5c6a729db50d | d038ed3c504f | 2026-09-01T23:07:45.308Z |

All deletion receipts confirmed `deleted:true`; readback was 47 images. No
deployment or uncertain/untagged image was deleted. Private reference proof,
inventory, full build events and receipts are retained outside the worktree in
`.git/basoul-local/release-recovery-20261025/`; they are not committed.

One retry was justified by the capacity change:
`dpl_322qWHMywscGAhf2MkkNyCYFcGsq`, source `9e9ee17...`, Preview URL
`https://yosseuf-b6feqw8r8-yosseuf-os.vercel.app`. Final state **READY**;
events confirm successful manifest push in 8 seconds and deployment completion.
Published digest:
`sha256:95c149537376c3c69701089250297c32e393368d1b51a68be50a3898614b3575`.
Inventory readback: **48/50**, no next page. Login HTTP 200. A malformed POST to
the actual ingestion route returned HTTP 500; this newly discovered error is
corrected below and must be verified on the new-head Preview.

## CAD build and verification boundary

The Python container context consumes no root npm inputs. The ignore classifier
now explicitly recognizes root Web manifests/configuration; unknown files,
missing Git metadata and CAD/config changes still require a build. The failed
baseline changed CAD ignore/config inputs, so rebuilding was justified. Its
events do not prove the per-service ignore command executed; manual CLI redeploy
also does not establish automatic Git reuse. No unsupported service reuse,
public CAD route, mock service, or removal of CAD was introduced.

Added an authenticated, read-only Web `/api/architecture/cad/health` probe. It
verifies current organization membership before using the private service
binding, requires working DWG support/schema, sets a timeout and no-store, and
returns no internal addresses or arbitrary upstream fields. It never forwards
the user's bearer token to CAD. Hosted success still requires a verified isolated
application identity; local mocked-route tests cannot establish hosted health.
Ingestion now requires explicit bearer/organization context before parsing and
returns 400 for malformed multipart data instead of an unhandled 500. Focused
tests verify missing identity/context never parses a body or contacts the backend.

Local actual unchanged container HTTP execution: startup/health PASS; public
LibreDWG DXF fixture 68 entities and DWG fixture 67 entities PASS; unsupported,
empty, malformed and invalid-tenant inputs rejected (415/413/422/400); service
remains healthy. Executed network-none/read-only with temporary storage, no DB
credentials or customer records. The CAD source has no diff from main. This is
local evidence only, not a hosted ingestion PASS.

## Database access and migration safety

CLI project metadata verifies production `okghyypmkymxvtsuvdvb` healthy and
staging `ogqdfucxwjutkpoahezn` inactive, both organization `pwvbbycjmcappllkueiy`.
The staging restore connector request failed at transport; CLI readback still
showed INACTIVE. Available CLI project commands do not offer restore. Dashboard
redirects to sign-in; owner sign-in was requested. No other accounting project
was used. No hosted fixtures were created, no customer identities used, and no
production policy changed.

Actual isolated PostgreSQL regression PASS after starting the existing Docker
engine: reproduced original policy/NULL-owner defects, tested authorized and
cross-tenant CRUD/storage/invitation access and safely reapplied both corrective
migrations twice. The disposable network-none database stopped after testing.
This is not a complete historical production-schema rehearsal or backup proof.

Before production application: obtain a verified backup/recovery point, inspect
the exact live policy/function definitions and privileges, rehearse against a
verified staging schema and obtain owner approval for these exact migrations on
`okghyypmkymxvtsuvdvb`:

- `20261025043233_project_files_organization_correlation.sql`
- `20261025043328_invitation_owner_null_guard.sql`

Never restore the vulnerable authorization policies as a routine rollback.
Recovery must retain corrected tenant/owner checks and preserve data/audit rows.

## Android security and build boundary

Fresh audit FAIL: five HIGH package entries from two underlying advisories.
Expo 57.0.31 → CLI 57.0.32 → node-forge 1.4.0, also through
code-signing-certificates 0.0.6; Expo CLI → Zod 3.25.76. Registry latest forge is
still 1.4.0; latest Zod 3 is 3.25.76. Upstream forge advisory has no patched
release; Zod fix starts at 4.6.6 and cannot be forced into Expo's Zod 3 contract.
Latest CLI 58.1.15 is not itself evidence of an SDK57-compatible fix, and still
cannot remove the unpatched forge advisory by assumption.

- [Forge advisory GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
- [Zod advisory GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)

Existing scoped tooling exceptions expire 2026-10-30T00:00:00Z. They were neither
extended nor treated as a fix; the unapproved Zod finding keeps audit failing.
Previously reviewed Android JS source-map evidence excludes vulnerable modules
from the app runtime; signing/build-host exposure remains. No crypto patch,
override or SDK upgrade was invented.

The existing manually dispatched Android Preview build lacked an audit before
EAS. Added the existing strict `audit:production` gate immediately after clean
installation and before Expo credential verification/build. Added an ordering
regression. The separate strict Android release workflow remains enforced. EAS
authentication was checked read-only; no APK build may run while this gate fails.
Package identity and signing configuration are unchanged.

## Local validation at this checkpoint

| Gate | Result |
| --- | --- |
| Web lint | PASS, zero errors; 19 existing warnings |
| Web TypeScript | PASS |
| Web unit/regression tests | Rerun includes the additional malformed-request regressions; see new-head CI |
| Focused health/security/CAD classification tests | PASS, 22/22; ingestion boundary adds two passing tests |
| Web full dependency audit | PASS, zero findings, including development dependencies |
| Mobile TypeScript | PASS |
| Expo Doctor | PASS, 21/21 |
| Mobile strict audit | FAIL, five HIGH entries |
| Isolated PostgreSQL authorization regression | PASS |
| Local actual CAD HTTP | PASS; hosted tests separate |
| Baseline Preview publication/deployment | PASS, READY; 48/50 images |
| Baseline hosted login | PASS, HTTP 200; not authenticated journey evidence |
| Release/foundation/accessibility validation | PASS |
| Hosted authenticated CAD, tenant/RLS and schema compatibility | BLOCKED, staging access/fixtures not verified |
| Android APK/device tests | BLOCKED by strict security gate |
| Production migration/promotion | BLOCKED pending verified prerequisites and exact approval |

Local production build and bundle budgets PASS with CI placeholder configuration.
Initial local build without environment variables failed during prerender as
expected. Rerun uses the same non-secret placeholder Supabase configuration as
CI; no production credentials are loaded. Final build/bundle and new-head CI
results must be recorded in the PR evidence before merge.

Protected production `dpl_BnYMfmsikTof1JU4H8V9PvUA7dCg` and designated rollback
`dpl_AKVpBDkXtdE83XRcmgrwr69euGSj` both read back READY. Neither was changed.
The rollback's old CAD digest was already absent from the registry before this
cleanup; availability is not proof of successful reprovisioning. Do not execute
a production rollback as a test. Registry headroom is finite: publication consumes
slots, so inventory/reference checks are required before later builds.

## Remaining release conditions

1. Confirm final Preview publication/READY and new-head required CI.
2. Resume authenticated staging, verify its schema and isolated identities, then
   execute hosted authenticated health/DWG/DXF/Web binding and cross-tenant tests.
3. Verify backup and recovery evidence; obtain exact production migration approval.
4. Android: supported upstream fix or separately approved, bounded risk decision;
   no exception is added by this change. Only then queue APK/device validation.
5. Obtain final production release approval. UI improvements stay deferred.

Preserved logs, local settings, credentials, backups, AGENTS.md and CLAUDE.md.
`error.log` SHA-256 remains
`48493ae1a7d1c90a1a0114ac00a7686102cb4bc320301b7d4277c28284e51786`.

## Follow-up execution — 2026-10-26

The earlier access and hosted-CAD holds above describe the checkpoint at that
time. The connector recovered; the existing staging project was resumed to
ACTIVE_HEALTHY, not recreated. Its historical core schema and function/policy
prerequisites were inspected before changes. Both reviewed P0 SQL files applied
to staging successfully (history versions 20261026093515 and 20261026093521).
RLS remained enabled, function ACLs were preserved, and a transactional reapply /
rollback rehearsal retained all four corrected policies. This is targeted
historical-schema coverage, not permission to bulk-push every repository migration.

Created two explicitly disposable staging identities (owner and viewer), two
test organizations and two test projects. API credentials/passwords/sessions
were consumed in memory, never printed or committed. No email was sent and no
customer records or existing customer identities were used. App requests used
normal Auth sessions and RLS, not service-role authorization; administrative
credentials were used only to provision the synthetic identities.

Staging authenticated HTTP **14/14 PASS**: password sign-in/sign-out, authorized
membership, same-tenant file CRUD, viewer read/DELETE denial, anonymous denial,
cross-tenant project suppression and cross-organization project/file INSERT
and UPDATE denial even for the dual-tenant test owner.

| Fixture | Non-secret identifier |
| --- | --- |
| Test organization A | 36fe90a8-a0bd-49c3-a938-6e7159f7b09b |
| Test organization B | 598c91c2-f874-44df-8060-713e99810421 |
| Test project A | c750dca8-2687-4bda-b493-8d0930d49dd2 |
| Test project B | 0fd41fa4-8e10-48c4-b715-254d2836f7c5 |

Added two public Supabase configuration variables for **Preview on this PR branch
only**, targeting staging; Production and other branch scopes were not changed.
Redeployment `dpl_3XW4ZqZ6E5pvxTJ6tMn7atjATHCH`, source 9f1f3a7..., reached READY:
`https://yosseuf-ifd9k77j4-yosseuf-os.vercel.app`.

Actual hosted authenticated Web → private CAD health PASS. DWG ingestion HTTP200
with 67 entities and DXF HTTP200 with 68 entities PASS. Invalid format HTTP415,
cross-organization project HTTP404 and nonmember organization HTTP401 PASS.
Organization/workspace resolution and projects/tasks reads PASS. The service
remains private, accessed through the intended Web binding; no public CAD route
or application-authentication bypass was added.

This execution discovered a real shared-reader defect: notifications returned
403 because `notifications.updated_at` does not exist. Metadata confirms both
notifications and activity_events have only created_at in staging **and**
Production. The reader now orders those two append-only resources by created_at;
other resources retain updated_at ordering, the same tenant predicate and auth.
Nine focused actual-route tests cover all eight resources plus denial. Full
local tests **268/268 PASS**. New-head CI/hosted verification is required before
calling this correction complete.

An additional image `image_8Mm1tWCxMxcIQoRpze9toSexlIU7`, digest
`sha256:3efa34834912d64b28992e87418deac7ab27626bc2cb620c840f88a44f49cb29`,
tag ac9d15953f07, created 2026-09-01T23:34:20.961Z, was deleted only after
rechecking all 72 terminal retained deployments and current image references.
Receipt confirmed deleted:true. This allowed the staging validation build while
preserving headroom; no protected deployment/image reference was removed.

Read-only production preflight confirms both P0 migrations still unapplied,
the four original tautological policy expressions still present, expected
invitation signatures present and **zero** mismatched file/project organizations.
Production backup metadata: walg_enabled=true, pitr_enabled=false, backups=[],
physical_backup_data={}. No physical backup is listed; an independently verified
recoverable backup is still required before exact production migration approval.
Do not infer that no external backup exists, or treat this metadata as a restore
rehearsal. No production policy/data/deployment/domain/signing change occurred.

Android audit remains FAIL on 2026-10-26: five HIGH entries, latest forge1.4.0
still unpatched. EAS authentication works, but the successful historical APK
status references commit78f9e1c..., not this candidate. No new APK/device PASS
is claimed. Existing exception expiration remains 2026-10-30T00:00:00Z.
