# BASOUL Ecosystem Pass B — Dependency & Overlap Analysis

Date: 2026-08-10
Status: Analysis only. No repository archive, rename, delete, merge, production promotion, or financial decision is performed by this document.

## Executive conclusion

The ecosystem is not nine equal products. It is a layered system with four distinct responsibilities:

1. **Governance and execution control**: `yosseuf-hq` + `YOSSEUF-Program-Management`
2. **Engineering intelligence / portal**: `YOSSEUF-Platform`
3. **Runtime products**: `YOSSEUF--OS` (BASOUL OS) + `YOSSEUF-R1`
4. **Research and shared foundations**: `YOSSEUF-R2-Research-Lab` + `yosseuf-design-system`

Two repositories sit outside this clean model and need explicit disposition:

- `YOSSEUF-OS-V1`: historical runtime implementation; archive candidate after evidence extraction.
- `yosseuf-ai-core`: incomplete/ambiguous authority; quarantine candidate until a product contract is approved.

The strongest no-regret architecture is therefore **not** to collapse everything into one monorepo. Instead, preserve authority boundaries and remove only duplicated or obsolete implementations.

---

## 1. Repository role map

| Repository | Current role | Runtime authority | Governance authority | Recommended disposition |
|---|---|---:|---:|---|
| `Yosseuf3/YOSSEUF--OS` | BASOUL OS business operating system, Web + Mobile | **YES** | No | **KEEP / PRIMARY** |
| `Yosseuf3/YOSSEUF-R1` | AI Digital Human / intelligent interaction runtime | **YES** | No | **KEEP / PRIMARY** |
| `Yosseuf3/yosseuf-hq` | ecosystem registry, roadmap, risks, ADRs, releases, governance | No | **YES** | **KEEP / CANONICAL GOVERNANCE** |
| `Yosseuf3/YOSSEUF-Program-Management` | PMO execution visibility, milestones, dependencies, capacity, reporting | No | Delegated execution | **KEEP / INTERNAL CONTROL** |
| `Yosseuf3/YOSSEUF-Platform` | read-only engineering intelligence and documentation portal | Presentation only | No | **KEEP FOR NOW / REDUCE OVERLAP** |
| `Yosseuf3/YOSSEUF-R2-Research-Lab` | isolated experimental research | No production | No | **KEEP / ISOLATED RESEARCH** |
| `Yosseuf3/yosseuf-design-system` | old shared design foundation and mechanics | Shared package source | No | **TRANSITION / EXTRACT MECHANICS** |
| `Yosseuf3/YOSSEUF-OS-V1` | legacy OS implementation | Historical only | No | **ARCHIVE CANDIDATE** |
| `Yosseuf3/yosseuf-ai-core` | nominal AI Core, currently incomplete/general starter shape | Unclear | No | **QUARANTINE / REDEFINE OR ARCHIVE** |

---

## 2. Dependency graph

```text
                         ┌──────────────────────┐
                         │      BASOUL HQ       │
                         │ governance authority │
                         └──────────┬───────────┘
                                    │
                      policy / registry / roadmap
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 v                  v                  v
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │ BASOUL PMO     │  │ BASOUL Platform│  │ Runtime Lines  │
        │ execution ctrl │  │ read-only intel│  │ OS + R1        │
        └────────────────┘  └────────────────┘  └───────┬────────┘
                                                        │
                                      shared contracts / identity / data
                                                        │
                             ┌──────────────────────────┼─────────────────────┐
                             v                          v                     v
                       ┌────────────┐             ┌────────────┐       ┌────────────┐
                       │ BASOUL OS  │             │ BASOUL R1  │       │ R2 Research│
                       │ business   │             │ AI runtime │       │ isolated   │
                       └────────────┘             └────────────┘       └────────────┘
                             │                          │
                             └──────────┬───────────────┘
                                        v
                               ┌─────────────────┐
                               │ Visual mechanics│
                               │ YVL / adapters  │
                               └─────────────────┘
```

### Important rule

`yosseuf-design-system` must not remain the visual-brand authority. BASOUL Brand Foundation is identity authority. YVL/foundation packages may remain mechanics authority for spacing, semantic roles, motion, accessibility, RTL and platform adapters.

---

## 3. Overlap analysis

### 3.1 HQ vs Platform

**Overlap:** repository inventory, release visibility, status dashboards, documentation discovery, engineering health.

**Difference:** HQ is authoritative and writable through governed repository changes; Platform is explicitly read-only presentation/intelligence.

**Recommendation:** keep both, but enforce a hard boundary:

- HQ owns canonical records.
- Platform consumes HQ and other repositories as evidence.
- Platform must not create a second lifecycle/status registry.
- Any Platform-local metadata that duplicates HQ should be removed or generated from HQ.

**Risk if left unresolved:** two competing truths for project status, ownership, releases and risks.

### 3.2 HQ vs PMO

**Overlap:** roadmap, milestones, dependencies, risks and reporting.

**Difference:** HQ governs; PMO executes and coordinates.

**Recommendation:** keep both. PMO should reference HQ decisions and feed execution evidence back without becoming a governance authority.

### 3.3 BASOUL OS vs Legacy OS V1

**Overlap:** projects, tasks, clients, finance, Supabase-backed business UI, dashboards.

**Difference:** current BASOUL OS has newer stack, organization-aware authorization, mobile client, decision engine, BASOUL Brand Foundation, YVL adapter and current release path.

**Recommendation:** archive V1 after a final extraction checklist:

- unique migrations/schema fragments
- unique product behavior not present in current OS
- historical release notes worth preserving
- deployment/environment knowledge not duplicated elsewhere
- any user data migration instructions

No new feature work should target V1.

### 3.4 BASOUL OS vs R1

**Overlap:** executive intelligence, user context, AI-ready decision surfaces.

**Difference:** OS is business system of record and operational workspace; R1 is the intelligent multimodal interaction/session layer.

**Recommendation:** keep separate runtime products. Integration should happen through explicit APIs/contracts, never by copying OS business logic into R1.

Target architecture:

```text
R1 interaction/session layer
        ↓ governed API/tool calls
BASOUL OS business services / data contracts
        ↓
Supabase + authorized organization context
```

### 3.5 R1 vs AI Core

**Overlap:** potential provider routing, AI orchestration, backend intelligence.

**Current evidence:** R1 already has an implemented product contract and production-readiness gates; AI Core's current repository shape is incomplete and its authority is explicitly unresolved in HQ.

**Recommendation:** quarantine AI Core. Before any adoption, require one irreversible-level product decision:

A. redefine AI Core as a true shared provider/orchestration service used by R1 and future products, or
B. absorb any useful code/contracts into R1/shared packages and archive AI Core.

Until that decision, no runtime dependency should point to AI Core.

### 3.6 Design System vs BASOUL Brand Foundation / YVL in OS

**Overlap:** tokens, themes, CSS variables, motion, icons, platform adapters, accessibility and RTL.

**Conflict:** old Design System documentation contains YOSSEUF identity assumptions and gold accents, while BASOUL identity is now locked separately.

**Recommendation:** split concerns permanently:

- **BASOUL Brand Foundation:** logo, symbol, wordmark, approved palette and identity assets.
- **YVL mechanics:** semantic token contracts, spacing, radius, motion, accessibility, RTL, platform adapters.
- **Product adapters:** BASOUL semantic mapping for Web/React Native.

After extraction and contract parity, the old repository can be renamed/redefined or archived. Do not delete it until consumers are proven migrated.

### 3.7 R2 vs production runtime

R2 is intentionally isolated. Keep its zero-dollar/dry-run research model. Promotion requires a formal R2 → R1 or R2 → shared-package gate. No direct production dependency should ever point at experimental outputs.

---

## 4. Recommended target ecosystem

### Tier A — Canonical authorities

- **BASOUL HQ**: governance system of record.
- **BASOUL OS**: business/operations product and business data contracts.
- **BASOUL R1**: intelligent interaction/session product.

### Tier B — Supporting operational systems

- **BASOUL PMO**: program execution control.
- **BASOUL Platform**: read-only engineering intelligence and documentation portal.

### Tier C — Research and shared mechanics

- **BASOUL R2 Research Lab**: experiments only.
- **YVL / Foundation packages**: shared mechanics, not brand authority.

### Tier D — Transition / sunset

- **YOSSEUF-OS-V1**: archive candidate.
- **AI Core**: quarantine pending authority decision.
- **Old Design System repository**: transition pending consumer migration.

---

## 5. No-regret actions that can proceed automatically

1. Stop new feature work on `YOSSEUF-OS-V1`.
2. Prevent new dependencies on `yosseuf-ai-core` until authority is approved.
3. Document HQ as the single source of lifecycle/status truth.
4. Document Platform as read-only consumer, not authority.
5. Create explicit OS ↔ R1 integration contracts instead of code duplication.
6. Inventory all Design System package consumers before any archive/rename.
7. Inventory unique V1 files/schema/features before archive.
8. Keep R2 promotion-gated and production-isolated.
9. Continue BASOUL visual migration in product repositories using locked Brand Foundation + YVL mechanics.

---

## 6. Decisions that must NOT be automated

The following require explicit owner approval because they materially change ownership, external references, or history:

- archiving/deleting `YOSSEUF-OS-V1`
- renaming repositories from YOSSEUF to BASOUL
- collapsing Platform into HQ or vice versa
- redefining or archiving AI Core
- archiving/replacing the Design System repository
- changing production domains, Apple/Android IDs, Supabase project IDs, secrets, release tags or Git history

---

## 7. Pass C recommended evidence work

Before any structural change, perform these four evidence packs:

### C1 — Legacy OS extraction diff
Create a capability/schema/file inventory comparing V1 with current BASOUL OS and produce `KEEP / MIGRATED / UNIQUE / OBSOLETE` classifications.

### C2 — Design System consumer map
Search all active repositories for `@yosseuf/*`, design-system package names, YVL imports and copied token files. Produce a migration graph and safe archive threshold.

### C3 — Platform/HQ duplication map
Compare registry, roadmap, releases, risk and documentation data sources. Mark each duplicated record as `HQ AUTHORITY / PLATFORM DERIVED / REMOVE DUPLICATE`.

### C4 — AI Core authority dossier
Inventory actual code, APIs, routes, tests and deployments. Compare with R1 capabilities. Produce either a concrete shared-service charter or an archive recommendation.

---

## 8. Current recommendation

Proceed to Pass C without deleting or renaming anything. The highest-value sequence is:

1. **C1 Legacy OS extraction diff**
2. **C2 Design System consumer map**
3. **C3 Platform/HQ duplication map**
4. **C4 AI Core authority dossier**

This sequence reduces risk before any irreversible ecosystem cleanup.