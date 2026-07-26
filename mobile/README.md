# YOSSEUF OS Mobile Foundation

A standalone Expo SDK 57 application scaffold. It is intentionally not part of the root npm workspaces yet because the current Next.js web application uses React 18 while Expo SDK 57 uses React 19. Keeping installs isolated protects the production web deployment from duplicate React/native dependency conflicts.

## Run

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

Use the same Supabase project values as the web application, with the `EXPO_PUBLIC_` prefixes shown in `.env.example`.

## Activation gate

The mobile application becomes a full workspace member after the web runtime is upgraded to a React version compatible with the selected Expo SDK. Until then, portable domain logic lives under `packages/` and can be consumed by both apps without coupling it to React components.
