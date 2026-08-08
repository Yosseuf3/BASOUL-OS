# BASOUL Migration Phase 2 — Non-Production Visual Branding

Status: EXECUTION BOUNDARY

## Objective
Apply the approved BASOUL visual identity to non-production preview/staging surfaces only, without changing production runtime behavior or protected system identifiers.

## Approved visual source of truth
- Primary BASOUL lockup: approved geometric B symbol + BASOUL wordmark with triangular A.
- Tagline: THINK • BUILD • BEYOND.
- Primary: Electric Blue `#2563EB`.
- Violet: `#7C3AED`.
- Cyan-flow gradient: `#2563EB → #38B2F6 → #06B6D4 → #7C3AED`.
- Foundation: dark navy / neutral surfaces with white/light text.
- Typography: Inter, Light through Extra Bold.
- Clear space: X = height of the A in the wordmark.
- Minimum reference sizes: 28 mm primary lockup; 14 mm symbol-only.

## Identity integrity rules
Do not skew, recolor outside the approved system, stretch/distort, add unapproved effects, or separate/reconstruct the approved icon/wordmark lockup.

## Phase 2 allowed scope
1. Preview/staging-only visual branding surfaces.
2. Non-production presentation of approved BASOUL assets.
3. Preview/staging theme tokens that map strictly to the approved palette.
4. Preview/staging typography presentation using Inter.
5. Visual QA documentation and regression evidence for affected non-production surfaces.

## Protected / excluded scope
Phase 2 MUST NOT change:
- Production deployment or production branding.
- Runtime/business behavior.
- Supabase, database, Auth/RLS, APIs, schemas, or data.
- Secrets or environment variables.
- Package scopes/names or signed mobile identifiers.
- Expo/EAS identity.
- Domains, DNS, redirects, or Vercel production identity/configuration.
- CI/CD behavior except validation needed to prove this phase is non-production-only.
- Git history or historical release tags.
- Founder/personal identity: YOSSEUF RADWAN remains Founder / Personal Brand.
- Approved BASOUL source assets themselves.

## Acceptance gates
- Every changed surface is demonstrably non-production.
- Approved BASOUL visual assets and colors are unchanged.
- No protected identifier or production route/configuration changes.
- Existing quality gates remain green.
- Any ambiguity defaults to PRESERVE / NO CHANGE and is deferred to a later approved phase.
