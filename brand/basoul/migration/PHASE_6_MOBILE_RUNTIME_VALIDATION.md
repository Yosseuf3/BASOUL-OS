# BASOUL Migration Phase 6 — Mobile Runtime Validation

Status: EXECUTION

## Objective
Validate that the BASOUL-branded Expo application can bundle cleanly for iOS and Android before any signed store build, credential mutation, bundle identifier change, package change, EAS identity change, or submission.

## Validation strategy
1. Static mobile quality gate.
2. Expo Doctor.
3. iOS JavaScript/native asset export using Expo export.
4. Android JavaScript/native asset export using Expo export.
5. Verify Expo display identity resolves to BASOUL and the approved app icon is configured.
6. Preserve all signed/external identifiers.

## Explicitly preserved
- slug: `yosseuf-os`
- scheme: `yosseufos`
- iOS bundleIdentifier: `com.yosseufradwan.os`
- Android package: `com.yosseufradwan.os`
- EAS projectId: `6f770730-8c8e-49b0-81b9-f9773faf567a`
- Supabase/Auth/API/database configuration
- buildNumber/versionCode

## Why no signed build yet
A signed EAS/TestFlight/Play build can consume build quota and may involve credentials or external account actions. This phase proves runtime bundle readiness first. Once green, the next gate is a deliberate device/distribution build decision.
