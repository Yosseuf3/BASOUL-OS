# YOSSEUF OS → Design System Foundation v1.0.0

Status: In progress  
Source of truth: `Yosseuf3/yosseuf-design-system@v1.0.0`  
Tracking issue: #33

## Baseline audit

YOSSEUF OS already contains an early semantic layer in `app/globals.css`, including YOSSEUF surface, text, border, action, status, spacing, radius, focus, and motion roles. The current implementation is therefore a partial migration rather than a blank-slate redesign.

The remaining debt is concentrated in four areas:

1. Legacy aliases such as `--bg`, `--panel`, `--gold`, and `--line` are still consumed throughout the stylesheet.
2. Raw color literals remain inside component rules, gradients, shadows, and status treatments.
3. Several directional declarations still use physical properties and require an RTL review.
4. Foundation compliance was not previously enforced by CI.

## Migration strategy

The migration is deliberately incremental and reversible:

1. Protect the existing semantic contract with an automated validation guard.
2. Expand the token adapter to cover missing semantic roles.
3. Convert application rules by component family: shell, navigation, controls, cards, data display, overlays, and authentication.
4. Remove legacy aliases only after all consumers have moved.
5. Validate web and mobile surfaces independently before declaring migration complete.

## Decision log

### D-001: Preserve the current product structure
No routes, Supabase contracts, project workflows, or user-facing capabilities will be redesigned as part of the visual migration.

### D-002: Semantic roles are the product API
Product CSS may consume semantic roles, not primitive palette values. Primitive values remain isolated in the Foundation adapter.

### D-003: Accessibility is foundational
Visible focus, reduced motion, readable contrast, responsive behavior, and RTL support are release criteria rather than optional polish.

### D-004: Prevent regression before removing debt
The first implementation step adds a CI guard. This prevents new drift while legacy declarations are converted in controlled waves.

## Completion checklist

- [x] Tracking issue and migration branch created
- [x] Baseline audit recorded
- [x] Automated Foundation guard added
- [x] Quality command includes Foundation validation
- [ ] Shell and navigation converted to semantic roles
- [ ] Buttons and form controls converted
- [ ] Cards and data-display components converted
- [ ] Dialogs, menus, toasts, and authentication converted
- [ ] Raw product-facing colors removed
- [ ] Legacy aliases removed
- [ ] RTL and responsive review completed
- [ ] Web quality pipeline green
- [ ] Mobile quality pipeline green
- [ ] Vercel preview verified
- [ ] Pull request merged
