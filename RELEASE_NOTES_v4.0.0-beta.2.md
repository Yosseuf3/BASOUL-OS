# BASOUL v4.0.0-beta.2

Bilingual stabilization release prepared for selected tester validation after the BASOUL identity migration.

## Highlights

- BASOUL naming unified across primary user-facing surfaces.
- Arabic / English language switching restored with persisted preference.
- Automatic RTL / LTR document direction switching.
- Bilingual authentication, recovery, workspace administration, Dashboard, Finance, Search, Activity, Notifications and Quick Create.
- Legacy shell/topbar language reactivity fixed after mobile-web tester feedback.
- Known system-generated historical activity prefixes localized at display time without mutating stored records.
- Finance long-form modal scrolling fixed and physically verified on iPhone Safari.
- Organization administration exposed and backed by Owner / Admin / Member / Viewer authority boundaries.
- Approved BASOUL Brand Foundation assets and canonical YVL mechanics preserved.

## Verification

- Web Quality Gate: PASS.
- Mobile Quality Gate: PASS.
- Release consistency: PASS.
- Foundation validation: PASS.
- Accessibility structural baseline: PASS.
- TypeScript and unit/contract tests: PASS.
- Web production dependency audit: 0 vulnerabilities at the Beta 2 release gate.
- Final Vercel release Preview: READY.
- Arabic ↔ English shell reactivity physically verified on iPhone mobile web.

## Known non-blocking debt

Some deep labels/dialogs in the legacy monolithic Projects / Tasks / Clients / Content / Knowledge implementation may remain Arabic-only. They are tracked as localization debt and do not block the Beta 2 tester release.

## Safety boundary

- Production identifiers, repository names, Supabase project IDs, package IDs, domains and signing identifiers are unchanged.
- No Production RLS weakening is included.
- Testers must not receive Owner credentials, service-role keys or secrets.

## Legal

Copyright © 2026 ELSHENAWY RADWAN. All rights reserved.
