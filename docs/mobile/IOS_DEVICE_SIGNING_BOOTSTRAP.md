# BASOUL iOS Device Signing Bootstrap

## Purpose

Prepare the first BASOUL development build for a physical iPhone after the successful iOS Simulator build.

## Protected identity

The following identifiers must remain unchanged during this bootstrap:

- Expo slug: `yosseuf-os`
- URL scheme: `yosseufos`
- iOS bundle identifier: `com.yosseufradwan.os`
- EAS project ID: `6f770730-8c8e-49b0-81b9-f9773faf567a`

## One-time interactive credential setup

From the `mobile` directory, authenticate to Expo/EAS and run:

```bash
npx eas-cli@latest build --platform ios --profile development
```

When EAS prompts for Apple credentials, allow EAS to create or reuse the required iOS Distribution Certificate and Provisioning Profile for internal distribution.

Do not change the bundle identifier, EAS project, app ownership, or URL scheme during credential setup.

After the first interactive credential setup succeeds, the guarded GitHub Actions workflow can queue future iOS development builds non-interactively using the repository `EXPO_TOKEN` secret.

## Validation gate

Before any App Store Connect or TestFlight submission:

- `expo.version` must use Apple-compatible numeric format.
- Expo Doctor must pass.
- BASOUL display identity must remain intact.
- Signed identifiers above must remain unchanged.
