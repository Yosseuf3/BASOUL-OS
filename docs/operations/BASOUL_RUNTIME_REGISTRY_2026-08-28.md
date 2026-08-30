# BASOUL Runtime & Repository Registry

Date: 2026-08-30
Status: Canonical operational map after repository consolidation.

## Purpose

This document separates product identity from legacy technical identifiers and records the verified runtime and repository roles. It does not rename external identifiers, move production data, weaken RLS/Auth, or authorize destructive migrations.

## Product authority

- Technology masterbrand: **BASOUL**
- Founder / personal identity: **YOSSEUF RADWAN**
- First-party copyright: **ELSHENAWY RADWAN**
- Canonical product integration repository: `Yosseuf3/BASOUL-OS`
- Ecosystem governance and repository lifecycle authority: `Yosseuf3/yosseuf-hq`
- Stable product baseline: `v4.0.0`
- Current `main`: stable baseline plus post-release Architecture work that has passed repository quality gates.

## Supabase runtime map

The following project names are legacy technical identifiers. They are retained to avoid accidental runtime breakage.

| Operational role | Supabase technical project | Project ref | Status | Decision |
| --- | --- | --- | --- | --- |
| BASOUL Production backend | `YOSSEUF Platform Backend` | `okghyypmkymxvtsuvdvb` | ACTIVE_HEALTHY | Keep; treat as BASOUL Production until a separately approved migration |
| BASOUL Staging backend | `YOSSEUF Platform Staging` | `ogqdfucxwjutkpoahezn` | ACTIVE_HEALTHY | Keep; treat as BASOUL Staging |
| Legacy / historical R1 | `YOSSEUF R1` | `esazowqywfcrggxwqkxr` | INACTIVE | Do not reactivate or migrate without explicit approval |

### Data authority rules

1. Production and Staging must never be inferred from display names alone; use the project refs in this registry.
2. Organization identity, membership, roles, and tenant lifecycle remain BASOUL OS authority.
3. Product-domain repositories may own their own domain records but must not create an independent organization authority.
4. No direct cross-project data copy, merge, delete, RLS rewrite, Auth mutation, or project rename is authorized by this registry.
5. New infrastructure changes must update this registry in the same reviewed change set.

## Current repository topology

| Repository | Role | Lifecycle decision |
| --- | --- | --- |
| `Yosseuf3/BASOUL-OS` | Canonical BASOUL OS product and integration surface | **Active / Keep** |
| `Yosseuf3/BASOUL-AI` | Governed BASOUL AI product; AI-domain data only | **Active / Keep separate** |
| `Yosseuf3/BASOUL-Accounting` | Accounting domain engine/product | **Active / Keep separate; integrate through owned boundaries** |
| `Yosseuf3/BASOUL-Design-System` | Shared YVL mechanics and semantic design-system foundation | **Active / Keep** |
| `Yosseuf3/yosseuf-hq` | Ecosystem governance, PMO current-state, engineering portal and repository lifecycle authority | **Active / Keep** |
| `Yosseuf3/YOSSEUF-R2-Research-Lab` | Isolated experimental research line | **Experimental / Keep isolated** |

## Archived historical repositories

| Repository | Historical role | Lifecycle decision |
| --- | --- | --- |
| `Yosseuf3/YOSSEUF-Platform` | Former read-only engineering portal; useful capability absorbed into HQ | **Archived / Keep archived** |
| `Yosseuf3/YOSSEUF-Program-Management` | Former separate PMO repository; current-state authority absorbed into HQ | **Archived / Keep archived** |
| `Yosseuf3/YOSSEUF-OS-V1` | Historical YOSSEUF OS v1 source | **Archived / Keep archived** |
| `Yosseuf3/yosseuf-ai-core` | Historical AI prototype/starter lineage; unique evidence preserved in HQ | **Archived / Keep archived** |

The former Vercel project for `yosseuf-platform` was retired after Platform capability absorption. BASOUL HQ remains the governance deployment. Historical repository names may remain in evidence records and must not be interpreted as current authority.

## Integration boundaries

### BASOUL AI

BASOUL OS is authoritative for authenticated identity, organizations, memberships, roles and tenant lifecycle. BASOUL AI may own AI sessions, messages, memory, personality, multimodal evidence, runtime state and governed-tool evidence. Integration should occur through explicit authenticated APIs/gateways; do not duplicate tenant authority.

### BASOUL Accounting

BASOUL Accounting is the accounting system of record for ledger-grade accounting capabilities. BASOUL OS Finance should consume accounting data through a defined BASOUL-owned boundary rather than growing a second independent ledger engine.

### BASOUL Design System

Shared mechanics remain sourced from the design-system/YVL packages. BASOUL visual identity remains governed by the approved BASOUL Brand Foundation. Legacy technical package names are not brand authority.

### BASOUL LABS / R2

Research remains isolated from production authority and production data. Promotion from R2 into a product repository requires an explicit reviewed promotion gate.

## Release identity rules

- User-facing current release labels must not advertise obsolete Beta/RC labels after stable promotion.
- Historical release notes remain unchanged as evidence.
- Repository names, Expo slug, URL scheme, Android package, iOS bundle identifier, Supabase project names/refs and signing identifiers are technical identifiers and are not renamed as cosmetic cleanup.
- A future identifier migration requires an explicit, separately reviewed migration plan.

## Current integration-readiness outcome

Repository consolidation is complete: six current repositories remain active/isolated and four repositories are archived as historical evidence. The next integration gate is contract-level verification across BASOUL OS, BASOUL AI, BASOUL Accounting and the shared Design System. No production-data migration or identifier migration is implied by this registry.
