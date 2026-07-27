# YOSSEUF OS v2.2.1 — Release Consistency Hotfix

## Fixed
- Replaced the stale hard-coded sidebar label `v1.5.0 · Mobile Live Foundation`.
- Added one canonical application metadata source at `lib/config/app-info.ts`.
- Updated web, mobile, Expo, Android, and iOS release metadata to v2.2.1.
- Corrected Expo release metadata that still referenced v2.1.0.

## Added
- `npm run check:release` to prevent inconsistent or stale release labels from shipping again.
- Release consistency validation is now part of the web quality command.

## Deployment
Merge or copy this package to `main`. Vercel should automatically deploy the new production build. The sidebar must show `v2.2.1 · Release Consistency Hotfix`.
