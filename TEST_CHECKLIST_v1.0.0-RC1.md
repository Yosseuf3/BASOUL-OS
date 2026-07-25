# YOSSEUF OS v1.0.0 — Test Checklist

## Quality gate
- [ ] `npm install` succeeds
- [ ] `npm run lint` succeeds
- [ ] `npm run typecheck` succeeds
- [ ] `npm run build` succeeds

## Database and security
- [ ] All migrations applied in order
- [ ] RC1 security migration applied
- [ ] User A cannot read or mutate User B data
- [ ] Create/update payloads retain the authenticated `user_id`
- [ ] Delete actions affect only the selected owned row

## Functional smoke test
- [ ] Sign up / sign in / sign out
- [ ] Projects CRUD
- [ ] Tasks CRUD
- [ ] Clients CRUD
- [ ] Content CRUD
- [ ] Knowledge CRUD
- [ ] Finance CRUD
- [ ] Notifications read/delete flows
- [ ] Activity feed records expected actions
- [ ] Global search opens the correct module
- [ ] Quick Create opens every supported form

## Decision Layer
- [ ] Workspace Health changes with real data
- [ ] Overdue items appear consistently for a fixed date
- [ ] Greeting and date-based summaries use the same runtime date
- [ ] Priorities and alerts navigate correctly

## Responsive and accessibility
- [ ] 390px layout
- [ ] 768px layout
- [ ] Desktop layout
- [ ] Keyboard navigation and visible focus
- [ ] Modals close with Escape
- [ ] Form controls have readable labels

## Deployment
- [ ] Vercel Preview passes smoke test
- [ ] Environment variables configured
- [ ] Production deployment succeeds
- [ ] Previous deployment remains available for rollback
