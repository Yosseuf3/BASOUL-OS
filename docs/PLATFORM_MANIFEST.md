# YOSSEUF Platform Manifest

The executable manifest lives in `packages/platform/src/manifest.ts`. It declares Platform identity, compatibility with YOSSEUF OS v3.1.0, release channel, governance authority, and environment boundaries.

The v4 foundation is additive: existing product routes and database resources remain available while modules adopt the Platform registry. HQ remains authoritative for ecosystem governance; this repository owns only product runtime contracts.

## Architecture boundaries

- Platform modules register capability, route, lifecycle status, and legacy resource mapping.
- The module loader exposes only modules allowed by the caller's capability set.
- Configuration is loaded once through the Platform configuration contract.
- Production database behavior is unchanged by Sprint 1.
- R2 research integrations remain outside the production module graph.
