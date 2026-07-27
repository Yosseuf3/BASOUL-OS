# Test Checklist — v1.4.0

## Web release gate

- [ ] `npm install` completes from repository root.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Authentication still works.
- [ ] Dashboard loads and Decision Engine output appears.
- [ ] Project creation and Project Workspace still work.
- [ ] `/manifest.webmanifest` returns the YOSSEUF OS manifest.
- [ ] Browser offers installation where PWA criteria are supported.

## Mobile foundation

- [ ] `cd mobile && npm install` completes.
- [ ] `.env` contains the Expo-prefixed Supabase values.
- [ ] `npm run start` launches Expo.
- [ ] Foundation dashboard renders on Android/iOS simulator or Expo Go.
- [ ] RTL text, cards, and primary action render correctly.

## Regression

- [ ] No browser console errors.
- [ ] Existing Supabase data remains unchanged.
- [ ] No database migration was executed.
