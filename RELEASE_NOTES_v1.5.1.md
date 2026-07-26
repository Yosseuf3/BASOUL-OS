# YOSSEUF OS v1.5.1 — Cross Platform Stabilization

## Fixed

- Added the missing `mobile/eas.json` that blocked Expo GitHub builds.
- Aligned Expo SDK 57 packages with React 19.2.3 and React Native 0.86.
- Added `expo-dev-client` required by the EAS development profile.
- Added mobile EAS ignore rules to prevent secrets and local build files from uploading.

## Improved

- Added development, preview, and production EAS build profiles.
- Added Android APK output for easy preview installation.
- Added mobile TypeScript and Expo Doctor quality checks.
- Expanded GitHub Actions to validate web and mobile separately.
- Added platform health, build, release, and roadmap documentation.

## Required one-time actions

- Run `eas init` from `mobile/` to link the Expo project and write its project ID.
- Configure EAS environment variables for Supabase.
- Complete the first EAS build from the CLI before relying on GitHub-triggered builds.
