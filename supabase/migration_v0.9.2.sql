-- YOSSEUF OS v0.9.2 — Unified Activity Feed Foundation
create extension if not exists "pgcrypto";
begin;
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('projects','tasks','clients','content','knowledge','finance','system')),
  action text not null check (action in ('created','updated','deleted','completed','paid','published')),
  entity_id uuid,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_user_created_idx on public.activity_events(user_id, created_at desc);
create index if not exists activity_events_user_module_idx on public.activity_events(user_id, module, created_at desc);
alter table public.activity_events enable row level security;
drop policy if exists "Users manage own activity events" on public.activity_events;
create policy "Users manage own activity events" on public.activity_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
commit;
