# Platform Architecture Report — v4.0.0-rc.1

YOSSEUF OS v3.1.0 has evolved additively into YOSSEUF Platform. The Platform package owns the manifest, registry, module loader, API contracts, configuration, and navigation metadata. Existing product modules and routes remain the implementation; no duplicate business product was created.

HQ remains the governance authority. This repository owns runtime contracts. Production Supabase is unchanged during the RC Epic, Staging is the migration validation target, and R2 is absent from the production module registry.

The main risk is tenant-context drift between legacy personal organizations and explicit organization selection. Server membership checks and PostgreSQL RLS provide independent controls. Rollback is application-first: revert the Sprint commits and redeploy the previous Preview. Production requires no rollback because it was not promoted.
