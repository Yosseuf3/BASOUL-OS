# Test Checklist — v2.0.1

- [ ] `npm run typecheck`
- [ ] `npm run doctor` returns 20/20
- [ ] Supabase Redirect URLs includes `yosseufos://auth/callback`
- [ ] Existing email receives a Magic Link
- [ ] Link opens YOSSEUF OS Dev Client
- [ ] Session is established and dashboard loads
- [ ] App restart preserves session
- [ ] Sign out returns to the email-only login screen
- [ ] Expired/invalid link shows a readable error
