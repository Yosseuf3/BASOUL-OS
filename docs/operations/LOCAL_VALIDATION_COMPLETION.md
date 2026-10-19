# Local validation completion — 2026-10-19

Branch: `codex/five-state-task-compatibility`.
HEAD remains `66f5dffd37c2a122e0346ca334fb54b39ea4e41b`.
All commands used project-scoped Node 22.13.1 and npm 10.9.2.

## Authenticated HTTP integration

Added `scripts/validate-task-http-local.mjs` to restore and validate only the
existing disposable Docker stack. Run from the repository root:

```powershell
.\scripts\with-node22.ps1 node scripts/validate-task-http-local.mjs
```

The wrapper asserts exact container names/images, one internal network, no
mounts, tmpfs PostgreSQL storage, nonprivileged containers, and no published
ports except existing loopback bindings. Auth and PostgREST database URLs must
resolve to the dedicated container and synthetic database. There is no external
database URL option. It reuses container-local synthetic secrets without printing
them. PostgreSQL readiness uses TCP to avoid racing its temporary initialization
server. It provisions the missing tmpfs database, lets GoTrue manage its own
tables, creates synthetic users through the Auth admin API, and installs the
repository bootstrap/IAM/table RLS and reviewed task candidates only inside that
isolated database. Unrelated Storage services and policies are excluded.

Pinned services: PostgreSQL 17.6.1.156, GoTrue v2.196.0, PostgREST v14.17, and
the existing Node 24 Alpine HTTP helper. The host test runner uses Node 22.13.1.

The existing `validate-task-auth-http.mjs` runner passed:

* Real password login and identity verification for four synthetic users.
* Invalid/expired JWT rejection and active owner membership verification.
* Non-creator owner, viewer, and other-tenant transition rejection.
* Tenant row invisibility and unrelated authorized project reads.
* Direct legacy writer rejection and shared payload/error mapping.
* Concurrent RPC CAS: exactly one success and one HTTP 409.
* Exactly one audit event and unchanged stored progress.
* Audit modification/deletion/forgery denial.
* Task transition rollback when audit insertion is denied.

All four temporary HTTP services stopped in the wrapper's finally block, and
their stopped state was verified. The standalone PostgreSQL validation container
was also stopped. No containers, networks, images, or volumes were deleted.
Data on tmpfs is ephemeral; subsequent runs provision synthetic fixtures again.
No production/staging account, database, key, or service was accessed. These
results certify the isolated backend HTTP path, not browser/APK/device E2E.

## Expo SDK 57 alignment

`expo install --check` identified precisely these direct mismatches:

| Package | Previous | Supported minimum patch | Installed |
| --- | --- | --- | --- |
| expo | 57.0.27 | ~57.0.30 | 57.0.30 |
| expo-dev-client | ~57.0.19 | ~57.0.20 | 57.0.20 |

Updated only those two direct manifest entries and regenerated the mobile
lockfile with npm 10.9.2. npm also resolved transitive dependencies in the updated
Expo tooling subtree. React remains 19.2.3; React Native remains 0.86.3;
Supabase remains 2.110.8. No SDK 58, web manifest/lockfile, identifiers, app
configuration, signing, or EAS settings changed.

A real clean `npm ci --no-audit --no-fund` completed: 499 packages installed,
including normal install hooks. `npm ls --depth=0` passes. Expo Doctor passes
21/21. Mobile TypeScript passes. The mobile-named regression subset passes 53/53;
the entire repository suite passes 294/294. Web TypeScript also passes. Web
build and bundle budgets were validated in the preceding recovery; application
source and the web dependency graph are unchanged by this alignment.

## Android security remains blocked

Before and after `npm audit --omit=dev --json` produce identical counts:
15 HIGH, 7 moderate, zero critical affected packages (22 total). High package
counts include propagated dependencies; there are two high root advisories.

* node-forge 1.4.0: Expo -> @expo/cli (now 57.0.31), directly and through
  @expo/code-signing-certificates 0.0.6.
  https://github.com/advisories/GHSA-86w9-cpqp-85rv
* braces 3.0.3: Expo/React Native Metro tooling -> metro-file-map 0.84.5 ->
  micromatch 4.0.8 -> braces.
  https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
* Moderate root: uuid 7.0.3 via xcode/Expo config plugins.
  https://github.com/advisories/GHSA-w5hq-g745-h8pq

The existing guarded audit still exits nonzero because its exceptions expired
October 16. The audit script, expiry dates, overrides, and security policy remain
unchanged. No advisory was suppressed. Android release remains BLOCKED until
supported upstream fixes or reviewed dependency replacements remove HIGH findings.
SDK patch alignment resolves Doctor compatibility, not these advisories.

## Preservation and next steps

Preservation hashes match for `.nvmrc`, `error.log`, `scripts/with-node22.ps1`,
and `docs/operations/LOCAL_DEVELOPMENT_RECOVERY.md`. The branch/HEAD are unchanged;
no commits, pushes, merges, PRs, deployments, EAS builds, or Task Workflow
activation occurred. Local logs and audit snapshots are in the Git directory's
`basoul-local` folder. Existing recovery documentation is retained unchanged;
this document supersedes its old stopped/unverified HTTP and Doctor results.

Next: continue local development with the project Node wrapper. Resolve the two
HIGH dependency roots through supported fixes before Android release. Real app
login/device testing still needs approved local synthetic configuration; this
work does not configure a production or staging backend.
