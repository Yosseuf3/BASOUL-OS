# BASOUL AI Core Retirement Extraction

Date: 2026-08-10
Status: Owner-approved retirement decision. Evidence and extraction only in this repository; no production infrastructure changes.

## Decision

The owner explicitly approved extracting the useful parts of `Yosseuf3/yosseuf-ai-core` and archiving that repository.

## Evidence summary

The repository is not a functioning shared AI core. Its current package is a small `vinext`/Next.js starter with Drizzle/Cloudflare tooling and an intentionally empty database starting point. The visible product surface is a client-side creative command-center prototype with hard-coded/demo data rather than a governed AI orchestration service.

No active runtime dependency on `yosseuf-ai-core` was found in the other canonical ecosystem repositories during Pass C dependency review. Existing references in BASOUL OS are architecture/evidence documents, not imports or service calls.

## KEEP / EXTRACT

### 1. ChatGPT-hosted identity helper pattern

Useful implementation ideas found in `app/chatgpt-auth.ts`:

- read authenticated identity only from hosting-provided request headers;
- decode optional percent-encoded full-name metadata defensively;
- treat email as the stable fallback display identity;
- validate `returnTo` as same-origin relative navigation;
- reject protocol-relative redirects;
- reject reserved sign-in/sign-out/callback paths;
- keep sign-in identity separate from workspace authorization.

Disposition: **EXTRACT as a non-runtime reference pattern into R1 documentation.** It must not replace BASOUL OS Supabase Auth or organization authorization.

### 2. Human-governed creative production workflow concept

The prototype contains a potentially useful product concept:

`Intake → Generation → Review → Approval → Delivery`

with explicit human checkpoints and quality-gate concepts such as identity alignment, brand consistency, and technical compliance.

Disposition: **KEEP as product-research evidence only.** Do not copy the UI, hard-coded metrics, legacy YOSSEUF visual identity, or demo workflow into production. Any future BASOUL AI / R1 creative workflow should be redesigned from current BASOUL Brand Foundation and governed runtime contracts.

## DUPLICATE / DO NOT EXTRACT

- The repository-local design-system validator is superseded by the stronger BASOUL OS Foundation/YVL validation suite.
- The visual shell uses legacy YOSSEUF branding and is not an approved BASOUL asset source.
- Hard-coded identities, assets, production jobs, usage/credit figures, and prompt metadata are demo content only.
- The starter database shape and optional D1/Drizzle example do not represent canonical BASOUL data authority.
- No provider routing, model orchestration, memory service, tool governance, retrieval service, production API contract, durable job system, or shared AI service authority was evidenced.

## Authority after retirement

After archive:

- **BASOUL OS** remains the business system of record and operational runtime.
- **R1** remains the intelligent interaction/session runtime and home for governed AI-facing integration patterns.
- **R2** remains isolated research with formal promotion gates.
- No repository inherits a generic `AI Core` authority by default.
- A future `BASOUL AI` product/service requires a new explicit charter rather than reviving the archived starter by assumption.

## Archive gate

Owner approval is satisfied. The remaining repository-setting action is to mark `Yosseuf3/yosseuf-ai-core` archived in GitHub after the extracted R1 reference is committed.

No repository delete, rename, history rewrite, production promotion, Supabase change, domain change, signing-ID change, or financial action is authorized by this decision.
