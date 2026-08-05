# API Report — v4.0.0-rc.1

## New endpoints

- `GET|POST /api/platform/organizations`
- `GET|POST /api/platform/workspaces`
- `GET /api/platform/modules/{crm|projects|tasks|finance|knowledge|documents|notifications}`
- `GET /api/platform/gateways/{ai-core|digital-human}`

Organization-aware endpoints accept `X-YOSSEUF-Organization`. The server validates the bearer token and active membership. Business module responses use API version `2026-08-05`, a bounded result limit of 1–200, explicit partial-failure metadata, and private no-store caching. Legacy workspace CRUD APIs remain available.
