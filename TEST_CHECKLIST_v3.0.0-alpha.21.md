# YOSSEUF OS v3.0.0-alpha.21 Test Checklist

- [ ] A finding can be linked to an element from the same drawing.
- [ ] Elements from other drawings are not offered.
- [ ] A linked finding stores its page and geometry snapshot.
- [ ] A linked finding appears as a pin over the drawing.
- [ ] Warning and critical findings use distinct pin colors.
- [ ] Selecting a pin scrolls to the finding evidence and decision card.
- [ ] Unlinking removes the pin without deleting the finding.
- [ ] RLS prevents linking to a plan element owned by another user.
- [ ] Migration is idempotent and production SQL execution succeeds.
- [ ] Release consistency, lint, web typecheck, mobile typecheck, and production build pass.
