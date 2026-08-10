# BASOUL Ecosystem Repository Study

Date: 2026-08-10
Status: Phase A evidence-based architecture review
Scope: all GitHub repositories currently visible under `Yosseuf3`, plus the authoritative HQ registry.

## Executive conclusion

The ecosystem contains **9 verified repositories**. They should not be treated as nine equal products. They fall into five architectural roles:

1. **Canonical product runtime:** `Yosseuf3/YOSSEUF--OS` (now BASOUL OS).
2. **AI product / research lines:** `Yosseuf3/YOSSEUF-R1`, `Yosseuf3/YOSSEUF-R2-Research-Lab`.
3. **Governance and execution:** `Yosseuf3/yosseuf-hq`, `Yosseuf3/YOSSEUF-Program-Management`.
4. **Read-only ecosystem portal / engineering intelligence:** `Yosseuf3/YOSSEUF-Platform`.
5. **Legacy / unresolved foundations:** `Yosseuf3/YOSSEUF-OS-V1`, `Yosseuf3/yosseuf-design-system`, `Yosseuf3/yosseuf-ai-core`.

The correct cleanup is **not** to collapse everything into one repository. The recommended target is a smaller governed portfolio with clear authority boundaries and explicit archive candidates.

## Evidence baseline

The HQ registry already declares these authority boundaries:

- HQ owns registry, roadmap, risks, ADR index, release ledger and governance.
- PMO owns execution visibility, planning, dependencies, milestones, reporting and escalation while HQ retains governance.
- Platform is read-only engineering intelligence and documentation discovery.
- R1 owns interaction/provider/session/memory contracts.
- R2 is isolated research only.
- Current OS is the canonical OS product and business-data contract owner.
- Legacy OS V1 is historical only and explicitly non-canonical.
- Design System is the foundation/token source in the pre-BASOUL architecture.
- AI Core is explicitly incomplete with authority unresolved.

## Repository-by-repository decision matrix

| Repository | Current role | Evidence | Recommended disposition | Priority |
|---|---|---|---|---|
| `YOSSEUF--OS` | Canonical BASOUL OS runtime, web/mobile, Supabase business product | package `basoul-platform` v4.0.0-rc.1; web + mobile quality gates; HQ previously marks it canonical OS | **KEEP / PRIMARY PRODUCT**. Continue BASOUL migration and module hardening. | P0 |
| `yosseuf-hq` | Governance source of truth | README says HQ owns ecosystem governance metadata; registry is machine-readable authority | **KEEP / GOVERNANCE AUTHORITY**. Do not merge into product runtime. Later rebrand presentation only after governance migration plan. | P0 |
| `YOSSEUF-Program-Management` | PMO execution records, no runtime dependencies | README explicitly says no production code and “HQ governs. PMO executes.” | **KEEP / GOVERNANCE OPERATIONS**. Strong separation is healthy. | P1 |
| `YOSSEUF-R1` | Production Digital Human / unified intelligent interface | v1.0.0; Supabase + OpenAI runtime; explicit production gates | **KEEP / AI PRODUCT LINE**. Future BASOUL ONE/R1 naming decision must preserve technical contracts until migration is planned. | P0 |
| `YOSSEUF-R2-Research-Lab` | Isolated experimental research | explicit `EXPERIMENTAL · NOT FOR PRODUCTION`; dry-run and zero-dollar defaults | **KEEP / RESEARCH SANDBOX**. Isolation is valuable and should remain. | P1 |
| `YOSSEUF-Platform` | Read-only engineering workspace / command center | README explicitly says no product logic and no runtime dependency; package v2.0.0 | **KEEP TEMPORARILY, REVIEW OVERLAP WITH HQ**. Likely future consolidation of presentation into HQ or a single BASOUL engineering portal, but do not merge until feature/knowledge diff is complete. | P1 |
| `yosseuf-design-system` | Pre-BASOUL canonical foundation | tokens, themes, CSS, native adapters, accessibility; semantic architecture is valuable, but README still encodes old gold/YOSSEUF visual identity | **EXTRACT + TRANSITION**. Preserve semantic mechanics and migration knowledge; move identity-specific authority to BASOUL Brand + YVL adapter. Do not archive until package-consumer audit is complete. | P0 |
| `YOSSEUF-OS-V1` | Historical stable OS implementation | HQ explicitly calls it legacy/non-canonical; older Next 14/React 18/Supabase stack | **ARCHIVE CANDIDATE** after a feature/data-migration diff confirms nothing unique remains. No new development. | P1 |
| `yosseuf-ai-core` | Unresolved AI Core | README is still a generic vinext starter; package is 0.1.0; HQ marks lifecycle `incomplete`, authority `unknown`, risk high | **QUARANTINE / REDEFINE OR ARCHIVE**. Do not let products depend on it until an explicit AI architecture decision defines what “AI Core” means relative to R1 and BASOUL OS intelligence packages. | P0 |

## Important findings

### 1. BASOUL OS is now technically ahead of the old HQ registry

The current OS package identifies itself as `basoul-platform` v4.0.0-rc.1 and already contains BASOUL/YVL validation, web/mobile quality gates, Supabase organization security, and the approved BASOUL visual baseline. The HQ registry still describes the product as `YOSSEUF OS` v3.0.3. Therefore the registry is now stale and should be reconciled only after the current visual/product migration stabilizes.

### 2. Design System contains valuable mechanics but obsolete brand authority

The standalone design-system repository is structurally useful: semantic tokens, dark/light themes, CSS variables, motion, native adapters, accessibility, RTL, and migration guidance. However its stated visual principle includes purposeful **gold accents** and its packages remain under `@yosseuf/*`. That conflicts with the approved BASOUL visual identity when treated as identity authority.

Decision: preserve its system mechanics and evidence, but **do not allow it to override BASOUL Brand Foundation**. Current BASOUL OS architecture already follows the right hierarchy: BASOUL identity → BASOUL adapter → YVL/system mechanics → product UI.

### 3. AI Core is the largest architecture ambiguity

The repository named `yosseuf-ai-core` does not currently prove a canonical intelligence-layer implementation. Its README is a generic starter and the HQ registry already labels it incomplete and unverified. Meanwhile R1 has real provider/session/memory contracts and BASOUL OS contains real decision/intelligence packages.

Decision: **no new dependency on AI Core**. Before revival, define a narrow contract such as model gateway, shared inference policy, or provider abstraction. If no unique responsibility survives that review, archive the repository rather than manufacture a purpose for its name.

### 4. Platform and HQ overlap in presentation, not authority

HQ is governance authority. Platform is explicitly read-only engineering intelligence and documentation. This separation can be legitimate, but running two command-center UIs may duplicate maintenance.

Decision: keep both during the study. Later compare features/routes/data sources. Preferred end-state is either:
- HQ remains data authority and Platform remains a generated/read-only portal, or
- Platform UI is absorbed into HQ while its data remains governed by HQ.

Do not merge their repositories merely to reduce repository count.

### 5. Legacy OS V1 should stop consuming attention

It is explicitly non-canonical and uses the older Next 14/React 18 stack. Its only remaining value is historical evidence and any feature/data migration gaps.

Decision: run one final capability diff against BASOUL OS, document missing items, then mark it archived/read-only if no unique runtime responsibility remains.

## Target portfolio architecture

```text
BASOUL Governance
├── HQ                    # authoritative governance registry / ADR / releases / risks
└── PMO                   # execution planning / milestones / dependency coordination

BASOUL Products
├── BASOUL OS             # business operating system, web + mobile
└── R1 / future BASOUL ONE# intelligent human-facing interface

BASOUL Research
└── R2 Research Lab       # isolated experiments only

BASOUL Foundations
├── BASOUL Brand Foundation
├── YVL / semantic UI mechanics
└── shared typed packages inside canonical product/foundation boundaries

Engineering Intelligence
└── Platform              # temporary read-only portal pending HQ overlap study

Archive / Quarantine
├── YOSSEUF-OS-V1         # archive candidate
└── yosseuf-ai-core       # quarantine until authority decision
```

## No-delete rule

This study does **not** delete, archive, rename, or merge any repository. Those actions are reversible only with operational cost and may break links, deployments, package consumers, releases, or governance evidence. Each destructive change requires its own evidence-backed migration decision.

## Next study passes

### Pass B — consumer/dependency graph

For each repository, inventory package names, imports, API calls, Supabase projects, deployment dependencies, shared environment variables, and cross-repo links. This determines what can actually be archived safely.

### Pass C — capability overlap

Compare:
- Platform vs HQ UI and data surfaces.
- BASOUL OS vs Legacy OS V1.
- R1 intelligence contracts vs AI Core intended contracts.
- BASOUL OS embedded YVL packages vs standalone Design System packages.

### Pass D — migration decisions

Produce one disposition for every repository: `KEEP`, `MERGE`, `EXTRACT`, `QUARANTINE`, `ARCHIVE`, or `RENAME-LATER`, with rollback plan and affected consumers.

## Immediate execution rules

1. Continue Phase 9.2 product-surface migration in `YOSSEUF--OS`.
2. Do not revive or integrate `yosseuf-ai-core` until its authority is defined.
3. Do not archive `YOSSEUF-OS-V1` until feature/data diff completes.
4. Keep HQ and PMO authoritative in their current governance domains.
5. Preserve R2 isolation.
6. Treat the standalone Design System as a source to extract/reconcile, not as BASOUL brand authority.
7. Do not purchase domains/services or make financial commitments as part of cleanup.
