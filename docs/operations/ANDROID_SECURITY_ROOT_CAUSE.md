# Android security root-cause assessment

Date: 2026-10-23. Inspected checkpoint `209d36e3bd6aa70a438ddffd5d4c99dbf782d895`, branch `codex/path-aware-release-gates`. PR #174 remains at its integration checkpoint; #175 was not modified in this task.

**Decision: BLOCKED — no supported published fix found.** No dependency, audit policy, cryptographic implementation or signing configuration was changed. Per the requested stop condition, no remediation commit, security branch push or Draft PR was created. This evidence report remains local/uncommitted.

## Exact four HIGH entries

Fresh `npm --prefix mobile audit --omit=dev --json` and `npm --prefix mobile ls node-forge --all` identify one installed vulnerable implementation and three inherited parent findings, not four independent cryptographic advisories:

| Audit entry | Locked version | Cause/path |
|---|---|---|
| `node-forge` | 1.4.0 | Actual vulnerable package; single deduplicated installation |
| `@expo/code-signing-certificates` | 0.0.6 | Parent inherits HIGH from node-forge |
| `@expo/cli` | 57.0.32 | Parent inherits HIGH directly from node-forge and through certificates |
| `expo` | 57.0.31 | Direct application dependency inherits HIGH from CLI |

Complete paths from the mobile application root:

```text
yosseuf-platform-mobile@4.0.0
└─ expo@57.0.31
   └─ @expo/cli@57.0.32
      ├─ node-forge@1.4.0
      └─ @expo/code-signing-certificates@0.0.6
         └─ node-forge@1.4.0 (deduplicated)
```

Actual advisory: [GHSA-86w9-cpqp-85rv / CVE-2026-85393](https://github.com/advisories/GHSA-86w9-cpqp-85rv), RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements; HIGH, CVSS 7.5, CWE-347. Affected versions: **<=1.4.0**; advisory explicitly lists **no patched version**. The registry audit source is 1240912. Do not confuse patches in 1.4.0 for older Ed25519/RSA advisories with a fix for this advisory.

Parent audit ranges are propagated reachability ranges, not additional vulnerability IDs: certificates `*`; Expo `>=45.0.0-beta.1`; CLI `<=0.0.0-canary-20231123-1b19f96-4 || >=0.0.1-canary-20231125-d600e44`. The installed parent versions above are the relevant evidence. The audit reports four HIGH, zero CRITICAL and zero other findings.

## Execution exposure

- **Android JavaScript runtime:** no direct forge or certificates import found in `mobile/App.tsx` or `mobile/src`; the installed paths originate in Expo's Node CLI dependency. This supports a tooling classification. No APK/bundle was built or inspected here, so absence from every release artifact is not certified. Expo being a production dependency causes npm's production audit to include its bundled tooling.
- **Expo CLI/development host:** confirmed installed consumer. `expo/package.json` requires `@expo/cli`; CLI `build/src/utils/codesigning.js` calls certificates' `signBufferRSASHA256AndVerify` for development manifests. Its iOS signing utility also imports node-forge. Removing a visible application import would not remove this graph.
- **Certificate/signature verification:** actual vulnerable functionality is used by the installed certificates package. `build/main.js:176` verifies a self-signed certificate; line 203 verifies an RSA/SHA-256 signature; line 246 verifies a CSR. These are real verification call sites, not an unused arbitrary dependency. Exploitability of a particular call depends on control of certificate/signature input; no exploit was executed and no reachable input was automatically treated as trusted.
- **EAS/build/signing infrastructure:** the local project config selects SDK 57 build infrastructure and Node 22.13.1. This dependency can execute on hosts running the Expo CLI/certificate tools. No EAS build, remote image inspection or hosted EAS dependency audit was performed, so the exact remote EAS service graph is unverified. Manifest code signing and Android APK/AAB keystore signing are distinct; this finding does not prove an APK signature forgery or a production keystore compromise.

## Supported upstream releases checked

Fresh npm registry metadata:

- `node-forge` latest is **1.4.0**, still affected.
- `expo` SDK 57 tag is **57.0.31**, already installed; its CLI dependency is `^57.0.32`.
- Latest published CLI 57 release is **57.0.32**, requiring forge `^1.3.3` and certificates `^0.0.6`. Neither removes the vulnerable implementation.
- Latest certificates **0.0.7** still requires forge `^1.4.0`; upgrading that parent alone cannot fix the advisory and is not proposed as remediation.
- Latest overall Expo **58.0.17** / CLI **58.1.14** is not an SDK 57-compatible patch. CLI 58 metadata still requires forge `^1.4.0` and certificates `^0.0.7`, so a major Expo upgrade is not evidence of a fix either.

[Upstream CLI manifest](https://github.com/expo/expo/blob/main/packages/@expo/cli/package.json) and [certificates manifest](https://github.com/expo/code-signing-certificates/blob/main/package.json) corroborate continued forge usage; registry metadata was used for exact published versions. [SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) is the compatibility reference. No canary, git fork or unpublished patch was installed.

Npm audit's suggested `expo@44.0.6` is a major backward downgrade, not a supported SDK 57 remediation. `fixAvailable:true` on a transitive parent does not establish a compatible clean dependency graph. No `npm audit fix --force` was run.

## Removal/replacement assessment

Forge is not a direct app dependency that can simply be removed; it is required by the SDK's CLI and certificate package. Removing `expo-dev-client` would not remove the direct Expo-to-CLI path. Deleting transitive package directories, changing dependency classification merely to omit an audit, or installing an alternate package under forge's name would break package integrity or hide the finding.

Replacing forge with native Node crypto would require upstream-compatible API coverage and a separately reviewed certificate/ASN.1/RSA verification design plus signing interoperability tests. No such approved design or supported SDK 57 replacement was found. No blanket override, crypto patch, exception extension, severity downgrade or ignored advisory was introduced.

## Validation

| Check | Result |
|---|---|
| Clean `npm --prefix mobile ci` on Node 22.13.1 | PASS; 498 packages installed, four HIGH still reported |
| Strict `npm --prefix mobile run audit:production` after clean install | **FAIL**, four HIGH / zero CRITICAL, no exceptions permitted |
| Mobile TypeScript | PASS |
| Expo Doctor | PASS, 21/21 |
| Full repository test suite | PASS, 368/368 (includes mobile/shared contracts) |
| SDK compatibility | Doctor passes; SDK 57.0.31 / React Native 0.86.3 retained |
| Android target SDK | Installed RN Gradle version catalog declares 36; Expo modules fallback declares 36; no project override found |
| Actual APK/AAB target/signature | NOT EXECUTED; no native generated project/artifact or EAS build in this task |

Identity remains BASOUL, Android application ID `com.yosseufradwan.os`, version 4.0.0/versionCode 32, scheme `yosseufos`, existing EAS project `6f770730-8c8e-49b0-81b9-f9773faf567a`. `mobile/eas.json` remains Node 22.13.1, SDK 57 image, existing internal/production profiles. No signing keys, remote credentials or signing configuration were accessed/changed; app config contains no explicit updates signing configuration. Profile existence is not verification of remote credentials or a signed release artifact.

Root and mobile manifests/locks remained unchanged; shared package files have no diff. Web dependencies were not reinstalled or modified. Previous Web-clean evidence remains separate; a new Web audit/build is not claimed for this unchanged graph.

## Remaining blocker and safe alternatives

The requested elimination cannot currently be achieved with a supported published SDK 57 dependency update: the only actual vulnerable package has no published patched version, and both required parent paths remain. Keep strict Android release and affected shared/CI integration gates blocked.

Safe next steps are to await a verified upstream fix and compatible Expo adoption, or obtain a separately reviewed security design for an upstream replacement/fork with full signing verification and provenance evidence. A fork is an engineering/security review project, not an automatically safe fix. Do not adopt Expo 44, disable signing, remove mandatory checks or change the clock/exception date. The current restrictions provide no compliant route to a clean Android release until a supported fix or separately approved design exists.

No comments or changes were posted to #174/#175 during this assessment. Existing untracked `AGENTS.md`, `CLAUDE.md`, readiness report and `error.log` were preserved. Audit/registry/validation logs reside privately under `.git/basoul-local/`; no logs or credentials were staged. No branch protection, production data or deployment was touched.
