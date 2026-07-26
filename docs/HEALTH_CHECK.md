# YOSSEUF OS — Platform Health Check

Release target: **v1.5.1 Cross Platform Stabilization**

## Quality gates

- [ ] Web dependencies install successfully.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Mobile dependencies install successfully.
- [ ] `npm run mobile:typecheck` passes.
- [ ] `npm run mobile:doctor` reports no blocking issues.

## Platform configuration

- [x] Web Supabase variables documented in `.env.example`.
- [x] Mobile Supabase variables documented in `mobile/.env.example`.
- [x] `mobile/eas.json` exists beside `mobile/package.json`.
- [x] Development, preview, and production EAS profiles exist.
- [x] iOS bundle identifier is configured.
- [x] Android application ID is configured.
- [ ] EAS project is linked with `eas init` and `extra.eas.projectId` is present.
- [ ] EAS environment variables are configured for development, preview, and production.
- [ ] First local EAS build succeeds.
- [ ] GitHub-triggered EAS build succeeds.

## Runtime verification

- [ ] Mobile login works with Supabase Auth.
- [ ] Session persists after restarting the app.
- [ ] Dashboard loads live workspace data.
- [ ] Projects list loads.
- [ ] Notifications list loads and can mark items as read.
- [ ] Logout clears the active session.
