# YOSSEUF OS v0.9.6 — Test Checklist

## App Shell
- [ ] Sidebar renders on desktop and mobile.
- [ ] Workspace Switcher opens, selects enabled workspaces and blocks Engineering placeholder.
- [ ] Workspace selection routes Executive, Operations and Knowledge correctly.
- [ ] Top bar displays active workspace context.

## Universal Create
- [ ] Create button opens the universal dialog.
- [ ] Floating action button opens the same dialog.
- [ ] Keyboard shortcut `N` opens the dialog outside form fields.
- [ ] `Esc` closes the dialog.
- [ ] All six create targets open their existing forms.
- [ ] Task creation without projects redirects safely.

## Intelligence
- [ ] Workspace Health score changes with overdue tasks, held projects, unread high-priority notifications and pending finance items.
- [ ] Score remains between 0 and 100.
- [ ] Dashboard health card routes correctly.

## Responsive
- [ ] 390 px viewport is usable without horizontal overflow.
- [ ] FAB remains reachable and does not cover essential controls.
- [ ] Quick Create becomes one column on narrow screens.
- [ ] Touch targets are at least approximately 44 px.

## Regression
- [ ] Authentication works.
- [ ] Workspace data loads and partial failure handling remains intact.
- [ ] Existing project, task, client, finance, knowledge and content CRUD flows work.
- [ ] Global search and notification flows remain operational.
- [ ] `npm run build` succeeds in a dependency-complete local environment.
