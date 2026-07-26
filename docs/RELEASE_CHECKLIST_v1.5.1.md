# Release Checklist — v1.5.1

## Source

- [x] Version updated to 1.5.1 in root and mobile packages.
- [x] Mobile app version updated to 1.5.1.
- [x] `mobile/eas.json` added.
- [x] Expo SDK package versions aligned.
- [x] `expo-dev-client` added for development builds.
- [x] `.easignore` added.
- [x] GitHub quality workflow includes mobile validation.

## Before merge

- [ ] Install root and mobile dependencies.
- [ ] Commit generated lockfiles.
- [ ] Run `npm run quality:all`.
- [ ] Confirm Vercel preview deployment.
- [ ] Link Expo project using `eas init`.
- [ ] Configure EAS environment variables.
- [ ] Complete one local Android development build.
- [ ] Complete one local iOS development build.

## Production acceptance

- [ ] Web deployment succeeds.
- [ ] Android preview build installs and authenticates.
- [ ] iOS preview build installs and authenticates.
- [ ] Live project, task, and notification data load correctly.
