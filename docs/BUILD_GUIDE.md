# YOSSEUF OS Build Guide

## Web

From the repository root:

```bash
npm install
cp .env.example .env.local
npm run quality
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Mobile local validation

```bash
cd mobile
npm install
cp .env.example .env
npm run typecheck
npm run doctor
npx expo start
```

Required variables:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## EAS setup and builds

Run EAS commands from the mobile app directory:

```bash
cd mobile
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

After the first successful local EAS build, GitHub builds can use Base directory `/mobile` and one of the profiles in `mobile/eas.json`.

Do not commit `.env`, signing keys, provisioning profiles, or `credentials.json`.
