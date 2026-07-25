# Security

- All business tables must have Row Level Security enabled.
- Every ownership policy must enforce `auth.uid() = user_id` in both `USING` and `WITH CHECK`.
- The browser may use the Supabase anon key; it must never receive the service-role key.
- Apply `supabase/migration_v1.0.0_rc1.sql` before release.
- Report suspected cross-user data exposure as a release blocker.
