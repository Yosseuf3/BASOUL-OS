# YOSSEUF OS v1.0.0.1 — Test Checklist

## Release configuration
- [x] Sidebar displays `v1.0.0 · Stable`.
- [x] `.eslintrc.json` exists and extends `next/core-web-vitals`.
- [x] GitHub Actions uses Node.js 22.
- [x] Workflow does not require an npm cache lock file.

## Quality gate
- [ ] `npm install` succeeds.
- [ ] `npm run lint` succeeds.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build` succeeds.
- [ ] Vercel deployment is Ready.

## Smoke tests
- [ ] Login and logout.
- [ ] Dashboard loads real workspace data.
- [ ] Project, task, client, and finance CRUD paths work.
- [ ] Desktop and 390px mobile layouts are usable.
