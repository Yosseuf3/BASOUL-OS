# BASOUL Migration Phase 5 — Mobile Branding

Status: COMPLETED FOR REVIEW

## Objective
Apply BASOUL as the mobile display identity while preserving signed and externally coupled mobile identifiers.

## Changed in this phase
- Expo display name: `YOSSEUF Platform` → `BASOUL`
- Mobile product display metadata: `YOSSEUF Platform` → `BASOUL`
- Mobile presentation lockups/kickers: `YOSSEUF Platform` / `YOSSEUF OS` → `BASOUL`
- Approved BASOUL 1024px app icon copied byte-for-byte to `mobile/assets/icon.png`
- Expo `icon` configured as `./assets/icon.png`
- Existing Arabic mojibake in mobile presentation TSX files repaired to valid UTF-8 during the branding pass

## Explicitly preserved
- Expo slug: `yosseuf-os`
- URL scheme: `yosseufos`
- iOS bundle identifier: `com.yosseufradwan.os`
- Android package: `com.yosseufradwan.os`
- EAS projectId: `6f770730-8c8e-49b0-81b9-f9773faf567a`
- iOS build number: `32`
- Android versionCode: `32`
- Supabase/Auth/API/database configuration
- YVL and protected token namespaces

## Validation evidence
- `mobile/app.json` resolves display identity to BASOUL while all protected identifiers above remain unchanged.
- Mobile Login, Dashboard and Executive Command Center presentation strings render as valid Arabic UTF-8 and expose BASOUL display labels.
- The app icon is sourced from the approved BASOUL Brand Foundation asset.

## Safety boundary
This phase changes presentation identity only. It does not create a new signed application identity and does not sever compatibility with existing mobile deep links, authentication callbacks, EAS project linkage, or store identifiers.

## Rollback
Revert the Phase 5 merge commit. No database, auth, domain, package-identifier, signing-identity, or EAS project rollback is required.
