-- YOSSEUF OS v0.8.0 — Finance Foundation
-- Safe, idempotent, and preserves existing data.

begin;

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  type text not null default 'Expense',
  category text not null default 'General',
  description text not null,
  amount numeric(14,2) not null default 0,
  currency text not null default 'SAR',
  status text not null default 'Paid',
  transaction_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_type_check check (type in ('Income','Expense')),
  constraint finance_status_check check (status in ('Pending','Paid','Cancelled')),
  constraint finance_amount_check check (amount >= 0)
);

create index if not exists finance_user_date_idx on public.finance_transactions(user_id, transaction_date desc);
create index if not exists finance_user_type_idx on public.finance_transactions(user_id, type);
create index if not exists finance_project_idx on public.finance_transactions(project_id);
create index if not exists finance_client_idx on public.finance_transactions(client_id);

alter table public.finance_transactions enable row level security;
drop policy if exists "Users manage own finance transactions" on public.finance_transactions;
create policy "Users manage own finance transactions" on public.finance_transactions
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists finance_transactions_set_updated_at on public.finance_transactions;
create trigger finance_transactions_set_updated_at before update on public.finance_transactions
for each row execute function public.set_updated_at();

commit;
