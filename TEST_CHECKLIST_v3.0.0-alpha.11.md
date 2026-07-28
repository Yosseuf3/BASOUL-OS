# YOSSEUF OS v3.0.0-alpha.11 — Test Checklist

- [ ] Apply `supabase/migration_v3.0.0_alpha.11.sql`.
- [ ] Add a room, wall, opening, label, and dimension from the web review screen.
- [ ] Correct an existing plan element and verify its status becomes `corrected`.
- [ ] Confirm and reject detected elements from web and mobile.
- [ ] Verify value, unit, confidence, source, and drawing link appear correctly.
- [ ] Verify one user cannot read or mutate another user’s plan elements.
- [ ] Verify the empty state appears when no structured elements exist.
- [ ] Verify web and mobile TypeScript checks pass.
- [ ] Verify lint and the web production build pass.
- [ ] Verify Expo Doctor and Android preview build pass.

This release requires the Alpha.11 Supabase migration.
