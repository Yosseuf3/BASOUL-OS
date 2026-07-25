# YOSSEUF OS v0.8.0 — Test Checklist

## Architecture Refactor
- [ ] Production build succeeds.
- [ ] Existing Projects, Tasks, Clients, Content, and Knowledge modules load normally.
- [ ] CRUD operations still work through the shared repository layer.
- [ ] Authentication and RLS behavior are unchanged.

## Finance Foundation
- [ ] Run `supabase/migration_v0.8.0.sql`.
- [ ] Finance navigation opens correctly.
- [ ] Create Income and Expense transactions.
- [ ] Edit and delete a transaction.
- [ ] Search and type filters work.
- [ ] Income, expense, and net cash-flow totals are correct.
- [ ] Project/client links display correctly.
- [ ] Another user cannot access the current user's financial records.
