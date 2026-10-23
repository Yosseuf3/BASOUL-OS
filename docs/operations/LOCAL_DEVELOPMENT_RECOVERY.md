# Local development recovery — 2026-10-19

Repository: E:\Codex\Repos\BASOUL-OS. Branch remains
`codex/five-state-task-compatibility`, HEAD
`66f5dffd37c2a122e0346ca334fb54b39ea4e41b`.

## Node

No nvm, fnm, Volta or mise command/standard installation was found. System Node
24.18.0 and npm 12.0.2 remain installed and selected outside the wrapper.
Portable Node 22.13.1 includes npm 10.9.2. Its Windows x64 archive was downloaded
from https://nodejs.org/dist/v22.13.1/ and verified against SHASUMS256.txt:
`398a61e250a5584a62a5959e2f69f5d597fc83f1a5ebe3ed8fff29ba39d55f14`.
Runtime/archive/checksums are retained in the Git directory under `basoul-local`.
They are local artifacts, not committed dependencies. `.nvmrc` records CI parity.

From the repository root:

```powershell
.\scripts\with-node22.ps1
.\scripts\with-node22.ps1 npm --version
.\scripts\with-node22.ps1 npm run dev
.\scripts\with-node22.ps1 npm run quality
.\scripts\with-node22.ps1 npm run quality:mobile
.\scripts\with-node22.ps1 node scripts/validate-task-postgres.mjs
```

The wrapper changes PATH only during its command and restores it afterward.
To reproduce installation on another checkout, download the official Windows x64
22.13.1 ZIP and checksums, verify SHA256, and extract the ZIP under the absolute
Git directory returned by `git rev-parse --absolute-git-dir`, in `basoul-local`.
Never execute an archive whose hash does not match.

Both existing dependency trees pass `npm ls --depth=0`. Both lockfiles pass
`npm ci --dry-run --ignore-scripts --no-audit --no-fund` under npm 10.9.2.
This verifies install planning, not a fresh install or execution of install hooks;
existing node_modules were preserved. No manifest or lockfile changes were made.

## Docker / backend

Docker Desktop was not running; desktop-linux still pointed at its existing
named pipe. WSL2 and its service were available. Historical backend logs include
an October 12 stop and WSL bootstrap errors; these alone do not prove the cause
of the earlier shutdown. Normal `docker desktop start --detach` restored Docker
Engine 29.8.2 without resets, configuration changes, or resource deletion.

Started only the existing `basoul-pr173-validation` container after checking:
network none, no ports, no mounts, PostgreSQL data on tmpfs. Both fresh and upgrade
regressions passed, including 25 transitions each, RLS, preservation, audit,
legacy-write rejection and concurrent CAS. Databases are retained for inspection.
These tests were rerun under Node 22.13.1.

The separate GoTrue/PostgREST stack remains stopped and was not certified by
this recovery. Its database is tmpfs, so prior fixture persistence cannot be
assumed across engine/container stops. Reprovision and validate its synthetic
users/schema before rerunning `validate-task-auth-http.mjs`; PostgreSQL-only
tests simulate auth.uid and do not certify JWT/HTTP or browser/device behavior.

## Android dependency findings and minimal proposal

Raw production audit: 15 high and 7 moderate affected packages, zero critical.
These are propagated package counts, not 22 independent root advisories.
The existing guarded audit fails immediately because exceptions expired October
16. Neither exceptions nor the gate were changed.

High-severity root paths:

* expo 57.0.27 -> @expo/cli 57.0.28 -> node-forge 1.4.0;
  the CLI also reaches it through @expo/code-signing-certificates 0.0.6.
* Expo/React Native Metro tooling -> metro-file-map 0.84.5 -> micromatch 4.0.8
  -> braces 3.0.3. Expo's own metro-file-map replacement does not eliminate the
  upstream Metro path.

The registry still reports node-forge 1.4.0 and braces 3.0.3 as latest.
Both official advisories list no patched version:

* https://github.com/advisories/GHSA-86w9-cpqp-85rv
* https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

The additional moderate root is uuid <11.1.1 through xcode and Expo config
plugins. A forced uuid major override needs API compatibility investigation.

Proposal only, not applied:

1. Evaluate SDK 57 patch alignment: expo 57.0.30 and expo-dev-client 57.0.20,
   as requested by current Expo Doctor. Keep React Native on the SDK-supported
   version; do not run audit fix --force or accept its Expo 44/RN 0.72 downgrades.
2. This patch alignment is not a security fix: @expo/cli 57.0.31 still depends
   on node-forge ^1.3.3, and metro-file-map 0.84.6 still uses micromatch ^4.0.4.
   Require a published upstream fix or reviewed replacement removing each path.
   No safe, published package-only fix for both high advisories was found today.
3. Once supported fixes exist, update only affected compatible dependencies and
   lockfile, rerun raw audit/Doctor/typechecks/tests and local Android runtime
   validation. Replace the expired-exception gate with normal fail-on-high audit
   behavior only as part of that verified remediation; do not extend exceptions.

Expo Doctor currently passes 20/21; the failed check is the two patch mismatches.
Mobile TypeScript passes and the mobile-named regression subset passes 53/53.
The complete repository suite passes 294/294 under Node 22.13.1. Web production
audit reports zero vulnerabilities. Web lint has 0 errors and 19 warnings.
All pre-build Web quality gates passed. The initial build without environment
variables failed during prerendering with missing Supabase configuration. Rerun
with CI placeholders (`https://example.supabase.co`, `placeholder-anon-key`) passed
compilation, TypeScript, all 23 static pages and bundle budgets. Pascal import.meta
dependency warnings remain. Placeholders were scoped to the command process;
no environment file was created. This is build validation, not authenticated E2E.
Results are in local `basoul-local/web-quality.log` and `web-build-ci.log`.
Raw audits and other check logs are retained alongside them.

Authenticated development still needs approved non-production Supabase environment
configuration. No production connection, EAS build, deployment, workflow activation,
commit, push, merge, or Cloud migration was performed. `error.log` is preserved.
