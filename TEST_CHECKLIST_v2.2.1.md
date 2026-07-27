# Test Checklist — v2.2.1 Release Consistency Hotfix

## Automated
- [ ] Run `npm run check:release`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Confirm ZIP integrity.

## Production smoke test
- [ ] Deployment source branch is `main`.
- [ ] Deployment commit matches the merged GitHub commit.
- [ ] Sidebar shows `v2.2.1 · Release Consistency Hotfix`.
- [ ] Hard refresh or private-window check shows the same version.
- [ ] Authentication, dashboard, navigation, and quick-create still work.
