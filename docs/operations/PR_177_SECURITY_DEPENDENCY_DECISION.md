# PR #177 — dependency inventory and owner risk decision

Date: 2026-10-25. Starting head: `9b406bc14c5b9891981c1b9e0c8b917065f7421e`.

**No new exception approved or implemented. No existing exception extended. Production remains HOLD.** This assessment separates Web dependency remediation from Android tooling risk while retaining both existing required quality checks. P0 RLS/invitation migrations and their tests are unchanged.

## Exact baseline inventory

Fresh `npm audit --json` (root), `npm --prefix mobile audit --omit=dev --json`, `npm ls --all` filtered to affected packages, lockfiles and official advisory metadata were inspected. Five Mobile and six Web HIGH entries are package entries, not eleven independent advisories. There are six underlying advisories below, including one MODERATE advisory attached to a package whose overall severity is HIGH.

### Advisory identities and affected implementations

| ID | Severity | Affected range relevant to this repository | Patched version | Functionality |
|---|---|---|---|---|
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | HIGH | node-forge <=1.4.0 | None identified; latest 1.4.0 | RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements; possible certificate/signature authenticity failure. |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | HIGH | zod <4.6.6 | 4.6.6 | Collection validation can consume excessive memory/CPU before rejecting input; Mobile CLI has 3.25.76, Web already has 4.6.7. |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | MODERATE | brace-expansion <1.1.21 | 1.1.21; other maintained lines 2.1.7 / 3.0.9 / 5.0.12 | Quadratic CPU consumption expanding malformed brace patterns. |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | HIGH | brace-expansion <1.1.20 | 1.1.20; other lines 2.1.6 / 3.0.8 / 5.0.11 | Uncontrolled recursion on nested brace groups; stack-exhaustion DoS. |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | HIGH | brace-expansion <1.1.19 | 1.1.19; other lines 2.1.5 / 3.0.7 / 5.0.10 | parseCommaParts recursion; stack-exhaustion DoS. |
| [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | HIGH | js-yaml >=4.0.0 <4.3.2 | 4.3.2; 3.x >=3.0.0 <3.15.2 fixed in 3.15.2 | maxTotalMergeKeys fails to bound CPU for empty YAML merge sources. |

For brace-expansion, official advisories additionally list affected 2.x, 3.x and >=4.x branches up to the patched versions shown. Repository baseline installed only 1.1.18 because of its root override; normal minimatch 10 resolution now uses patched 5.0.12.

### All five Mobile HIGH entries

Mobile root is `mobile/package.json`, separate from root workspaces (`packages/*`). Zod is not a direct Mobile dependency. Logical dependency chains below are complete from Mobile's direct Expo dependency; filesystem hoisting does not change parent relationships.

| Audit entry / installed version | Exact audit aggregate range | Logical path / underlying advisory | Compatible remediation |
|---|---|---|---|
| expo 57.0.31 | >=45.0.0-beta.1 | Mobile -> expo -> @expo/cli -> forge/Zod; inherited F/Z, no independent Expo advisory | No patched SDK-57 parent identified. |
| @expo/cli 57.0.32 | <=0.0.0-canary-20231123-1b19f96-4 OR >=0.0.1-canary-20231125-d600e44 | Mobile -> expo -> @expo/cli -> node-forge, @expo/code-signing-certificates, zod; inherited F/Z | Latest stable CLI 57 still requires Zod ^3.25.76 and forge ^1.3.3. |
| @expo/code-signing-certificates 0.0.6 | * | Mobile -> expo -> @expo/cli -> @expo/code-signing-certificates -> node-forge; inherited F | Latest 0.0.7 still requires forge ^1.4.0; not a vulnerability fix and outside CLI's ^0.0.6 range. |
| node-forge 1.4.0 | Package aggregate `*`; direct advisory <=1.4.0 | Mobile -> expo -> @expo/cli -> node-forge; also CLI -> @expo/code-signing-certificates -> node-forge; F | No supported patched version identified. |
| zod 3.25.76 | <4.6.6 | Mobile -> expo 57.0.31 -> nested @expo/cli 57.0.32 -> zod 3.25.76; Z | Fixed 4.x is outside ^3.25.76; latest Zod 3 remains 3.25.76. |

F = GHSA-86w9-cpqp-85rv; Z = GHSA-mrhx-c7xc-m3w5. Both have HIGH base severity. The existing node-forge exception covers four inherited package entries, not Zod. Raw Mobile audit remains five HIGH, zero CRITICAL. No finding is hidden by inherited parent classification.

### All six baseline Web development HIGH entries

| Entry / installed version | Audit aggregate range | Complete representative path / advisory |
|---|---|---|
| eslint 9.39.5 | 9.39.4 - 9.39.5 | Web -> eslint -> minimatch 3.1.5 -> brace-expansion 1.1.18; also eslint -> @eslint/config-array or @eslint/eslintrc -> minimatch; inherited brace advisories, no separate ESLint advisory |
| @eslint/config-array 0.21.2 | 0.21.2 | Web -> eslint 9.39.5 -> @eslint/config-array -> minimatch 3.1.5 -> brace-expansion 1.1.18; inherited brace advisories |
| @eslint/eslintrc 3.3.6 | >=3.3.5 | Web -> eslint 9.39.5 -> @eslint/eslintrc -> minimatch 3.1.5 -> brace-expansion 1.1.18; inherited brace advisories; also parent of vulnerable js-yaml |
| minimatch 3.1.5 and 10.2.6 | Empty aggregate range; child-dependent | Web -> eslint -> minimatch 3.1.5 -> brace-expansion 1.1.18; Web -> eslint-config-next 16.3.3 -> typescript-eslint 8.65.0 -> @typescript-eslint/typescript-estree 8.65.0 -> minimatch 10.2.6 -> overridden brace-expansion 1.1.18 |
| brace-expansion 1.1.18, two installations | <=1.1.20 | Both paths above; three direct brace advisories in advisory table. Other 3.1.5 paths also include eslint-config-next -> eslint-plugin-import / jsx-a11y / react -> minimatch -> brace-expansion. |
| js-yaml 4.3.1 | 4.0.0 - 4.3.1 | Web -> eslint 9.39.5 -> @eslint/eslintrc 3.3.6 -> js-yaml 4.3.1; GHSA-2883-xcg3-v3hh |

These are npm dev-tree packages executing during CI/local lint and configuration processing. Untrusted brace patterns or YAML merge structures could affect build-host availability. They are not dependencies of the independent Mobile tree. Root production audit excluded them; no deployed-server or client exploit is demonstrated by these lint-package findings. Absence from an npm production tree is not a universal assertion about every vendored library or remote build infrastructure.

## Supported Web correction applied

Removed the existing blanket `brace-expansion:1.1.18` root override rather than widening or adding one. This restores parent-supported dependency majors: minimatch 3 -> brace-expansion **1.1.21**, and minimatch 10 -> brace-expansion **5.0.12** -> balanced-match **4.0.4**. Updated js-yaml **4.3.1 -> 4.3.2**, within @eslint/eslintrc's ^4.3.0 range. ESLint stays 9.39.5, minimatch versions unchanged, no ESLint 10 migration needed. Lockfile relocation/removal of the invalid nested 1.x override is intentional. Other overrides and all Mobile dependencies remain unchanged. This is supported remediation of all six Web entries, not risk acceptance.

## Production exploitability and residual risk

- Expo runtime modules and Expo CLI are distinct. CLI tooling is executed for Metro development/export and can be reached in build workflows; do not assume EAS uses a safe different dependency graph. No remote EAS execution or signing flow was tested here.
- Forge verification is actually called in @expo/code-signing-certificates/build/main.js (certificate.verify, certificate.publicKey.verify, CSR verification). CLI utils/codesigning.js consumes that package for development-manifest certificate/signing flows; CLI run/ios/codeSigning/Security.js also imports forge. An invalid signature accepted by those operations is an integrity risk, not just a theoretical install-time finding. Current app has no Expo Updates/code-signing configuration according to the enforced existing policy; no new signing change is made.
- Zod call sites and bounded reproduction are detailed in PR_177_MOBILE_ZOD_REMEDIATION.md: plugin configuration/output and optional MCP tooling. Malformed input can deny build/development-host availability. Bounded test confirms legacy parser walks oversized collections. Trusted plugin origin reduces likelihood, not severity or advisory status.
- Android local export/source-map evidence is recorded in final PR validation. Such evidence establishes the tested JavaScript graph only, not signed APK contents, native dependencies or remote EAS behavior. No EAS build or release approval follows from an export.
- Web residual dependency risk after correction: fresh clean installation reports **zero vulnerabilities**, including development dependencies; deployment/RLS/schema/recovery gates remain independent. Mobile residual finding severity remains HIGH for authenticity (forge) and availability (Zod), even if tested runtime bundle excludes their code.

Actual local Android export: `expo export --platform android --source-maps --no-bytecode --max-workers 2`, using placeholder public Supabase configuration, succeeded. Production-mode minified JavaScript source map contains **691 sources**: 55 under Expo runtime and exactly one under @expo/cli, `build/metro-require/require.js`. That Metro loader is not the affected Zod/plugin/certificate verification implementation. **Zero Zod, node-forge or @expo/code-signing-certificates sources** and no affected CLI plugin/signing sources appeared. Do not describe all CLI code as absent. This export is JavaScript without Hermes bytecode, not a signed APK/AAB or an EAS build.

Bundle SHA-256: `c4ecec0c565fff230f8f0a03a23d8b29b4844d1e2ab79612ffc76993d1574837`; map SHA-256: `6bcd349264f0c7b0a6660e1ee706ecf13ccb17dbbed534d3b40c8a86f6b3d537`. Private evidence under the original repository `.git/basoul-local/android-security-resolution/` includes bundle/map, metadata and dependency-evidence.json. No production credentials used.

| Mobile entry | Tested Android JavaScript graph | CI/build/local execution assessment |
|---|---|---|
| expo | Runtime sources present; inherited package finding does not identify vulnerable Expo runtime code | Expo CLI executes during local export; tools/configuration are installed by CI. |
| @expo/cli | Metro loader only; affected plugin/signing implementations absent | CLI is build/development tooling. Feature-specific signature/plugin validators are reachable, but invocation of those validators by mandatory CI checks or remote EAS is not established. |
| @expo/code-signing-certificates | Absent | Used by CLI manifest/certificate features; not solely a local-development dependency guarantee, because remote build/signing reachability is unverified. |
| node-forge | Absent | Certificate/CSR/signature operations in tooling when called; remote signing exposure is unverified. |
| zod | Absent | CLI plugin/configuration/MCP validation when used. Mandatory CI audit identifies it even if no plugin validation runs. |

This evidence lowers demonstrated application-runtime exposure, not the HIGH severity of a vulnerable host operation. No exposed app endpoint or customer-data exploit was demonstrated. Host availability/authenticity risk remains conditional on input/feature reachability and needs the controls below, not an automatic exception.

## Owner decision proposal — NOT APPROVED / NOT IMPLEMENTED

The repository's current exception mechanism is `scripts/audit-mobile-production.mjs`: exact versions and topology, runtime-import restrictions, no Expo Updates/code-signing configuration, hard UTC expiration and rejection of all unapproved advisories. Existing forge acceptance expires **2026-10-30T00:00:00Z**. This task neither extends it nor adds a Zod exception.

**Conditional justification:** a short CI/integration-only exception for Zod's CLI DoS could be considered for owner/security review after the controls below are verified. It is not justified as unrestricted Android release acceptance. The forge integrity risk remains a separate decision under its already approved scope; Zod approval cannot cover it or extend its date.

Proposed decision record:

| Field | Proposed value |
|---|---|
| State | PENDING owner/security approval; current CI continues to FAIL |
| Scope | This repository's SDK-57 CLI validation/build-tooling path only; no Android distribution, EAS build, production deployment or signing authorization |
| Advisory | GHSA-mrhx-c7xc-m3w5, HIGH, visible in raw npm JSON and CI summary |
| Exact topology | expo 57.0.31 -> nested @expo/cli 57.0.32 -> one zod 3.25.76, declared ^3.25.76; no runtime import or additional Zod parent allowed |
| Expiration | **2026-10-28T00:00:00Z (03:00 Cairo)**, fixed absolute deadline; no automatic renewal; never extends the existing forge date |
| Acceptance owner | Repository owner plus independent security reviewer; identities/approval record required before implementation |
| Rejection / revocation | Any new HIGH/CRITICAL advisory, topology/version change, runtime reachability, untrusted plugin/input requirement, unavailable control evidence, or expiration immediately fails CI |

Compensating controls required before any implementation: trusted reviewed lockfiles/plugins only; untrusted fork/plugin validation in a disposable resource-limited host without signing/production credentials; no externally reachable Metro/devtools tunnel, optional MCP disabled; verified bounds before parsing any external plugin data; regenerate and inspect the Android production-mode JavaScript graph for affected modules; keep raw audit artifacts and the HIGH label visible on every run; reject new advisories and fail automatically at the deadline. Input bounds must precede buffering/JSON parsing and schema walking; merely disabling MCP does not cover all plugin paths. Resource limits contain host impact but do not make a failing parser safe. Current evidence does not verify all these controls, so approval is not presumed.

If approved later, implement a separately reviewed exact-advisory/topology check with explicit UTC expiry and visible raw audit output; never change general severity thresholds or remove required checks. No such code is included here. A local/fork parser patch would still match the advisory and is not audit-clean; requires separate maintainer/security review and integrity/maintenance plan. Preferred exit is an official Zod 3 backport or supported SDK-57 CLI update accepting a patched implementation. Latest stable Expo 57.0.31, CLI 57.0.32 and certificate package 0.0.7 do not currently supply that exit. Do not force Zod 4 or its legacy /v3 alias.

## Release and merge decisions

Web and Android dependency decisions are separate: repaired Web tooling does not authorize Android release, and Android's advisory does not by itself prove Web runtime exposure. However PR #177 includes shared database/security changes and existing repository rules require both Web quality and Mobile quality. Keep these checks intact; while Mobile fails, merge remains HOLD. Production SQL application and Vercel Production promotion require separate explicit approvals and are not performed by this work.

Final exact-head CI, local regression and bundle evidence are recorded in the PR description and release-readiness report. No UI work, customer-data testing, production migration or security exception implementation occurred.
