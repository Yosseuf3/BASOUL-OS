# BASOUL Ecosystem Pass D — Evidence and Decision Dossier

Date: 2026-08-10
Status: Reversible preparation only

## Purpose

Pass D converts the Pass C conclusions into concrete evidence packs without performing any archive/delete/rename or authority transfer.

## 1. Legacy OS V1 evidence manifest

Canonical successor: `Yosseuf3/YOSSEUF--OS` (BASOUL OS)
Legacy repository: `Yosseuf3/YOSSEUF-OS-V1`

Evidence to preserve permanently if archival is approved later:

- complete Git history and tags;
- `README.md`;
- `CHANGELOG.md`;
- `RELEASE_NOTES_v1.0.0.md` and release-specific notes;
- `TEST_CHECKLIST*` files;
- historical Supabase migration files, including RC-era migration naming;
- deployment/release audit documentation;
- package manifest/lock evidence at the final legacy release.

Capability conclusion: all documented product capabilities are migrated or superseded in the BASOUL OS line. Historical evidence is the remaining unique value.

Live-reference scan performed across BASOUL OS, HQ, Platform and R1 found no code-level reference to `YOSSEUF-OS-V1` outside the new ecosystem study documentation. This is evidence toward archival safety, not proof that external deployment traffic is absent.

Archive gate still requires a separate infrastructure check for active domains, Vercel projects/deployments, webhooks, secrets, CI callers or external links.

## 2. Platform-to-HQ authority contract

### HQ owns

- repository registry and lifecycle;
- ownership;
- roadmap authority;
- risk authority;
- ADR index and governance decisions;
- release ledger;
- ecosystem policy and onboarding.

### Platform may own

- read-only presentation of HQ records;
- engineering discovery/navigation;
- attributed external evidence cache;
- deployment/build/health views;
- documentation search and command-center presentation.

### Prohibited duplication

Platform must not become an independent source for lifecycle, ownership, roadmap, risk, governance or release truth. Any editable status surfaced in Platform must write through an explicitly governed HQ workflow rather than create a second canonical record.

Recommended future architecture:

`HQ canonical files/contracts -> Platform read-only ingestion -> Platform UI`

No repository merge is required to achieve this boundary.

## 3. Design System to YVL parity checklist

Old Design System mechanics to verify before deprecation/freeze:

- [x] semantic product roles exist in current BASOUL adapter;
- [x] RTL-safe web behavior exists;
- [x] web typography/spacing/radius/elevation/state roles exist;
- [x] focus/accessibility semantics are represented;
- [x] native adapter path exists;
- [x] motion semantics are represented;
- [x] shared web primitives exist;
- [x] shared native primitives exist;
- [ ] historical global CSS compatibility debt reduced to an agreed threshold;
- [ ] remaining architecture-review controls migrated to shared primitives;
- [ ] remaining project workspace subviews migrated to shared primitives;
- [ ] hardcoded mobile spacing/type metrics reduced to an agreed threshold;
- [ ] native screenshot/visual regression automation established when infrastructure capacity allows;
- [ ] old Design System repository documentation rewritten to state that it is not BASOUL identity authority.

Authority rule during transition:

`BASOUL Brand Foundation = identity`
`canonical YVL = product visual behavior/mechanics`
`@basoul/yvl-adapter = product mapping`
`old Design System repo = transitional mechanics evidence only`

## 4. AI Core decision dossier

Repository: `Yosseuf3/yosseuf-ai-core`
Current classification: QUARANTINE

A live-reference scan across BASOUL OS, HQ, Platform and R1 found no direct code-level dependency on `yosseuf-ai-core` outside ecosystem study documentation. This lowers migration risk but does not determine strategic value.

### Option A — Rebuild AI Core as a true backend platform service

Choose only if a unique contract is required that R1 should consume.

Required boundaries:
- no user-facing product shell;
- no ownership of R1 sessions/personality/presentation;
- no duplication of BASOUL OS business logic;
- stable service/API/SDK contract;
- provider-neutral shared infrastructure that benefits more than one runtime product;
- explicit observability, versioning and security owner.

Blast radius: medium/high because new service ownership and runtime dependency would be introduced.

### Option B — Absorb reusable code into R1/OS and archive AI Core

Choose if no independent service contract is proven.

Actions before archival:
- inventory non-starter code;
- extract any reusable library into the repository that owns the capability;
- preserve Git history/release evidence;
- verify no deployment/domain/webhook consumer remains;
- archive, not delete.

Blast radius: low/medium if the repository has no live consumers.

### Option C — Keep quarantined temporarily

No new features or dependencies. Maintain read-only or minimal status until product completion provides enough evidence for A or B.

Blast radius: minimal, but carries ongoing cognitive/repository clutter.

Recommended decision posture today: Option C until BASOUL OS product completion, then choose between A and B based on a concrete multi-product backend requirement.

## 5. Live-reference scan summary

Searched current BASOUL OS, HQ, Platform and R1 for:

- `YOSSEUF-OS-V1`
- `yosseuf-ai-core`

Observed repository-code matches: none outside the newly created ecosystem analysis documentation in BASOUL OS.

Interpretation:
- no evidence of a source-code dependency from these primary repositories;
- external infrastructure dependencies remain unverified and must be checked before archive actions.

## 6. Irreversible-decision boundary reached

Pass D has completed all safe preparation currently available without changing external repository lifecycle.

The next actions that require explicit strategic approval are:

1. Archive `YOSSEUF-OS-V1` after external infrastructure dependency verification.
2. Select AI Core Option A, B or C as the long-term authority model.
3. Rename/rebrand HQ, PMO, Platform, R1, R2 or Design System repositories.
4. Disable/remove legacy deployments or domains.
5. Rewrite old package names or signed identifiers.

Until those decisions are made, product completion in BASOUL OS can continue independently.