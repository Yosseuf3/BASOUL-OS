-- YOSSEUF OS v1.0.0 RC1 — ownership security hardening
-- Idempotent. Run after all earlier migrations.

begin;

alter table if exists public.projects enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.clients enable row level security;
alter table if exists public.content_items enable row level security;
alter table if exists public.knowledge_items enable row level security;
alter table if exists public.finance_transactions enable row level security;
alter table if exists public.activity_events enable row level security;
alter table if exists public.notifications enable row level security;

-- Recreate canonical ownership policies with identical semantics.
do $policies$
declare
  table_name text;
begin
  foreach table_name in array array['projects','tasks','clients','content_items','knowledge_items','finance_transactions','activity_events','notifications']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop policy if exists %I on public.%I', 'Users manage own ' || table_name, table_name);
      execute format('create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', 'Users manage own ' || table_name, table_name);
      execute format('create index if not exists %I on public.%I (user_id)', table_name || '_user_id_idx', table_name);
    end if;
  end loop;
end
$policies$;

commit;
