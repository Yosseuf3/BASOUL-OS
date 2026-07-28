-- YOSSEUF OS v3.0.0-alpha.11 — plan understanding and human correction workflow

create table if not exists public.architectural_plan_elements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  drawing_id uuid not null references public.architectural_drawings(id) on delete cascade,
  analysis_run_id uuid references public.architectural_analysis_runs(id) on delete set null,
  element_type text not null check (element_type in ('wall', 'opening', 'room', 'label', 'dimension')),
  label text not null check (char_length(trim(label)) between 1 and 160),
  value text,
  unit text check (unit is null or char_length(unit) <= 24),
  geometry jsonb not null default '{}'::jsonb,
  confidence_score integer not null default 100 check (confidence_score between 0 and 100),
  source text not null default 'manual' check (source in ('automatic', 'manual')),
  status text not null default 'detected' check (status in ('detected', 'confirmed', 'corrected', 'rejected')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists architectural_plan_elements_user_created_idx
  on public.architectural_plan_elements (user_id, created_at desc);
create index if not exists architectural_plan_elements_project_idx
  on public.architectural_plan_elements (project_id, element_type);
create index if not exists architectural_plan_elements_drawing_idx
  on public.architectural_plan_elements (drawing_id, status);
create index if not exists architectural_plan_elements_analysis_run_idx
  on public.architectural_plan_elements (analysis_run_id)
  where analysis_run_id is not null;

alter table public.architectural_plan_elements enable row level security;

drop policy if exists "architectural_plan_elements_select_own" on public.architectural_plan_elements;
create policy "architectural_plan_elements_select_own" on public.architectural_plan_elements
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "architectural_plan_elements_insert_own" on public.architectural_plan_elements;
create policy "architectural_plan_elements_insert_own" on public.architectural_plan_elements
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.architectural_drawings d
      where d.id = drawing_id
        and d.project_id = project_id
        and d.user_id = (select auth.uid())
    )
  );

drop policy if exists "architectural_plan_elements_update_own" on public.architectural_plan_elements;
create policy "architectural_plan_elements_update_own" on public.architectural_plan_elements
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.architectural_drawings d
      where d.id = drawing_id
        and d.project_id = project_id
        and d.user_id = (select auth.uid())
    )
  );

drop policy if exists "architectural_plan_elements_delete_own" on public.architectural_plan_elements;
create policy "architectural_plan_elements_delete_own" on public.architectural_plan_elements
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.architectural_plan_elements to authenticated;
revoke all on public.architectural_plan_elements from anon;
