# Test Checklist — v1.0.1 Auth Diagnostics Hotfix

- [ ] Quality Gate passes.
- [ ] Production deployment reaches Ready.
- [ ] Login page displays `v1.0.1 · Auth Diagnostics Hotfix`.
- [ ] Valid network: health check completes and magic-link request is sent.
- [ ] Offline mode: Arabic offline message appears.
- [ ] Blocked Supabase request: `AUTH-NETWORK` guidance appears.
- [ ] Supabase OTP error: message includes `AUTH-OTP`.
- [ ] Successful request tells the user to check inbox and spam.
- [ ] No Supabase keys are printed to the console.
