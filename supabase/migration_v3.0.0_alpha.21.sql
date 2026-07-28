-- YOSSEUF OS v3.0.0-alpha.21
-- Spatial links between review findings and detected plan elements.

alter table public.architectural_review_findings
  add column if not exists plan_element_id uuid
    references public.architectural_plan_elements(id) on delete set null,
  add column if not exists geometry jsonb not null default '{}'::jsonb,
  add column if not exists page_number integer
    check (page_number is null or page_number > 0);

create index if not exists architectural_findings_plan_element_idx
  on public.architectural_review_findings (plan_element_id)
  where plan_element_id is not null;

create index if not exists architectural_findings_drawing_page_idx
  on public.architectural_review_findings (drawing_id, page_number)
  where page_number is not null;

drop policy if exists "architectural_findings_update_own"
  on public.architectural_review_findings;

create policy "architectural_findings_update_own"
  on public.architectural_review_findings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      plan_element_id is null
      or exists (
        select 1
        from public.architectural_plan_elements element
        where element.id = plan_element_id
          and element.user_id = (select auth.uid())
          and element.drawing_id = architectural_review_findings.drawing_id
      )
    )
  );

grant select, update
  on public.architectural_review_findings
  to authenticated;

revoke all
  on public.architectural_review_findings
  from anon;
