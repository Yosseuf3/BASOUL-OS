# YOSSEUF Visual Language v1.0

YVL is the mandatory visual-design authority for Platform, OS, HQ, PMO, AI Lab, R1/R2, web, mobile, social assets, and future products. It governs visual decisions without renaming products or changing current production interfaces.

## Direction

Premium, minimal, futuristic, and engineering-led: deep charcoal foundations, electric-blue and cyan accents, metallic typography, Sora display type, Inter UI type, thin geometric icons, and restrained HUD/circuit/hex/radial/light-trail motifs.

Use tokens before product values. Prefer hierarchy, contrast, and generous space over decorative effects. Avoid “AI neon overload,” excessive gradients, clutter, and ornamental noise.

## Adoption

Consume `@yosseuf/yvl-tokens`. Product migration is opt-in and review-gated; YVL v1.0 does not replace existing styles.

## Review layer

Canonical token JSON is protected by schemas in `schemas/`. Run `npm run validate:yvl` to validate source and verify generated artifacts, or `npm run generate:yvl` after an approved token change. The static `showcase/` is a review-only visual reference outside every production route and bundle.
