# ADR-003: Foundation semantic tokens are the only UI styling contract

- Status: Accepted
- Date: 2026-07-31
- Release: v3.0.3

## Context

Foundation v1 introduced semantic roles but retained compatibility aliases and raw component colors. This duplicated the styling contract and allowed new drift.

## Decision

Web styles consume only `--ys-*` semantic properties. Native components import `nativeDarkTheme` directly from `@yosseuf/ui-tokens/native`. Component code may not define raw presentation colors. Data-visualization roles are explicit Foundation tokens.

Automated validation rejects legacy aliases, duplicate token declarations, raw product CSS colors, and native bypasses.

## Consequences

Theme changes have one controlled adapter per platform. Compatibility aliases are no longer part of the supported product contract.
