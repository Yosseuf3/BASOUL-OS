# BASOUL Migration Architecture v1

## Status and boundary

Status: planning and verification only. This architecture changes no runtime, production branding, repository identity, package, application, deployment, domain, Supabase project, database, environment variable, API, Auth configuration, YVL rule, or approved BASOUL asset.

YOSSEUF RADWAN is the Founder and Personal Brand and must be preserved. BASOUL is the candidate Technology Masterbrand. Founder identity, authorship, copyright, account ownership, and historical attribution must never be bulk-replaced.

## Classification model

Each inventory record has exactly one category:

1. `RENAME` — a controlled future value replacement.
2. `PRESERVE` — retain as valid identity or compatibility state.
3. `REDIRECT` — introduce a new destination while keeping an old entry route.
4. `DEPRECATE` — retain temporarily with an announced end condition.
5. `REVIEW_MANUALLY` — no execution until system owner evidence and approval exist.
6. `NEVER_TOUCH` — immutable by default; a later architecture must prove a safe exception.

## Architecture layers

| Layer | Examples | Default control |
|---|---|---|
| Founder/legal identity | YOSSEUF RADWAN, authorship, owner accounts | PRESERVE |
| Visual foundation | approved BASOUL raster assets and reference | NEVER_TOUCH |
| Historical/audit | Git history, tags, released notes, deployment IDs | NEVER_TOUCH |
| Security/data identity | UUIDs, Auth IDs, keys, database identifiers | NEVER_TOUCH |
| Compatibility contracts | API routes, headers, package scopes, domains | dual-run before deprecation |
| Display identity | docs, web labels, mobile labels | phased rename with artifact rollback |
| External identity | GitHub, Vercel, Supabase labels, stores, social | manual approval and provider rollback |

## Execution gates

No phase may start until all earlier phase evidence is accepted. Each execution phase requires: immutable baseline capture, exact target inventory rows, owner approval, rollback rehearsal, success metrics, abort thresholds, and a change window. A category never implies authorization.

The stable identifiers listed in `RENAME_POLICY.md` remain `NEVER_TOUCH` unless a later, separately approved architecture provides compatibility evidence, provider constraints, rollback proof, and stakeholder signatures.

## Audit method

The inventory was built from tracked repository text/configuration, package manifests, web/mobile metadata, release documentation, deployment configuration, database/migration references, and known linked external systems. Rows are unique by ID and system/value responsibility. External dashboards must be recaptured immediately before any future execution because their state is time-sensitive.
