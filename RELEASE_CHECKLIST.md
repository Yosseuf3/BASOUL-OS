# Historical Release Checklist — YOSSEUF OS v3.1.0

> **Historical evidence only.** This checklist documents the pre-BASOUL v3.1.0 release line and is not the current product/release authority. The active technology identity is **BASOUL**, with the current beta baseline tracked in the BASOUL Beta release records under `docs/releases/`. Preserve this file for provenance; do not use its legacy product name or version as current presentation.

## Source integrity

- [x] Local release branch is based on current `origin/main`.
- [x] PR #37 merge commit `91d2310f8cf44a45a22cddb2e996d0779f14fcdd` is included.
- [x] All 34 pull requests merged to `main` are ancestors of the release candidate.
- [x] Web, mobile, Expo, and application metadata report `3.1.0`.
- [x] Expo dependencies are aligned to `~57.0.10` and the mobile lockfile is committed.
- [x] Release notes contain no temporary restore paths, container identifiers, secret material, or staging migration artifacts.

## IAM and recovery evidence

- [x] Staging IAM smoke suite passed 14/14.
- [x] PR #37 CI passed.
- [x] IAM verification, RLS, and test reports are committed.
- [x] Fresh Production logical backup was created read-only and hashed.
- [x] Isolated PostgreSQL restore rehearsal passed.
- [x] Business data, Auth users, Storage metadata, indexes, constraints, and RLS policies reconciled.
- [x] Database, RLS, application, environment-variable, and Storage rollback procedures are prepared.

## Release validation

- [x] `npm run check:release`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test` — 5/5 passed.
- [x] `npm run build`
- [x] `npm run validate:foundation`
- [x] `npm run validate:a11y`
- [x] `npm run analyze:bundle`
- [x] `npm run mobile:typecheck`
- [x] `npm run mobile:doctor` — 20/20 passed.
- [x] GitHub Actions checks pass for the stable release commit.

## Publishing

- [x] Release documentation committed to `main`.
- [x] Annotated tag `v3.1.0` points to the stable release commit.
- [x] Tag pushed to GitHub.
- [x] Draft GitHub Release created from `RELEASE_NOTES_v3.1.0.md`.
- [x] Release remains unpublished pending final publishing approval.

## Production separation

- [x] No Production deployment performed during release preparation.
- [x] No database migration performed during release preparation.
- [x] No Supabase project or configuration modified during release preparation.
- [x] Vercel Production deployment remains separately approval-gated.
