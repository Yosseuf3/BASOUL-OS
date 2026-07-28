# YOSSEUF OS v3.0.0-alpha.22 Test Checklist

- [ ] Selecting an overlay element enables the spatial comment composer.
- [ ] Saving records the element, page, geometry, drawing, and project.
- [ ] Open comments appear as pins over the drawing.
- [ ] Selecting a comment pin navigates to its log entry.
- [ ] A comment can be resolved and reopened.
- [ ] A comment can be deleted by its owner.
- [ ] Comments from other drawings do not appear in the active log.
- [ ] RLS rejects cross-user project, drawing, element, and finding references.
- [ ] Migration is idempotent and production SQL execution succeeds.
- [ ] Release consistency, lint, web typecheck, mobile typecheck, and production build pass.
