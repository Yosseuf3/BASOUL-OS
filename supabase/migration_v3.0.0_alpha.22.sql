-- YOSSEUF OS v3.0.0-alpha.22
-- Persistent spatial review comments and resolution history.

create table if not exists public.architectural_review_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  drawing_id uuid not null references public.architectural_drawings(id) on delete cascade,
  plan_element_id uuid references public.architectural_plan_elements(id) on delete set null,
  finding_id uuid references public.architectural_review_findings(id) on delete set null,
  page_number integer check (page_number is null or page_number > 0),
  geometry jsonb not null default '{}'::jsonb,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists architectural_review_comments_drawing_page_idx
  on public.architectural_review_comments (drawing_id, page_number, created_at desc);
create index if not exists architectural_review_comments_element_idx
  on public.architectural_review_comments (plan_element_id, status)
  where plan_element_id is not null;
create index if not exists architectural_review_comments_finding_idx
  on public.architectural_review_comments (finding_id)
  where finding_id is not null;
create index if not exists architectural_review_comments_user_idx
  on public.architectural_review_comments (user_id, created_at desc);

alter table public.architectural_review_comments enable row level security;

drop policy if exists "architectural_review_comments_select_own" on public.architectural_review_comments;
create policy "architectural_review_comments_select_own"
  on public.architectural_review_comments
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "architectural_review_comments_insert_own" on public.architectural_review_comments;
create policy "architectural_review_comments_insert_own"
  on public.architectural_review_comments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects project
      where project.id = project_id and project.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.architectural_drawings drawing
      where drawing.id = drawing_id
        and drawing.project_id = project_id
        and drawing.user_id = (select auth.uid())
    )
    and (
      plan_element_id is null
      or exists (
        select 1 from public.architectural_plan_elements element
        where element.id = plan_element_id
          and element.drawing_id = drawing_id
          and element.user_id = (select auth.uid())
      )
    )
    and (
      finding_id is null
      or exists (
        select 1 from public.architectural_review_findings finding
        where finding.id = finding_id
          and finding.drawing_id = drawing_id
          and finding.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "architectural_review_comments_update_own" on public.architectural_review_comments;
create policy "architectural_review_comments_update_own"
  on public.architectural_review_comments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "architectural_review_comments_delete_own" on public.architectural_review_comments;
create policy "architectural_review_comments_delete_own"
  on public.architectural_review_comments
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.architectural_review_comments to authenticated;
revoke all on public.architectural_review_comments from anon;
