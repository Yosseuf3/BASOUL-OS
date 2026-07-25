# Deployment

## Vercel

1. Upload or merge the complete v1.0.0 package into the GitHub repository.
2. Confirm the GitHub Quality Gate passes.
3. Import or connect the repository to Vercel.
4. Configure the variables from `.env.example` for Preview and Production.
5. Use `npm run build` as the build command.
6. Deploy a Preview and complete `TEST_CHECKLIST_v1.0.0.md`.
7. Promote the verified deployment to Production.
8. Confirm the application displays `v1.0.0 · Stable`.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Rollback

Keep the previous successful Vercel deployment available. Roll back immediately for authentication failure, data-loss behavior, cross-user data visibility, broken CRUD, or a blocking dashboard regression.
