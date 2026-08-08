# BASOUL Migration Phase 3C — Package Manifest Rename

Status: IN PROGRESS

## Approved scope
Manual approval was granted for the Phase 3 package identity changes after the compatibility layer was merged.

Executed inventory records:
- INV-003 `yosseuf-platform` → `basoul-platform`
- INV-004 `@yosseuf/platform` → `@basoul/platform`
- INV-005 `@yosseuf/shared-types` → `@basoul/shared-types`
- INV-006 `@yosseuf/decision-engine` → `@basoul/decision-engine`
- INV-007 `@yosseuf/event-bus` → `@basoul/event-bus`
- INV-008 `@yosseuf/core` → `@basoul/core`
- INV-009 `@yosseuf/services` → `@basoul/services`
- INV-010 `@yosseuf/intelligence` → `@basoul/intelligence`
- INV-012 `@yosseuf/cognitive-core` → `@basoul/cognitive-core`
- INV-013 `@yosseuf/architectural-intelligence` → `@basoul/architectural-intelligence`

## Intentionally preserved
- INV-011 `@yosseuf/ui-tokens` is not renamed because the approved inventory marks it REVIEW_MANUALLY and defines its future state as a BASOUL adapter package rather than a direct rename.
- INV-014 `@yosseuf/yvl-tokens` remains NEVER_TOUCH.
- Legacy `@yosseuf/*` TypeScript resolution aliases remain available during the compatibility window.
- YOSSEUF RADWAN remains Founder / Personal Brand.

## Dependency updates
Package-local dependencies that point to renamed packages are moved to the BASOUL namespace in the same manifest change.

## Protected boundaries
No repository rename, domain switch, production Vercel identity change, Supabase/Auth/RLS/database migration, mobile bundle/package identifier change, Expo/EAS identity change, secret/environment-variable change, or YVL source change is authorized by Phase 3C.

## Lockfile gate
The lockfile is not considered complete until CI/npm validates it against the renamed workspace manifests. If npm reports lockfile drift, the lockfile must be regenerated atomically before this PR can merge.

## Rollback
Revert the Phase 3C commit set. The previously merged dual namespace aliases provide an immediate source-resolution fallback while package manifests and lockfile are restored together.
