# BASOUL v4.0.0-rc.2

BASOUL v4.0.0-rc.2 advances the field-verified Beta 2 baseline through the current Release Candidate gate while preserving the historical pre-BASOUL v4.0.0-rc.1 tag and release intact.

## Candidate basis

- Beta 2 selected tester campaign completed successfully.
- No open Blocker or Critical defects at RC entry.
- Production Beta 2 manually verified after the final Administration RBAC visibility correction.
- Arabic / English switching and RTL / LTR behavior verified in field testing.
- Finance long-form mobile modal scrolling verified on iPhone Safari.
- Organization Administration navigation is visible only to Owner/Admin and remains constrained by existing RBAC/RLS authority.
- Web and mobile Quality Gates passed on the RC line.

## Included stabilization

- Approved BASOUL Brand Foundation and original Symbol/Wordmark assets preserved.
- Canonical YVL mechanics and BASOUL semantic adapter boundaries preserved.
- Email + Password remains the primary development authentication path.
- Owner / Admin / Member / Viewer authority boundaries preserved.
- Login release label is sourced from canonical APP_INFO.
- Web and mobile package metadata aligned to v4.0.0-rc.2.
- Web dependency audit passes at the configured high-severity threshold.

## External distribution exceptions

- Android EAS preview build queuing is blocked by the current free-plan monthly build quota; local/CI validation, Expo Doctor, identity boundary and credentials checks pass before the quota gate.
- iOS development distribution remains blocked by missing suitable internal-distribution signing credentials in non-interactive EAS mode. Existing bundle/package/EAS identifiers are preserved.

These external distribution constraints do not alter the validated web/mobile source baseline and do not trigger identifier, signing, billing or production changes.

## RC policy

No feature expansion. Only release-blocking or evidence-backed stabilization fixes may enter the RC line.

## Safety boundary

Production identifiers, repository names, Supabase project IDs, RLS/Auth configuration, domains, package/bundle/signing identifiers and billing remain unchanged by RC preparation.

## Legal

Copyright © 2026 ELSHENAWY RADWAN. All rights reserved.
