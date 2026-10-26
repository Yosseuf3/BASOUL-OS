# PR #177 — Mobile Zod compatibility and remediation assessment

Date: 2026-10-25. Baseline security commit: `a4a6c5b2f1cfb21fd27f259903d433d9a5ab7b61`.

**Result: BLOCKED on supported upstream remediation. Do not merge while Mobile quality fails.** No compatible dependency correction was found. No dependency override, major replacement, advisory exception, severity downgrade, audit filtering, Expo/signing change or production migration is introduced by this assessment. All completed P0 policies, invitation fixes and PostgreSQL tests are preserved.

## Exact CI failure and independent dependency trees

CI run 40162911931, Mobile quality job 121078029995, fails `npm run audit:production` because the fresh npm audit includes GHSA-mrhx-c7xc-m3w5 in addition to the existing node-forge advisory. The existing script correctly rejects this new, unapproved advisory. Failure occurs before Mobile typecheck/Doctor in CI; those checks were executed independently locally rather than misreported as CI passes.

| Tree / dependency | Version / declared range |
|---|---|
| Root Web Zod | 4.6.7, resolved by root package-lock.json |
| Web parents | @pascal-app/core ^4.3.5, @pascal-app/editor ^4.3.6; compatible with 4.6.7 |
| Mobile direct Expo | 57.0.31, pinned in mobile/package.json |
| Expo -> CLI | @expo/cli ^57.0.32; resolved 57.0.32 under mobile/node_modules/expo/node_modules |
| CLI -> Zod | ^3.25.76; resolved mobile/node_modules/zod@3.25.76 |
| Mobile direct Zod dependency | None |
| Root workspaces | packages/*; Mobile is not a workspace |
| Mobile lockfile | Independent mobile/package-lock.json; local file dependencies link selected shared packages |

Thus Web's Zod 4 does not remediate Mobile's separate CLI tree. Shared local package links do not make the two npm installations one dependency tree. Root and Mobile manifests, both lockfiles, runtime imports, installed resolution and the failed CI audit were inspected. No direct Zod import was found in Mobile application/shared package source inspected; the identified consumer is CLI tooling, not a direct Android application dependency. This is not a complete APK/runtime artifact proof and does not establish remote EAS infrastructure safety.

## Current upstream evidence

- [Official advisory GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): affected `<4.6.6`, first patched 4.6.6; updated 2026-10-23T18:26:52Z.
- npm registry enumeration: latest stable Zod 3 is 3.25.76. Latest stable Expo SDK 57 is 57.0.31 and CLI 57 is 57.0.32; all inspected latest CLI 57 releases still declare Zod ^3.25.76. A normal compatible `npm --prefix mobile update zod --package-lock-only --ignore-scripts` made no lockfile change in the previous investigation; the declared ranges still have no patched compatible selection.
- [Upstream fix a0ebf970f2d752e5f58527cd2942ff48be4f46bd](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd) changes Zod v4 collection parsing and size checks. No compatible published Zod 3 backport was identified. Merely switching a package version/alias to Zod 4 or its `/v3` entrypoint is not a verified fix of the legacy parser and is not permitted here.

## Reachable tooling call sites and bounded reproduction

Published CLI paths below are relative to `mobile/node_modules/expo/node_modules/@expo/cli/build/src/`:

- `start/server/DevToolsPlugin.schema.js`: imports Zod; validates plugin configuration, command/parameter arrays and plugin output arrays. These arrays have no upper collection bound.
- `start/server/DevToolsPlugin.js`: invokes PluginSchema.safeParse on plugin configuration.
- `start/server/DevToolsPluginCliExtensionResults.js`: parses plugin JSON output and invokes DevToolsPluginOutputSchema.safeParse. Its output accumulation cap is V8's maximum string length, not a conservative validation/resource budget; issue formatting also iterates validation errors.
- `start/server/createMCPDevToolsExtensionSchema.js`: imports Zod to construct schemas from plugin commands/parameters.
- `start/server/MCPDevToolsPluginCLIExtensions.js`: constructs the MCP extension schema and validates output with DevToolsPluginOutputSchema.
- `start/server/MCP.js`: optional MCP tunnel setup requires EXPO_UNSTABLE_MCP_SERVER and installed MCP packages. Turning it off would reduce that route's exposure but does not eliminate the non-MCP plugin validation route or remove the vulnerable package.

A small, non-exhaustive diagnostic used the exact installed resolver for each tree: `z.array(z.string().refine(() => { visited++; return true; })).max(1).safeParse(Array(128).fill('x'))`. Both reject the input, but Web 4.6.7 visits **0** elements whereas Mobile CLI's 3.25.76 visits **128**. No oversized memory-exhaustion payload or remote endpoint was used. This demonstrates why an eventual size rejection is not sufficient to claim early resource bounds. It is not a hosted exploit or a complete exploitability assessment.

To reproduce with existing installs, createRequire from root package.json versus mobile/node_modules/expo/node_modules/@expo/cli/package.json, require('zod'), then execute the expression above and report only version/visited/success. No credentials or database access are needed.

## Narrow mitigation assessment — not applied or accepted as remediation

| Option | Assessment / residual risk |
|---|---|
| Published Zod 3 patch within ^3.25.76 | Preferred smallest fix; none currently identified. Would require clean installation, raw audit and strict policy, CLI/plugin behavior tests and full SDK 57 checks. |
| Supported SDK-57 Expo/CLI update accepting patched parser | Preferred parent fix; no current compatible release identified. Revalidate all tooling paths and existing exception topology without extending its expiry or scope. |
| Force Zod 4 via override, alias, direct dependency or rewritten lock | Rejected. CLI's declared major range excludes it; deduplication/install success alone proves neither API nor behavior compatibility. |
| Move dependencies to dev-only / omit tooling from audit | Rejected as gate evasion. Expo is a runtime package with a real CLI dependency; reclassification does not remove build-host exposure. |
| Disable optional MCP, use localhost-only development, trusted plugins/configuration and a restricted disposable build host with external resource limits | Operational containment candidate only. Does not cover all CLI entry points or prevent every resource-exhaustion failure; remote EAS behavior unverified. No audit PASS, release approval or mandatory-check exemption follows. No configuration changed automatically. |
| Narrow upstream/fork patch with pre-parse byte, collection-count, nesting and issue budgets at actual plugin boundaries | Design candidate only. Must bound streams before accumulation and JSON.parse as well as schema traversal; test synchronous/asynchronous paths, command/MCP output, valid plugin compatibility and error reporting. Needs independent security/maintainer review, reproducible artifact/integrity and maintenance/rollback plan. A locally patched 3.25.76 still matches the advisory and cannot be called audit-clean. No patch installed here. |

Requested upstream outcome: an officially supported Zod 3 backport or SDK-57 CLI release with a supported patched dependency and bounded input handling. Until then retain FAIL. A separately reviewed fork/patch cannot silently satisfy the existing raw dependency audit; resolving acceptance policy would require an explicit security decision, which this PR neither makes nor bypasses.

## Validation and release decision

Fresh clean installations completed for root and Mobile. Repository Mobile-focused tests **51/51 PASS**; Mobile TypeScript PASS; Expo Doctor **21/21 PASS**; actual isolated PostgreSQL authorization regression PASS. Strict Mobile audit **FAIL** with five HIGH package entries and zero CRITICAL: expo, @expo/cli, @expo/code-signing-certificates, node-forge, zod. These are two underlying advisories, not five independent exploits. Raw node-forge remains unresolved under the pre-existing temporary policy ending **2026-10-30T00:00:00Z**; Zod is not excepted. No dates or policy scope changed.

Full Web/Mobile repository test, build and audit evidence is recorded in PR #177 and the release-readiness report after final validation. Previous exact-baseline Web quality CI passed all its checks; no skipped Mobile CI steps are presented as passed. No native emulator, EAS build, production deployment or database migration is performed in this task.

**Merge recommendation: HOLD until mandatory Mobile quality passes legitimately.** Production migrations remain unapplied and require separate explicit approval. Do not merge, weaken required checks, force a major replacement or promote Production to close this blocker cosmetically.
