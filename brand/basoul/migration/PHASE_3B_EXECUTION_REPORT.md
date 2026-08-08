# BASOUL Migration Phase 3B — Package Compatibility Layer

Status: IN PROGRESS

## Objective
Introduce BASOUL package-resolution aliases before any package-name or import rewrite, so existing `@yosseuf/*` imports remain functional during migration.

## Executed inventory scope
This increment implements the compatibility-first part of `INV-015` only. It does not yet execute package-name changes in `INV-003` through `INV-013`.

## Changes
- Added `@basoul/*` TypeScript path aliases pointing to the same internal package entry points as their existing `@yosseuf/*` aliases.
- Preserved every existing `@yosseuf/*` path alias.
- Preserved `@yosseuf/yvl-tokens` without adding or renaming a BASOUL alias because YVL remains separately governed and is `NEVER_TOUCH` under `INV-014` / `INV-059`.
- Added BASOUL aliases to Next.js `transpilePackages` alongside existing YOSSEUF aliases where those packages are already transpiled.

## Compatibility contract
During Phase 3B both namespaces may resolve internally:
- `@yosseuf/*` = legacy compatibility namespace
- `@basoul/*` = new migration namespace

No consumer import is migrated in this increment. No package manifest `name` is changed in this increment.

## Explicitly unchanged
- `package.json` and package-level `package.json` names
- lockfiles
- all existing source imports
- YVL / `@yosseuf/yvl-tokens`
- runtime behavior and APIs
- mobile / Expo / EAS identifiers
- Supabase / Auth / RLS / database
- environment variables and secrets
- domains / redirects / Vercel production identity
- Git history and repository name
- YOSSEUF RADWAN Founder / Personal Brand

## Rollback
Revert this Phase 3B commit set. Because no source import or package name is changed, rollback is configuration-only and does not require data, deployment, Auth, or mobile rollback.

## Next gate
Only after CI is green may a later Phase 3B increment migrate a small set of internal consumer imports to `@basoul/*`, with `@yosseuf/*` aliases retained as compatibility fallbacks.
