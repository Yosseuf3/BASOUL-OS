-- YOSSEUF OS v0.9.3 — Notification Center Foundation
begin;
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_event_id uuid references public.activity_events(id) on delete cascade,
  module text not null, priority text not null default 'info', title text not null, message text, entity_id uuid,
  is_read boolean not null default false, read_at timestamptz, created_at timestamptz not null default now(),
  constraint notifications_priority_check check (priority in ('info','medium','high'))
);
create index if not exists notifications_user_unread_idx on public.notifications(user_id,is_read,created_at desc);
create index if not exists notifications_user_priority_idx on public.notifications(user_id,priority,created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications" on public.notifications for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
commit;
