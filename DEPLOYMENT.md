# Deployment

## Vercel

1. Merge the release commit into `main` after the full quality gate passes.
2. Confirm the GitHub Quality Gate is green.
3. Confirm the repository remains connected to the production Vercel project.
4. Configure `.env.example` variables for Preview and Production.
5. Use `npm run build` as the build command.
6. Verify the preview with automated accessibility and bundle-budget gates plus critical user journeys.
7. Promote the verified deployment to Production.
8. Confirm the application displays the version declared in `lib/config/app-info.ts`.

For `v4.0.0-rc.1`, Preview must use **YOSSEUF Platform Staging** (`ogqdfucxwjutkpoahezn`). Production remains on **YOSSEUF Platform Backend** (`okghyypmkymxvtsuvdvb`) and is not promoted as part of the RC workflow.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional server-only read-only gateway health endpoints:

- `YOSSEUF_AI_GATEWAY_URL`
- `YOSSEUF_DIGITAL_HUMAN_GATEWAY_URL`

## Rollback

Keep the previous successful Vercel deployment available. Roll back immediately for authentication failure, data-loss behavior, cross-user data visibility, broken CRUD, or a blocking dashboard regression.

Database rollback is independent: do not apply the v4 organization workspace migration to Production until its Staging verification report is approved. The migration is additive and may be rolled back by removing `organization_workspaces` only when it contains no required data.
