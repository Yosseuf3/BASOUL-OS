# YOSSEUF OS v2.0.1 — Magic Link Authentication

## Included
- Replaced mobile password login with Supabase Magic Link.
- Added the `yosseufos://auth/callback` deep-link callback.
- Supports both Supabase PKCE `code` callbacks and access/refresh token callbacks.
- Restores the session automatically when the email link returns to the app.
- Prevents unintended mobile account creation (`shouldCreateUser: false`).
- Added clear Arabic success and expired-link messages.

## Required Supabase setting
Add this exact URL to **Authentication → URL Configuration → Redirect URLs**:

`yosseufos://auth/callback`

## Test
1. Start the development client.
2. Enter the existing account email.
3. Press **إرسال رابط الدخول**.
4. Open the email on the emulator/device.
5. Press the login link and choose YOSSEUF OS if Android asks.
6. Confirm that the app opens the dashboard and the session remains after restart.
