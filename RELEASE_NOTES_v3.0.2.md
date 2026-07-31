# YOSSEUF OS v3.0.2 — Foundation v1 Migration

YOSSEUF OS now uses YOSSEUF Design System Foundation v1.0.0 as the shared visual foundation across web and mobile.

## Highlights

- Adopted canonical semantic design tokens for color, typography, spacing, radius, elevation, motion, and focus states.
- Added dark, light, and high-contrast theme support while retaining compatibility aliases for the existing product UI.
- Centralized React Native theme values through the shared `@yosseuf/ui-tokens` workspace package.
- Added RTL-safe layout foundations, reduced-motion behavior, and stronger focus/high-contrast handling.
- Aligned Expo patch dependencies (`expo` 57.0.9, `expo-dev-client` 57.0.10, React Native 0.86.2).
- Advanced iOS build number and Android version code to 31.

## Verification

- Web lint, TypeScript, and production build pass.
- Mobile TypeScript passes.
- Expo Doctor passes all 20 checks.
- GitHub web and mobile quality checks pass for the migration PR.
- Vercel production deployment completed from the merged migration commit.

This release does not change database schemas or user data.
