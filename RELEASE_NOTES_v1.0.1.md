# YOSSEUF OS v1.0.1 — Authentication Diagnostics Hotfix

This hotfix improves diagnosis and recovery when the browser cannot reach Supabase Auth.

## Changes

- Verifies `/auth/v1/health` before sending the magic link request.
- Applies an 8-second timeout to expose blocked or unreachable connections.
- Distinguishes missing deployment configuration, offline state, timeout, network blocking, health-response errors, and OTP errors.
- Provides actionable Arabic messages and stable diagnostic codes.
- Logs safe diagnostic context to the browser console without printing secrets.

## Diagnostic codes

- `AUTH-NETWORK`: browser or network cannot reach Supabase.
- `AUTH-HEALTH`: Supabase health endpoint returned an unexpected status.
- `AUTH-OTP`: Supabase received the request and returned an authentication error.

## Deployment

Keep these Vercel variables configured for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Redeploy after updating environment variables.
