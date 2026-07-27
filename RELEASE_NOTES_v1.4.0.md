# YOSSEUF OS v1.4.0 — Platform & Mobile Foundation

## Added

- Portable shared domain types package.
- Typed platform event bus package.
- Explicit package manifests for reusable platform modules.
- Next.js local-package transpilation configuration.
- Installable web-app manifest and YOSSEUF OS icons.
- Standalone Expo SDK 57 mobile foundation with executive dashboard concept and Supabase configuration boundary.
- Platform architecture documentation and mobile activation gate.

## Changed

- Decision Engine no longer imports web-only aliases.
- Dashboard consumes Decision Engine through its package identity.
- Root project version updated to 1.4.0.

## Database

No Supabase migration is required.

## Important

The native mobile app is deliberately installed separately in this release to protect the React 18 production web application from Expo SDK 57's React 19 dependency tree.
