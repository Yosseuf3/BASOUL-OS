# BASOUL v4.0.0-beta.2 — Final Release Gate

Release candidate authority: `main` after PR #95.

Required before publication:
- Web Quality Gate PASS.
- Mobile Quality Gate PASS.
- v4.0.0-beta.2 release consistency PASS.
- Vercel Preview READY for this final release branch when quota permits.
- Final smoke check of login, locale toggle persistence, Dashboard, Finance, Administration and representative workspace navigation.
- No Blocker or Critical tester defect open.

Publication mechanism:
- Merge this release-preparation PR to `main` only after the gate passes.
- The one-shot GitHub Actions publisher creates prerelease tag/release `v4.0.0-beta.2` against the merge SHA.

No Production promotion, Supabase mutation, RLS/Auth change, external identifier change, domain change or signing change is part of this gate.
