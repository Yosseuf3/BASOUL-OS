# Unified Business Modules

Platform v4 registers the existing CRM, Projects, Tasks, Finance, Knowledge, Documents, and Notifications resources as modules. It does not create competing products or duplicate persistence.

`GET /api/platform/modules/{module}` returns a versioned envelope scoped to the authenticated organization. Existing `/api/workspace/{resource}` routes remain available for v3.1 clients.

AI Core and Digital Human are read-only gateway health adapters. They expose configuration and reachability without write permissions, background polling, or secret material. Gateway URLs remain server-only environment variables.

Navigation is derived from the same registry and filtered by capabilities, keeping labels, routes, permissions, and API discovery aligned.
