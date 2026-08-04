-- Repairs the historical fresh-install gap before the v0.5.0 client migration.
begin;
do $$ begin
  create type public.client_status as enum ('Lead','Active','Inactive');
exception when duplicate_object then null; end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  company text,
  email text,
  phone text,
  status public.client_status not null default 'Lead',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients(user_id);
alter table public.clients enable row level security;
drop policy if exists "Users manage own clients" on public.clients;
create policy "Users manage own clients" on public.clients for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
commit;
