# BASOUL YVL Product Integration

Status: Phase 9 implementation candidate
Scope: Preview and Staging only
Canonical YVL: packages/yvl-tokens and design-system/yvl (unchanged)

## Governance boundaries

BASOUL Brand Foundation and YVL remain separate systems:

- Brand Foundation defines BASOUL identity, approved copy, logo assets, and gold identity accent.
- YVL defines product visual behavior: surfaces, hierarchy, typography scale, spacing, radii, elevation, states, focus, and motion.
- @basoul/yvl-adapter is the only product mapping layer between those systems.
- Product components consume semantic adapter roles and do not copy canonical YVL values.

## Token flow

    design-system/yvl canonical JSON
      -> @yosseuf/yvl-tokens generated primitives and semantic tokens
      -> @basoul/yvl-adapter product semantics + BASOUL identity accent
      -> web CSS compatibility aliases / React Native semantic map
      -> shared primitives
      -> BASOUL screens

The adapter exposes background, surface, surfaceRaised, textPrimary, textSecondary,
border, accent, success, warning, danger, focus, disabled, spacing, radius,
elevation, typography, and motion.

## Adapter contract

- Web: packages/basoul-yvl-adapter/src/index.ts and web.css.
- React Native: packages/basoul-yvl-adapter/src/native.ts.
- Brand identity enters only through foundationColorValues.primary.
- Compatibility aliases map existing --ys consumers to YVL roles for incremental migration.
- The canonical package name @yosseuf/yvl-tokens is preserved.

## Migrated components

The shared layer contains 24 primitives:

- Web (19): Button, IconButton, Input, Textarea, Select, Card, Surface, Panel, Badge,
  Status, Dialog, Drawer, Navigation, Tabs, TableContainer, EmptyState, LoadingState,
  ErrorState, and Toast.
- Mobile (5): YvlCard, YvlButton, YvlTextInput, YvlBadge, and YvlFeedback.

Interaction coverage includes default, hover/press, focus, active, selected-compatible
tabs/status, disabled, loading, error, and reduced motion. Native touch controls use
44px minimum targets and platform-appropriate pressed state feedback.

## Migrated screens and surfaces

- Web shell, navigation, dashboard, search, cards, forms, dialogs, tables, status,
  and feedback inherit the adapter through compatibility aliases.
- Web Administration directly consumes shared YVL primitives.
- /yvl-review provides isolated Executive/Dashboard and Administration fixtures.
- Eleven React Native feature screens consume @basoul/yvl-adapter/native, including
  Login, Dashboard, Command Center, Administration, Projects, Tasks, Search,
  Notifications, Timeline, Create Task, and Architecture Review.
- The mobile consumer declares both canonical peer packages and uses explicit
  TypeScript/Metro monorepo resolution; an Android Metro export verifies the bundle.
- Mobile Administration intentionally remains read-only.

## Arabic and RTL

- Root web language remains ar with RTL direction.
- Logical CSS properties are used by dialog, drawer, status, and toast primitives.
- Tables use logical start alignment.
- React Native retains RTL content direction and right-aligned Arabic copy.
- Mixed English identifiers and role values remain readable.

## Compliance and inventory

scripts/audit-yvl-product-styles.mjs produces
docs/design-system/yvl-style-inventory.json. npm run validate:yvl-product prevents:

- raw colors in migrated areas;
- renewed direct mobile consumption of @yosseuf/ui-tokens;
- reintroduction of nativeDarkTheme;
- increases in reviewed hardcoded layout metrics;
- missing adapter semantics.

The inventory reports untouched legacy work instead of treating it as migrated.
The candidate baseline records 113 compliant references, 831 legacy references
across four files, 27 hardcoded color occurrences, and 844 hardcoded layout metrics
across 17 files. Most legacy references are concentrated in historical global CSS
and remain behind the compatibility bridge.

## Visual and runtime QA

- Web fixtures: Executive/Dashboard and Administration.
- Review evidence: `docs/assets/screenshots/yvl-product-desktop.jpg` and
  `docs/assets/screenshots/yvl-product-mobile.jpg` (390 x 844 viewport).
- Responsive inspection reports a 390px document width with no horizontal overflow;
  the accessibility tree preserves headings, regions, table semantics, labels, and buttons.
- Browser runtime inspection reports no console errors.
- Mobile targets: Login, Dashboard, Command Center, and read-only Administration.
- Authentication, Supabase queries, Administration authorization, RLS, and navigation
  logic are unchanged.
- Production environment and Supabase are not modified.
- Dark mode is validated because YVL v1.0 defines one dark product palette; no
  unsupported light theme is invented.

## Migration backlog

1. Split historical app/globals.css into feature-scoped style modules.
2. Replace remaining compatibility --ys references with direct BASOUL semantic roles.
3. Replace remaining numeric mobile spacing/type values with adapter scale references.
4. Migrate architecture-review controls and project workspace subviews to shared primitives.
5. Add stable native screenshot automation when EAS/Android capacity is available.
6. Review upstream Expo/Metro audit advisories without a breaking Expo downgrade.

## Rollback

Remove the adapter CSS import and restore mobile imports to @yosseuf/ui-tokens/native.
No YVL source, Brand Foundation asset, database, authentication, or signed application
identifier changes are required for rollback.
