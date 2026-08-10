# BASOUL Mobile Modal Scroll Regression — 2026-08-10

## Evidence

A real Production iPhone/Safari session showed the Finance transaction form extending below the dynamic viewport without allowing the user to reach the lower fields/actions.

## Scope

This is a responsive modal-shell defect, not a Finance data or business-logic defect. The fix must apply to long BASOUL Web modals generally so Projects/Clients/other forms do not reproduce the same failure.

## Acceptance

- Long modal content scrolls vertically on mobile Safari.
- Uses dynamic viewport sizing (`100dvh`) and iOS momentum scrolling.
- Respects safe-area insets.
- Desktop modal behavior remains unchanged.
- No Finance schema, Supabase, RLS, Auth, or YVL canonical mechanics changes.
