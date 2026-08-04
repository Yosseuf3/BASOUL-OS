# Test Report — v3.1.0

Target: YOSSEUF Platform Staging only

## Authorization regression suite

- Core browser writes route through the authenticated server boundary.
- Client-controlled identity fields are removed.
- Verified user and organization identity are injected server-side.
- Every business table is present in both organization-foundation and RLS migrations.
- Permission matrix and forced-RLS declarations are asserted.
- Unsafe user metadata and deprecated role helpers are rejected by static regression checks.

## Live database probes

- Active member create/read: PASS.
- Viewer create denial: PASS (`42501`).
- Cross-organization create denial: PASS (`42501`).
- RLS catalog coverage: PASS (16/16 tables, four policies each, forced RLS).

Final local lint, typecheck, unit tests, and production build results are recorded in the pull request and CI.

Final manual Staging smoke test: 14/14 assertions passed. Smoke data was rolled back and cleanup was verified.
