-- YOSSEUF OS v3.0.0-alpha.6 — explainable drawing review workflow

create table if not exists public.architectural_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  drawing_id uuid not null references public.architectural_drawings(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'ready', 'completed')),
  plan_health integer not null check (plan_health between 0 and 100),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.architectural_review_findings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.architectural_reviews(id) on delete cascade,
  drawing_id uuid not null references public.architectural_drawings(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  recommendation text not null,
  category text not null check (category in ('circulation', 'privacy', 'lighting', 'space_efficiency', 'code', 'identity', 'constructability', 'cost')),
  severity text not null check (severity in ('info', 'opportunity', 'warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected', 'resolved', 'converted_to_task')),
  confidence_score integer not null check (confidence_score between 0 and 100),
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists architectural_reviews_user_project_idx
  on public.architectural_reviews (user_id, project_id, created_at desc);
create index if not exists architectural_reviews_drawing_idx
  on public.architectural_reviews (drawing_id);
create index if not exists architectural_reviews_project_idx
  on public.architectural_reviews (project_id);
create index if not exists architectural_findings_review_idx
  on public.architectural_review_findings (review_id, status, severity);
create index if not exists architectural_findings_drawing_idx
  on public.architectural_review_findings (drawing_id);
create index if not exists architectural_findings_user_idx
  on public.architectural_review_findings (user_id);
create index if not exists architectural_findings_task_idx
  on public.architectural_review_findings (task_id) where task_id is not null;

alter table public.architectural_reviews enable row level security;
alter table public.architectural_review_findings enable row level security;

drop policy if exists "architectural_reviews_select_own" on public.architectural_reviews;
create policy "architectural_reviews_select_own" on public.architectural_reviews
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "architectural_reviews_insert_own" on public.architectural_reviews;
create policy "architectural_reviews_insert_own" on public.architectural_reviews
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.architectural_drawings d where d.id = drawing_id and d.user_id = (select auth.uid()))
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );
drop policy if exists "architectural_reviews_update_own" on public.architectural_reviews;
create policy "architectural_reviews_update_own" on public.architectural_reviews
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "architectural_reviews_delete_own" on public.architectural_reviews;
create policy "architectural_reviews_delete_own" on public.architectural_reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "architectural_findings_select_own" on public.architectural_review_findings;
create policy "architectural_findings_select_own" on public.architectural_review_findings
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "architectural_findings_insert_own" on public.architectural_review_findings;
create policy "architectural_findings_insert_own" on public.architectural_review_findings
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.architectural_reviews r where r.id = review_id and r.user_id = (select auth.uid()))
    and exists (select 1 from public.architectural_drawings d where d.id = drawing_id and d.user_id = (select auth.uid()))
  );
drop policy if exists "architectural_findings_update_own" on public.architectural_review_findings;
create policy "architectural_findings_update_own" on public.architectural_review_findings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "architectural_findings_delete_own" on public.architectural_review_findings;
create policy "architectural_findings_delete_own" on public.architectural_review_findings
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.architectural_reviews to authenticated;
grant select, insert, update, delete on public.architectural_review_findings to authenticated;
revoke all on public.architectural_reviews from anon;
revoke all on public.architectural_review_findings from anon;
