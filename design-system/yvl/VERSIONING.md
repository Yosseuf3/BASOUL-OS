# YVL versioning

YVL uses semantic versioning. The canonical token version, generated manifest, package version, changelog, and adoption documentation must identify the same approved release.

## Patch

Corrections that preserve names, meanings, values, generated APIs, and expected visual output. Documentation clarifications and non-observable validator fixes are patches.

## Minor

Backward-compatible additions such as new semantic roles, optional patterns, additive exports, or guidance. Products are not required to adopt a minor addition immediately.

## Major

Any removal, rename, meaning change, value change with material visual impact, incompatible generated API, or governance change that invalidates approved product mappings.

## Deprecation

Deprecations require a replacement, rationale, owner, first-deprecated version, minimum one-minor-version compatibility window, product inventory, and removal target. Deprecated tokens remain generated until the next approved major release.

## Migration

Migration plans map old to new semantics, assess accessibility and platform parity, define visual-regression evidence, sequence bounded surfaces, and include a tested rollback. Breaking migrations require a major version.

## Product adoption

Products pin an approved YVL version and adopt through separate review. Adoption must not silently change workflows or business behavior. A product may retain legacy styles until visual, accessibility, RTL, responsive, and reduced-motion parity is verified; removal of legacy values is a separate irreversible checkpoint.
