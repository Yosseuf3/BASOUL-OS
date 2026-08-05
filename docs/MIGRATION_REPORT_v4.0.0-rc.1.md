# Migration Report — v4.0.0-rc.1

The migration is additive. Existing v3.1 clients may omit `X-YOSSEUF-Organization` and continue resolving their personal organization. New clients may select an organization explicitly after active membership verification.

The database artifact adds `organization_workspaces` with organization ownership, indexes, grants, and forced RLS. It does not rename or remove existing business tables. Migration cost is low for application clients and moderate for database rollout. Rollback cost is low while no durable workspace records depend on the new table.

Staging application completed successfully on 2026-08-05. Production application remains explicitly out of scope for this release candidate.
