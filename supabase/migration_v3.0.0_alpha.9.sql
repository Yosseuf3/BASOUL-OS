-- YOSSEUF OS v3.0.0-alpha.9 ? explainable architectural analysis pipeline

create table if not exists public.architectural_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  drawing_id uuid not null references public.architectural_drawings(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  review_id uuid references public.architectural_reviews(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  engine_version text not null default 'preflight-v1',
  input_fingerprint text,
  extracted_metadata jsonb not null default '{}'::jsonb,
  quality_score integer check (quality_score between 0 and 100),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.architectural_review_findings
  add column if not exists analysis_run_id uuid references public.architectural_analysis_runs(id) on delete set null,
  add column if not exists evidence jsonb not null default '[]'::jsonb;

create index if not exists architectural_analysis_runs_user_created_idx
  on public.architectural_analysis_runs (user_id, created_at desc);
create index if not exists architectural_analysis_runs_drawing_idx
  on public.architectural_analysis_runs (drawing_id, created_at desc);
create index if not exists architectural_analysis_runs_project_idx
  on public.architectural_analysis_runs (project_id);
create index if not exists architectural_analysis_runs_review_idx
  on public.architectural_analysis_runs (review_id)
  where review_id is not null;
create unique index if not exists architectural_analysis_runs_active_drawing_idx
  on public.architectural_analysis_runs (drawing_id)
  where status in ('queued', 'processing');
create index if not exists architectural_findings_analysis_run_idx
  on public.architectural_review_findings (analysis_run_id)
  where analysis_run_id is not null;

alter table public.architectural_analysis_runs enable row level security;

drop policy if exists "architectural_analysis_runs_select_own" on public.architectural_analysis_runs;
create policy "architectural_analysis_runs_select_own" on public.architectural_analysis_runs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "architectural_analysis_runs_insert_own" on public.architectural_analysis_runs;
create policy "architectural_analysis_runs_insert_own" on public.architectural_analysis_runs
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.architectural_drawings d
      where d.id = drawing_id and d.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "architectural_analysis_runs_update_own" on public.architectural_analysis_runs;
create policy "architectural_analysis_runs_update_own" on public.architectural_analysis_runs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "architectural_analysis_runs_delete_own" on public.architectural_analysis_runs;
create policy "architectural_analysis_runs_delete_own" on public.architectural_analysis_runs
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.architectural_analysis_runs to authenticated;
revoke all on public.architectural_analysis_runs from anon;
