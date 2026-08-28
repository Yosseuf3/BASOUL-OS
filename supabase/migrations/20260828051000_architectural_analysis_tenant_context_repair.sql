alter table public.architectural_analysis_runs alter column organization_id drop default;
alter table public.architectural_reviews alter column organization_id drop default;
alter table public.architectural_review_findings alter column organization_id drop default;
alter table public.architectural_plan_elements alter column organization_id drop default;

create or replace function private.set_architectural_tenant_context()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_org uuid;
  v_project uuid;
  v_review_drawing uuid;
  v_review_org uuid;
begin
  if tg_table_name in ('architectural_analysis_runs','architectural_reviews','architectural_plan_elements') then
    select d.organization_id, d.project_id into v_org, v_project
    from public.architectural_drawings d
    where d.id = new.drawing_id;

    if v_org is null then
      raise exception 'Architectural drawing not found for tenant context';
    end if;
    if new.project_id is distinct from v_project then
      raise exception 'Architectural project/drawing tenant mismatch';
    end if;
    new.organization_id := v_org;
  elsif tg_table_name = 'architectural_review_findings' then
    select d.organization_id into v_org
    from public.architectural_drawings d
    where d.id = new.drawing_id;

    select r.drawing_id, r.organization_id into v_review_drawing, v_review_org
    from public.architectural_reviews r
    where r.id = new.review_id;

    if v_org is null or v_review_org is null then
      raise exception 'Architectural review context not found';
    end if;
    if v_review_drawing is distinct from new.drawing_id or v_review_org is distinct from v_org then
      raise exception 'Architectural review/drawing tenant mismatch';
    end if;
    new.organization_id := v_org;
  end if;
  return new;
end;
$$;

revoke all on function private.set_architectural_tenant_context() from public;

drop trigger if exists trg_architectural_analysis_runs_tenant on public.architectural_analysis_runs;
create trigger trg_architectural_analysis_runs_tenant
before insert or update of drawing_id, project_id, organization_id on public.architectural_analysis_runs
for each row execute function private.set_architectural_tenant_context();

drop trigger if exists trg_architectural_reviews_tenant on public.architectural_reviews;
create trigger trg_architectural_reviews_tenant
before insert or update of drawing_id, project_id, organization_id on public.architectural_reviews
for each row execute function private.set_architectural_tenant_context();

drop trigger if exists trg_architectural_review_findings_tenant on public.architectural_review_findings;
create trigger trg_architectural_review_findings_tenant
before insert or update of drawing_id, review_id, organization_id on public.architectural_review_findings
for each row execute function private.set_architectural_tenant_context();

drop trigger if exists trg_architectural_plan_elements_tenant on public.architectural_plan_elements;
create trigger trg_architectural_plan_elements_tenant
before insert or update of drawing_id, project_id, organization_id on public.architectural_plan_elements
for each row execute function private.set_architectural_tenant_context();
