# Installation

## Requirements
- Node.js 20 LTS or newer
- npm 10 or newer
- Supabase project

## Setup
1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Apply SQL migrations in filename/version order, ending with `supabase/migration_v1.0.0_rc1.sql`.
4. Run:

```bash
npm install
npm run quality
npm run dev
```

Never place a Supabase service-role key in a `NEXT_PUBLIC_` variable.
