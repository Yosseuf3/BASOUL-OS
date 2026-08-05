# Breaking Changes Report — v4.0.0-rc.1

No intentional runtime breaking changes were introduced.

- Private package identity changes from `yosseuf-os-cloud` to `yosseuf-platform`.
- Product metadata now displays YOSSEUF Platform.
- Existing workspace APIs, table names, Supabase variables, mobile bundle identifiers, URL scheme, and legacy resource mappings are preserved.
- New APIs use a versioned response envelope and require authenticated organization membership.

If an undiscovered consumer depends on the private package name or visible OS title, rollback by reverting Sprint 4; data contracts are unaffected.
