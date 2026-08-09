# BASOUL Visual Source of Truth

Status: **APPROVED / LOCKED FOR PRODUCT MIGRATION**

## Approved visual authority

The approved BASOUL Brand Identity System Board is the visual source of truth for BASOUL product identity.

It governs:

- Primary BASOUL logo and symbol usage
- Product-family lockups and color distinctions
- Identity palette and gradients
- Product typography direction
- App-icon treatment
- Brand surface mood and luminous blue/violet/cyan visual signature
- Arabic harmony and brand presentation

## Identity palette

- Midnight: `#0B1020`
- Electric blue: `#2563EB`
- Light blue: `#38B2F6`
- Violet: `#8B5CF6`
- Neutral surface: `#1B2230`
- Light neutral: `#E5E7EB`
- White: `#FFFFFF`

Product-family semantics:

- BASOUL AI: Electric blue
- BASOUL OS: Light blue / cyan direction
- BASOUL ONE: Amber
- BASOUL LABS: Violet

Amber is **not** a global BASOUL UI accent.

## Typography

BASOUL product identity uses **Inter** as the primary product typography direction represented by the approved board.

Canonical YVL may continue to expose its original typography primitives, but BASOUL product adapters must not allow those primitives to override the approved BASOUL identity.

## Relationship to YVL

BASOUL Brand Identity and YVL have separate responsibilities.

### BASOUL Brand Identity owns

- identity color
- typography direction
- gradients
- logo/symbol
- app icon
- product-family semantics
- identity emphasis

### YVL owns system mechanics

- spacing scale
- radii scale
- motion timing/easing
- focus behavior
- accessibility behavior
- reduced motion
- RTL/system behavior
- geometric icon rules where compatible

Canonical YVL source files remain unchanged.

## Product architecture

Approved BASOUL Brand Identity + Canonical YVL mechanics
→ `@basoul/yvl-adapter`
→ Web / React Native primitives
→ Product surfaces

## Migration gate

No broad production visual migration may be considered complete unless the actual production-facing interface visibly matches this approved BASOUL identity.

The first validation slice is the Executive Dashboard. It must be reviewed in Preview before any merge to Production.
