# YOSSEUF OS v1.4.0.1 — PWA Manifest Build Hotfix

## Fixed

- Corrected the invalid combined icon purpose `any maskable` in `app/manifest.ts`.
- The 512×512 PWA icon now uses the valid `maskable` purpose accepted by `MetadataRoute.Manifest`.
- Updated the application display version to v1.4.0.1.

## Deployment

- No Supabase migration is required.
- Push this package to the production branch and allow Vercel to rebuild.
