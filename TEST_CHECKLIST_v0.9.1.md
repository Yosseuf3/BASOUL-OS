# YOSSEUF OS v0.9.1 — Test Checklist

## Command Center
- [ ] Greeting and date render correctly.
- [ ] Overdue, due-today, seven-day, and pending-payment counts match stored data.
- [ ] Each command card navigates to the correct module.

## Global Search
- [ ] Search button opens the modal.
- [ ] Ctrl/Cmd + K toggles the modal.
- [ ] Escape closes the modal.
- [ ] Search covers projects, tasks, clients, content, knowledge, and finance.
- [ ] Selecting a result navigates to the correct module.
- [ ] Empty state appears for unmatched queries.

## Regression
- [ ] Authentication works.
- [ ] Existing CRUD operations work in every module.
- [ ] Finance calculations remain currency-safe.
- [ ] Mobile sidebar and responsive layouts work.
- [ ] npm run build succeeds.
