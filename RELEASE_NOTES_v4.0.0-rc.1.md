# YOSSEUF Platform v4.0.0-rc.1

This release candidate introduces the unified Platform foundation while preserving YOSSEUF OS v3.1 product behavior.

## Added

- Platform manifest, registry, module loader, configuration, and navigation contracts.
- Organization-aware workspaces, membership context, RBAC, policies, middleware, APIs, and database migration.
- Unified read APIs for CRM, Projects, Tasks, Finance, Knowledge, Documents, and Notifications.
- Read-only AI Core and Digital Human gateway health adapters.
- Versioned API envelopes, bounded queries, migration guidance, and architecture evidence.

## Safety

- Production Supabase and Production Vercel are untouched.
- Existing resources and workspace APIs remain compatible.
- R2 remains isolated.
- Database rollout requires separate Production approval after Staging verification.
