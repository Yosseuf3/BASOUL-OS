# ADR — Pascal adoption for BASOUL Architecture

Status: **GO — selective adoption, not wholesale application adoption**

## Decision

Use Pascal as a replaceable architecture engine behind BASOUL-owned adapters. Do not fork or adopt the full Pascal application as the BASOUL product shell.

### Adopt
- `@pascal-app/core` — scene graph, schemas, registry, geometry/domain primitives.
- `@pascal-app/viewer` — 3D rendering runtime behind a BASOUL-owned UI boundary.
- selected `@pascal-app/nodes` bundles required by supported architectural elements.

### Pilot with hard gates
- `@pascal-app/ifc-converter` — real IFC4 smoke conversion passed, but maintain a BASOUL regression corpus because upstream conversion is incomplete for some element classes and known IFC edge cases exist.
- Pascal MCP — only through constrained BASOUL Architecture Tools and BASOUL authorization; never expose raw MCP operations directly to an AI agent.

### Do not adopt as product shell
- Full Pascal application / permanent Pascal Editor UI. The editor package currently publishes TypeScript source and exposes upstream beta type instability to consumers. BASOUL should own product UI, permissions, persistence, identity and design system.

## Verified PoC gates

- BASOUL host strict typecheck: PASS.
- Constrained AI architecture tool: PASS — edit permission required, invalid geometry rejected, organization metadata attached.
- Tenant persistence contract: PASS — organization/project scope required; proposed RLS is deny-by-default and uses existing `private.has_permission(...)` IAM pattern.
- Real IFC4 conversion: PASS using `04-ifc-open-house.ifc` from Pascal's public fixture set.
  - 15 scene nodes generated.
  - 1 site, 1 building, 1 level.
  - 4 walls with plausible metric lengths.
  - 2 slabs, 1 door, 4 windows, 1 roof.
  - 26 catalog-dependent items were skipped by the upstream converter; this is a known capability gap and must remain observable.
- Next.js 16 production build: PASS.

## Integration boundary

```text
BASOUL Product UI / Domain
        |
        v
BASOUL Architecture Adapter
        |
        +--> Pascal Core / Viewer / selected Nodes
        +--> IFC Adapter (gated)
        +--> BASOUL Architecture Tools (AI-safe)
        |
        v
Supabase organization-scoped persistence
```

## Production gates before launch

1. Apply the scene schema only to the actual BASOUL Supabase environment, then run security/performance advisors and cross-tenant RLS tests.
2. Commit a deterministic dependency lockfile and keep Pascal versions pinned behind compatibility tests.
3. Package `web-ifc` WASM assets explicitly for browser/server deployment.
4. Build an IFC regression corpus covering IFC2x3, IFC4, slabs, openings, multi-level buildings and malformed/edge-case geometry.
5. Benchmark editing/rendering at agreed scene sizes (including 100/300 walls and multi-level scenes).
6. Keep BASOUL UI, IAM, persistence and audit trail independent from Pascal internals.
7. Upgrade Pascal only through the adapter compatibility suite; never allow upstream beta changes to directly break BASOUL production.

## Rationale

The PoC proves that Pascal materially accelerates the 3D/scene/BIM foundation while remaining technically isolatable. Its beta packaging and incomplete IFC coverage make wholesale adoption too risky. Selective adoption captures most of the engineering leverage while preserving BASOUL ownership and replaceability.
