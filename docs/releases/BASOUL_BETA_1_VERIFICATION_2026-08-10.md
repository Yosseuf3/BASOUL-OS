# BASOUL Beta 1 — Runtime Verification

Date: 2026-08-10
Status: Beta channel verified with deployment constraints recorded

## Canonical product

- Product: BASOUL OS
- Package baseline: `basoul-platform` / `v4.0.0-rc.1`
- Technology masterbrand: BASOUL
- Founder identity: YOSSEUF RADWAN
- Legal copyright holder: ELSHENAWY RADWAN

## Live BASOUL OS verification

Vercel project `yosseuf-os` reports a production-target deployment in `READY` state.

Verified live endpoint: `/login`

Evidence observed from the deployed HTML:

- HTTP 200
- document title: `BASOUL`
- application name: `BASOUL`
- Arabic RTL document direction
- approved BASOUL Symbol loaded from the immutable canonical Brand Foundation source
- approved BASOUL Wordmark loaded from the immutable canonical Brand Foundation source
- Email + Password login surface active
- no Magic Link primary-development flow on the canonical login surface
- security headers include HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, restrictive Permissions Policy, and COOP

## Ecosystem Beta merge state

The approved BASOUL visual-unification changes are merged to `main` for:

- BASOUL Platform — `489ac64efc75eb0f6fb34b7b48da78d1135c1cb3`
- BASOUL AI · R1 — `d4906df25010113fc2a3b8e31233df40c80f46a7`
- BASOUL LABS · R2 — `57add42ee2f98247b40e4e36441533825d6b01a5`
- BASOUL HQ — `071f970ecf3af03d9c2f92157d590d1e1832b082`

Design System mechanics-only authority and BASOUL PMO presentation were merged previously.

## Current deployment constraint

Platform, R1, and HQ post-merge Vercel deployments are blocked by the free-tier daily deployment limit (`api-deployments-free-per-day`). This is an infrastructure quota condition, not a build or visual-identity regression.

No paid upgrade was initiated.

## Security gate

HQ and R1 retain a high-severity production dependency-audit blocker involving transitive `nanoid` 3.3.16. The audit threshold remains enabled and the advisory is not suppressed. Upstream Nano ID still publishes 3.3.16 as the current 3.x legacy line while PostCSS depends on `^3.3.16`; an unsupported forced major override is not approved as a substitute for an upstream-compatible fix.

Tracked issues:

- R1 issue #16
- HQ issue #15

## Source-cleanup finding

The deployed root HTML still contains the legacy source string `جارٍ تشغيل YOSSEUF OS…`, while the approved BASOUL Visual Truth CSS replaces the visible loading presentation with `جارٍ تشغيل BASOUL…`.

This means the user-visible surface is BASOUL, but the source/DOM is not fully identity-clean. Treat this as a source-level cleanup item. Do not add another presentation override; update the source component when editing support permits a safe full-file patch.

## Beta disposition

BASOUL Beta 1 is valid as the current review/beta baseline because:

1. the primary BASOUL OS production endpoint is live and responds successfully;
2. the canonical login surface is BASOUL-native and uses approved original assets;
3. ecosystem visual-unification work is merged;
4. remaining deployment blockers are quota-based and explicitly recorded;
5. the security advisory remains visible and enforced;
6. the remaining legacy DOM text is known, bounded, and does not justify recreating or redesigning approved identity assets.

Production promotion of the remaining ecosystem surfaces must be verified after the Vercel quota clears.