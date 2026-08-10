# BASOUL Ecosystem Pass C — Evidence & Target Architecture

Date: 2026-08-10  
Status: analysis-only. No repository archive/delete/rename/merge, Production change, domain change, signing-ID change, Supabase Production change, RLS weakening, Auth weakening, financial action, or external identifier change is performed here.

## Executive decision

Pass C supports the following no-regret target:

- **KEEP** `YOSSEUF--OS` as BASOUL OS, the primary business runtime and business-data authority.
- **KEEP** `yosseuf-hq` as canonical ecosystem governance authority.
- **KEEP** `YOSSEUF-Program-Management` as delegated execution/control authority.
- **KEEP with reduced authority** `YOSSEUF-Platform` as a read-only engineering-intelligence portal derived from HQ and repository evidence.
- **EXTRACT / TRANSITION** `yosseuf-design-system` toward mechanics-only authority. BASOUL Brand Foundation remains identity authority; canonical YVL remains mechanics authority.
- **QUARANTINE** `yosseuf-ai-core`; do not add dependencies until a concrete authority contract is approved.
- **KEEP** `YOSSEUF-R1` as the intelligent interaction/session runtime, integrating with BASOUL OS through governed APIs/tools rather than copied business logic.
- **KEEP / ISOLATE** `YOSSEUF-R2-Research-Lab`; promotion may occur only through a formal evidence gate into R1 or shared packages.
- **ARCHIVE-CANDIDATE, NOT ARCHIVE-READY** `YOSSEUF-OS-V1`. No unique live product capability has been proven missing from BASOUL OS, but its migration history and release evidence must be preserved before any archive action.

---

# C1 — Legacy OS V1 → BASOUL OS comparison

## Evidence baseline

### Legacy V1

Observed repository: `Yosseuf3/YOSSEUF-OS-V1`

- `package.json`: `yosseuf-os-cloud` v1.0.0; Next 14, React 18, Supabase 2.49.4; quality gate = lint + typecheck + build.
- `README.md`: stable decision-first OS with Dashboard, Workspace Health, Projects, Tasks, Clients, Content, Knowledge, Finance, Activity, Notifications, Global Search, Quick Create.
- `RELEASE_NOTES_v1.0.0.md`: decision engines outside React, keyboard workflows, Supabase persistence/RLS foundations, graceful partial failure, GitHub Actions and Vercel production workflow.
- Database history includes `supabase/schema.sql`, versioned Supabase migrations and domain migrations for clients, content, knowledge, finance, activity and notifications.

### Current BASOUL OS

Observed repository: `Yosseuf3/YOSSEUF--OS`

- `package.json`: `basoul-platform` v4.0.0-rc.1; Next 16, React 19, Supabase 2.111+, workspaces, Web + Mobile scripts, explicit test suite, YVL/Foundation/accessibility/bundle/release validation.
- `README.md`: the same core business modules plus organization-aware platform architecture, shared intelligence, current BASOUL identity and current runtime direction.
- Current repository contains retained historical migrations plus BASOUL migration reports and protected Brand/YVL boundaries.
- Administration and secure invitations are already present in the current line and must not regress.

## Capability matrix

| Area | Legacy V1 evidence | Current BASOUL OS evidence | Classification | Action |
|---|---|---|---|---|
| Executive Dashboard | Stable v1.0.0 dashboard | Phase 9.1 executive dashboard | **MIGRATED / DUPLICATE** | KEEP current |
| Workspace Health | Explicit V1 capability | Phase 9.1 Health Ring / executive health | **MIGRATED / DUPLICATE** | KEEP current |
| Decision Layer | Priority/summary/alert engines separated from React | Current decision-first architecture retained | **MIGRATED / KEEP** | KEEP current architecture |
| Projects | V1 module | Phase 9.2 product surface | **MIGRATED / DUPLICATE** | KEEP current |
| Tasks | V1 module | Phase 9.2 product surface | **MIGRATED / DUPLICATE** | KEEP current |
| Clients | V1 module + migration | Phase 9.2 product surface | **MIGRATED / DUPLICATE** | KEEP current |
| Content Studio | V1 module + `006_content_studio_foundation.sql` | Phase 9.2 product surface | **MIGRATED / DUPLICATE** | KEEP current |
| Knowledge | V1 module + `007_knowledge_foundation.sql` | Phase 9.2 product surface | **MIGRATED / DUPLICATE** | KEEP current |
| Finance | V1 module + `008_finance_foundation.sql` | Phase 9.2 + financial summaries | **MIGRATED / DUPLICATE** | KEEP current |
| Activity | V1 module + `009_activity_feed_foundation.sql` | Phase 9.2 activity surface | **MIGRATED / DUPLICATE** | KEEP current |
| Notifications | V1 module + `010_notification_center.sql` | Phase 9.2 notifications | **MIGRATED / DUPLICATE** | KEEP current |
| Global Search | V1 capability | Phase 9.2 search/filter/toolbars | **MIGRATED / DUPLICATE** | KEEP current |
| Universal Quick Create | V1 capability | Current Quick Actions/forms/modals | **MIGRATED / FUNCTIONALLY SUPERSEDED** | KEEP current; preserve UX intent only |
| Keyboard workflows | Explicit V1 release feature | Current Web architecture supports keyboard-first contract in docs | **KEEP / VERIFY PARITY** | Preserve as acceptance requirement |
| Error/loading/retry/partial failure | Explicit V1 release feature | Current newer runtime exists, but exact parity is not proven by this pass | **KEEP / VERIFY PARITY** | Add regression checklist, do not copy blindly |
| Supabase persistence | V1 | Current | **MIGRATED** | KEEP current |
| RLS foundations | V1 foundations | Current organization-aware authorization + admin/invite security | **MIGRATED / SUPERSEDED** | Current security wins; never weaken |
| Organization-aware authorization | Not established as V1 authority | Current OS | **UNIQUE CURRENT** | KEEP current |
| Secure member invitations/admin | Not established in V1 | PR #60/#61 current line | **UNIQUE CURRENT** | KEEP current |
| Mobile runtime | Not present in V1 package contract | Current `mobile:*` / cloud-first mobile line | **UNIQUE CURRENT** | KEEP current |
| BASOUL Brand Foundation | Absent; legacy YOSSEUF identity | Current protected BASOUL foundation | **UNIQUE CURRENT / OBSOLETES LEGACY BRAND** | KEEP current |
| Canonical YVL validation | Absent from V1 quality scripts | Current explicit YVL validators/generator/audit | **UNIQUE CURRENT** | KEEP current |
| Accessibility validation | Not explicit in V1 quality script | Current `validate:a11y` | **UNIQUE CURRENT** | KEEP current |
| Automated tests | No test script in V1 `package.json` | Current Node test suite | **UNIQUE CURRENT** | KEEP current |
| Bundle/release validation | Basic V1 quality gate | Current bundle + release consistency checks | **UNIQUE CURRENT / SUPERSEDES** | KEEP current |
| Historical Supabase migration chain | V1 stores original history | Current retains at least part of historical chain, but complete one-to-one parity is not proven here | **UNIQUE EVIDENCE / EXTRACT** | Preserve immutable evidence pack before archive |
| Stable v1.0.0 release evidence | V1 release notes/checklists/deployment docs | Current repository has later history and migration reports | **UNIQUE HISTORICAL EVIDENCE / EXTRACT** | Preserve provenance |
| Legacy deployment instructions | V1 stable production workflow | Current Vercel/cloud workflow evolved | **OBSOLETE AS INSTRUCTION / KEEP AS HISTORY** | Preserve only as historical evidence |
| Legacy YOSSEUF visual language | Gold-based identity assumptions | BASOUL identity is canonical | **OBSOLETE** | Do not migrate visual identity |

## Legacy V1 disposition threshold

`YOSSEUF-OS-V1` may only move from **ARCHIVE-CANDIDATE** to **ARCHIVE-READY** after all of these are proven:

1. Every V1 database migration/schema object is either present in current canonical history, superseded by a documented migration, or captured in an immutable evidence bundle.
2. Keyboard workflow parity is regression-tested.
3. Error/loading/retry/partial-failure behavior is regression-tested where still product-relevant.
4. Release, deployment, rollback and test evidence required for historical traceability is copied or referenced from canonical documentation.
5. No V1-only asset, seed, fixture, business rule or integration remains unexplained.
6. Archive action receives explicit owner approval.

**Current Pass C conclusion:** no V1-only live capability is proven necessary. The remaining risk is historical/data provenance, not product functionality.

---

# C2 — Platform vs HQ overlap

## Evidence

`yosseuf-hq/README.md` explicitly defines HQ as the version-controlled source of truth for strategy, ownership, architecture, delivery and operations; `manifest/ecosystem.json` owns existence/ownership and HQ owns roadmap/releases/ADRs/standards/operations.

`YOSSEUF-Platform/README.md` explicitly states that HQ `manifest/ecosystem.json` is authoritative and that Platform is a read-only engineering workspace with no product logic and no runtime dependency.

## Authority matrix

| Concern | HQ | Platform | Target |
|---|---|---|---|
| Repository registry | **AUTHORITATIVE** | Derived display | Platform derives |
| Lifecycle/status/ownership | **AUTHORITATIVE** | Read-only | Remove local competing truth |
| Roadmap | **AUTHORITATIVE** | Read-only visualization | Derive |
| ADRs | **AUTHORITATIVE** | Discovery/index only | Link/index |
| Releases | **AUTHORITATIVE registry** + product repo evidence | Read-only intelligence | Derive |
| Risks/governance | **AUTHORITATIVE** | Display only | Derive |
| Engineering health | Evidence aggregation | **Useful computed intelligence** | KEEP Platform value |
| Documentation discovery | Canonical locations | **Useful search/navigation** | KEEP |
| Product business logic | No | No | Neither |

### Recommendation

**KEEP both.** The correct cleanup is authority reduction, not repository deletion: Platform must remain a query/read model over HQ + repository evidence. Any Platform-local lifecycle/status/ownership records that can diverge from HQ should become generated cache, attributed evidence, or be removed in a later reversible implementation pass.

---

# C3 — Design System → BASOUL/YVL extraction plan

## Evidence

`yosseuf-design-system/README.md` contains strong reusable mechanics:

- semantic tokens
- dark/light themes
- CSS variables
- motion primitives
- icons
- Tailwind integration
- platform adapters
- accessibility policy
- RTL-safe logical properties
- Arabic/Latin typography support

It also explicitly embeds legacy YOSSEUF visual authority and gold accents. That brand authority now conflicts with BASOUL Brand Foundation.

## Extraction split

### KEEP / EXTRACT into canonical mechanics

- spacing scale and semantic spacing contracts
- radii and interaction geometry
- semantic role model
- motion durations/easing/reduced-motion behavior
- accessibility rules and validation
- RTL/logical-property mechanics
- platform adapter contracts
- framework-neutral token generation mechanics
- non-brand interaction primitives

### DO NOT promote as authority

- YOSSEUF logos/identity assets
- gold-led palette decisions
- legacy visual-authority language
- any token whose meaning is specifically the old YOSSEUF brand rather than generic mechanics

## Target dependency chain

```text
BASOUL Brand Foundation (identity authority)
            +
Canonical YVL (mechanics authority)
            ↓
BASOUL semantic adapter
            ↓
Web primitives / React Native primitives
            ↓
BASOUL OS / BASOUL ONE / BASOUL AI products
```

## Safe migration sequence

1. Inventory consumers of `@yosseuf/tokens`, `@yosseuf/css`, `@yosseuf/themes/*` and copied token files.
2. Map every exported contract to `MECHANIC`, `BRAND`, or `LEGACY/UNUSED`.
3. Move/copy only mechanics into protected canonical YVL sources using parity tests.
4. Map BASOUL identity values only in the semantic adapter, never inside YVL mechanics.
5. Replace consumers incrementally.
6. Require zero active consumers before any Design System freeze/archive decision.

Disposition: **EXTRACT / TRANSITION**, not archive-ready.

---

# C4 — AI Core authority/capability analysis

## Evidence

`yosseuf-ai-core/README.md` currently identifies the repository as `vinext-starter`, describes optional Cloudflare D1/Drizzle examples, and states that `db/schema.ts` starts intentionally empty. Its documented capabilities are starter-site/auth scaffolding rather than a defined BASOUL intelligence service.

By contrast, R1 documents a concrete implemented product contract: unified sessions, text/voice/image/doc/screen evidence, provider-neutral STT/TTS, context fusion, synchronized synthetic presence, governed tools and production-readiness gates.

## Capability verdict

| Capability | AI Core | R1 | Authority result |
|---|---:|---:|---|
| Product charter | Ambiguous/starter | Explicit | R1 wins |
| Session/orchestration runtime | Not established | Implemented | R1 |
| Provider-neutral multimodal interaction | Not established | Implemented | R1 |
| Shared provider gateway | Not established | Could consume one later | Unassigned |
| Shared model policy/routing | Not established | Product-local capabilities exist | Candidate only |
| Shared embeddings/vector service | Not established | Not enough evidence here | Unassigned |
| Shared evaluation/telemetry service | Not established | R1 has production gates, not necessarily shared service | Unassigned |
| Independent database authority | Empty starter schema | R1 has defined backend consolidation docs | AI Core has none |

## Recommendation

**QUARANTINE.** Do not add runtime dependencies.

A future approval may choose one of only two clean directions:

- **Shared BASOUL AI service:** narrowly chartered provider routing/policy/evaluation/telemetry service with explicit non-overlap with R1 sessions and OS business logic.
- **Absorb useful fragments then archive-candidate:** if no independently valuable shared service emerges.

That choice materially changes product authority and therefore remains an explicit owner decision.

---

# C5 — R1 / BASOUL OS integration boundary

## Evidence

BASOUL OS is the decision-first business operating system and data/workflow authority. R1 is the intelligent multimodal interface/session runtime. R1 explicitly keeps autonomous writes out of scope in its production boundary.

## Boundary

```text
R1
- conversation/session state
- multimodal input/output
- context fusion
- voice/presence/meeting/presentation interaction
- tool selection and evidence presentation
           ↓ governed tool/API contracts
BASOUL OS
- organization context
- projects/tasks/clients/content/knowledge/finance/activity/notifications
- business validation and authorization
- decision engines/business services
- durable operational records
           ↓
Supabase + existing RLS/Auth/admin boundaries
```

Rules:

1. R1 never copies OS business rules into its UI/session layer.
2. OS never absorbs R1 multimodal/session/presence logic.
3. Every R1 write into OS must use an explicit governed tool/API contract, organization context and OS authorization.
4. No service-role key reaches clients.
5. Existing Production, RLS, Auth and invitation boundaries remain untouched.

Disposition: **KEEP both / CONTRACT integration**.

---

# C6 — R2 promotion boundary

## Evidence

R2 explicitly states `EXPERIMENTAL · NOT FOR PRODUCTION`, defaults to offline mocks/synthetic fixtures, disables live writes/network/model downloads, uses zero-dollar dry runs and requires a formal R2-to-R1 promotion gate.

## Promotion contract

R2 output can become production only by one of these routes:

```text
R2 experiment
   ↓ reproducible evidence + benchmark + risk review
A) R1 product capability
or
B) shared mechanics/intelligence package
```

Never:

```text
Production runtime → direct dependency on experiments/*
```

Promotion minimums:

- deterministic reproduction
- benchmark result against an approved baseline
- privacy/security assessment
- cost ceiling and provider implications
- failure/rollback plan
- target owner (R1, OS or shared package)
- explicit removal of research-only flags/stubs
- normal target-repository quality gates

Disposition: **KEEP / ISOLATED RESEARCH**.

---

# C7 — Final ecosystem target architecture

```text
                         BASOUL HQ
                 canonical governance authority
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          v                v                v
      BASOUL PMO      BASOUL Platform    Runtime portfolio
 execution/control    read-only intel       │
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                              v              v              v
                         BASOUL OS          R1           Future products
                      business runtime  intelligent UI
                              │              │
                              └──── governed contracts ────┘
                                      │
                                      v
                           Shared mechanics/contracts
                       BASOUL Brand + YVL + adapters
                                      │
                       ┌──────────────┴──────────────┐
                       v                             v
                 R2 Research Lab              Shared AI service?
                 isolated / gated             NOT YET APPROVED

Transition edge:
- YOSSEUF-OS-V1 → evidence preservation → archive-candidate
- yosseuf-design-system → mechanics extraction → freeze/archive decision later
- yosseuf-ai-core → quarantine → explicit authority decision later
```

---

# Repository disposition matrix

| Repository | Disposition | Reason | Next reversible action |
|---|---|---|---|
| `YOSSEUF--OS` | **KEEP** | Primary BASOUL OS runtime | Continue product work; preserve security/Brand/YVL boundaries |
| `yosseuf-hq` | **KEEP** | Canonical governance source | Continue registry/ADR/release governance |
| `YOSSEUF-Program-Management` | **KEEP** | Execution/control layer | Ensure HQ references remain canonical |
| `YOSSEUF-Platform` | **KEEP / CONSOLIDATE AUTHORITY** | Useful read-only intelligence, overlaps HQ metadata | Convert duplicate metadata to derived evidence |
| `yosseuf-design-system` | **EXTRACT / FREEZE-LATER** | Valuable mechanics + obsolete brand authority | Consumer map + contract classification |
| `YOSSEUF-R1` | **KEEP** | Defined intelligent interaction runtime | Formalize OS tool/API contracts |
| `YOSSEUF-R2-Research-Lab` | **KEEP** | Safe isolated research | Maintain promotion gate |
| `yosseuf-ai-core` | **FREEZE / QUARANTINE** | Starter/incomplete authority | Produce narrow service charter only if owner chooses shared AI service |
| `YOSSEUF-OS-V1` | **ARCHIVE-CANDIDATE** | Functionally superseded; historical/data provenance remains | Complete immutable evidence + migration parity checklist |

---

# Irreversible decisions intentionally NOT taken

Pass C does **not** decide or perform:

- archive/delete/rename of any repository
- repository consolidation/merge
- AI Core product-authority assignment
- Production deployment/promotion
- Supabase Production/RLS/Auth changes
- domains
- package/bundle/EAS/signing identifiers
- financial/provider commitments
- Git history rewriting

## Owner decision gates exposed by Pass C

Only two strategic decisions remain after reversible evidence work:

1. **AI Core:** charter as a genuine shared BASOUL AI service, or absorb useful fragments and eventually archive-candidate it.
2. **Legacy/transition repositories:** archive/freeze actions after the evidence/consumer gates pass.

Until explicit approval, the safe state is quarantine/freeze-candidate, not deletion or structural consolidation.
