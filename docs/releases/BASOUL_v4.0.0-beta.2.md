# BASOUL v4.0.0-beta.2 — Bilingual Stabilization

## Purpose
Beta 2 is the first BASOUL build prepared for a selected external tester group after the BASOUL identity migration.

## Included
- BASOUL naming unification across primary user-facing product surfaces.
- Restored Arabic / English language control with persisted user preference.
- Automatic RTL / LTR document direction switching.
- Bilingual authentication and account recovery surfaces.
- Bilingual workspace switcher and organization administration.
- Bilingual Executive Dashboard, Decision Engine, Finance, Search, Activity, Notifications and Quick Create.
- Production administration backend activated with Owner / Admin / Member / Viewer authority boundaries.
- Mobile Safari long-modal scrolling regression fixed and physically verified on iPhone.
- BASOUL administration navigation restored.

## Tester focus
1. Sign in and sign out.
2. Switch Arabic / English, refresh, and confirm the preference persists.
3. Verify RTL / LTR alignment and navigation on mobile and desktop.
4. Create, edit and delete representative Projects, Tasks, Clients, Finance, Content and Knowledge records using test data only.
5. Verify Finance long-form scrolling on iPhone Safari.
6. Verify Administration visibility and role-appropriate controls.
7. Report any remaining untranslated legacy labels as localization defects.

## Safety boundary
- Production identifiers, repository names, Supabase project IDs, package IDs and signing identifiers remain unchanged.
- No Production RLS weakening is included.
- Testers must not be given Owner credentials or service-role secrets.

## Known localization debt
The legacy monolithic Projects / Tasks / Clients / Content / Knowledge implementation still contains some Arabic-only deep labels and dialogs. These are accepted as tester-visible localization defects for Beta 2 and must not be interpreted as missing language-switch functionality. They are tracked for extraction into localized feature modules.

## Copyright
Copyright © 2026 ELSHENAWY RADWAN. All rights reserved.
