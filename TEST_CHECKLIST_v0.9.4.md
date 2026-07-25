# YOSSEUF OS v0.9.4 — Release Checklist

## Dashboard 2.0
- [ ] Morning Brief changes according to live workspace data.
- [ ] Today's Focus displays no more than five ranked items.
- [ ] Overdue tasks appear above lower-priority work.
- [ ] Stalled/overdue projects generate decision items.
- [ ] Due client follow-ups appear in Today's Focus.
- [ ] Pending finance transactions appear in focus and alerts.
- [ ] High unread notifications appear as critical alerts.
- [ ] Smart empty states display meaningful next actions.

## Quick Actions
- [ ] New Project opens the project modal.
- [ ] New Task opens the task modal or redirects to Projects when none exist.
- [ ] New Client, Finance, Knowledge, and Content open their existing modals.

## UX and Responsive
- [ ] Desktop layout preserves hierarchy and readable spacing.
- [ ] Tablet collapses the main dashboard grids correctly.
- [ ] Mobile displays one KPI per row and usable quick actions.
- [ ] All dashboard navigation buttons open the correct module.
- [ ] Dark theme styles remain consistent.

## Verification
- [ ] `npm install` completes locally.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] Existing CRUD, Activity, Notifications, and Global Search still work.
- [ ] No database migration is required for v0.9.4.
