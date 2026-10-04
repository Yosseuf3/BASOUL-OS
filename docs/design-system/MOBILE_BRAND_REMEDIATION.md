# Mobile brand remediation — approval reconciliation

Baseline: `c87a1f63c3ab88dfb6572d0790fa1a333746a6c8`.
This is an implementation record, not new brand approval.

## Evidence and precedence

Original raster artwork is approved by `brand/basoul/foundation/SUPPLIED_README.md`
and `brand/basoul/specs/manifest.json`, derived from the approved reference under
`brand/basoul/reference/`. These assets are used unchanged.

`docs/design-system/BASOUL_VISUAL_SOURCE_OF_TRUTH.md`, introduced in canonical
commit `befbd03dbe1f1c6d4da99b63f82ed80acf35561c`, explicitly declares
APPROVED / LOCKED FOR PRODUCT MIGRATION and lists the product palette.
It is approval documentation, not Web implementation evidence.

| Semantic | Implemented value | Approval source |
| --- | --- | --- |
| Primary / action accent | #2563EB | Locked source: Electric blue; also early Phase 2 plan |
| Secondary / OS / focus / info | #38B2F6 | Locked source: Light blue and OS family direction |
| Violet | #8B5CF6 | Locked source: Violet; later explicit product-migration authority supersedes early #7C3AED direction |
| Background | #0B1020 | Locked source: Midnight |
| Native surface / subtle surface | #1B2230 | Locked source: Neutral surface |
| Primary / secondary text | #FFFFFF / #E5E7EB | Locked source: White / Light neutral |

The shared `identity.json` contains only these resolved colors. Native imports
it directly; Web consumes generated `identity.css` plus the same JSON in its
TypeScript adapter. A regression test checks generation freshness.

## Unresolved values — not new approvals

- A distinct native raised-surface shade is not specified. Existing YVL
  `surfaceElevated` (#111A24) remains a mechanical fallback, not approved identity.
- Exact cyan #06B6D4 versus Web #00E0D1 is unresolved. No new native cyan identity
  is added. Existing Web cyan is preserved, not promoted to shared approved tokens.
- Early four-stop gradient #2563EB → #38B2F6 → #06B6D4 → #7C3AED conflicts with
  the later violet specification; no reconciled gradient is implemented in Native.
  Existing Web gradients retain their appearance, referencing shared resolved stops.
- Existing Web base surface #11182A, muted/border/status/disabled/hover/glow
  mechanics are preserved. This task does not approve or redesign them.

YVL spacing, radius, motion, elevation and status mechanics are unchanged.
Legacy foundation gold is no longer a BASOUL Native identity input.
Small accent text uses the approved sky secondary (`accentText`), not blue
action-fill color. Existing dark-on-gold action labels/selection labels/loading
indicators now use approved white on blue. These targeted foreground changes
preserve readability across all affected Mobile screens; regression checks
require at least 4.5:1 for white-on-blue and sky-on-midnight/neutral pairs.

## Assets, typography and release boundary

- Login: original `BASOUL_Primary_Logo_Master.png`, contain-fit, accessible label.
- Dashboard: original `BASOUL_OS_Lockup.png`, compact contain-fit header.
- Launcher: unchanged approved 1024 artwork; SHA256 pinned in regression test.
- Footer: reads `app.json` version, with a runtime test using a different version.
- Typography: **DEFERRED — approved Inter font files/source required.** User
  explicitly authorized deferral. No fonts downloaded/added/substituted; existing
  system fallback remains, not represented as Inter.
- Organization logo/data contract, light theme, splash and adaptive icon: deferred.
- No app/package/EAS identity, versionCode, environment, backend or signing changes.
- No merge or EAS build authorized. Physical-device regression remains required.

## Visual/runtime evidence boundary

Local Android and iOS Metro/Hermes exports include both original PNG logo assets.
Component-execution regression tests verify that Login and Dashboard render those
assets with accessible labels and contain-fit, rather than merely importing them.
The app-icon equality/hash test verifies the unchanged launcher artwork.

An existing Pixel_10 emulator was started headlessly for screenshots. Its initial
skin configuration was unavailable; a command-line numeric skin enabled boot.
The emulator subsequently displayed a System UI ANR. The Expo CLI-fetched Expo Go
kernel reported runtimeVersion 54.0.0, not this project's SDK 57. No capture is
represented as a successful BASOUL runtime screenshot. Emulator/physical visual
regression is **NOT CONFIRMED**; review the source/assets now and obtain SDK-57
compatible runtime evidence before approving a subsequent release step.
The emulator and development server started for this attempt were stopped.

Web build validation uses the same process-local URL/anon-key fixtures as
`.github/workflows/quality.yml`; an initial build without those fixtures failed
on missing local Supabase environment variables. No production environment
configuration or backend was changed.

## Changed-file audit

Local clean validation: root/mobile `npm ci`; full tests **191/191** (seven new
tests), camera-fit **2/2**; lint **0 errors / 19 existing warnings**; Web/Mobile
TypeScript PASS; Web quality/production build/all bundle budgets PASS; Mobile
quality/Expo Doctor **21/21**; Android/iOS runtime exports PASS. Production Web
audit reports zero vulnerabilities; Mobile production policy passes with only
the unchanged exact node-forge/braces exceptions, expiring 2026-10-16. Unauthorized
HIGH/CRITICAL: zero. Brace-expansion remains **5.0.12**. Existing Pascal import.meta
build warnings are unchanged. Native emulator visual regression is not confirmed.

No manifests, lockfiles, approved artwork, app configuration, backend,
environment, signing or workflow files changed.

- `packages/basoul-yvl-adapter/src/identity.json`: resolved approved colors, single source.
- `packages/basoul-yvl-adapter/src/identity.css`: generated Web consumption.
- `scripts/generate-basoul-identity.mjs`: reproducible generation/freshness validation.
- `packages/basoul-yvl-adapter/src/index.ts`: removes legacy gold Web identity metadata.
- `packages/basoul-yvl-adapter/src/native.ts`: resolved palette and readable accent-text mapping; preserves unresolved mechanics.
- `packages/basoul-yvl-adapter/src/web.css`: consumes shared colors without changing resolved Web appearance.
- `mobile/App.tsx`: configuration-derived version label.
- `mobile/src/features/auth/LoginScreen.tsx`: approved primary logo, white-on-blue button label/indicator.
- `mobile/src/features/dashboard/DashboardScreen.tsx`: compact approved OS logo and readable accent text.
- `mobile/src/components/yvl-primitives.tsx`: readable accent badge text/loading indicator.
- `mobile/src/features/administration/AdministrationScreen.tsx`: accent-text foreground only.
- `mobile/src/features/architecture/architecture-review-screen.tsx`: accent-text foregrounds and action-label contrast only.
- `mobile/src/features/command-center/CommandCenterScreen.tsx`: accent-text foregrounds only.
- `mobile/src/features/create/CreateTaskScreen.tsx`: accent-text/action/selection foregrounds and loading contrast only.
- `mobile/src/features/notifications/NotificationsScreen.tsx`: accent-text foregrounds only.
- `mobile/src/features/projects/ProjectsScreen.tsx`: accent-text foreground only.
- `mobile/src/features/search/GlobalSearchScreen.tsx`: accent-text foreground only.
- `mobile/src/features/tasks/TasksScreen.tsx`: accent-text/action/selection foregrounds only.
- `mobile/src/features/timeline/TimelineScreen.tsx`: accent-text foreground only.
- `tests/mobile-brand-identity.test.mjs`: seven executable identity/rendering/hash/version/contrast regressions.
- `tests/yvl-product-integration.test.mjs`: replaces obsolete legacy-gold import expectation with shared identity contract.
- `docs/design-system/MOBILE_BRAND_REMEDIATION.md`: provenance, unresolved/deferred scope, validation/evidence boundary and file audit.
