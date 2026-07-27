-- YOSSEUF OS v1.1.1 — Project Creation Wizard foundation
alter table public.projects add column if not exists project_number text;
alter table public.projects add column if not exists project_type text;
alter table public.projects add column if not exists location text;
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists budget numeric(14,2);
alter table public.projects add column if not exists currency text not null default 'SAR';
alter table public.projects add column if not exists design_phase text;
alter table public.projects add column if not exists color text;
alter table public.projects add column if not exists icon text;
alter table public.projects add column if not exists client_id uuid references public.clients(id) on delete set null;

alter table public.projects drop constraint if exists projects_project_type_check;
alter table public.projects add constraint projects_project_type_check
  check (project_type is null or project_type in ('Villa','Residential Building','Commercial','Office','Interior','Other'));

alter table public.projects drop constraint if exists projects_design_phase_check;
alter table public.projects add constraint projects_design_phase_check
  check (design_phase is null or design_phase in ('Concept','Schematic','Design Development','Construction Documents','Site Supervision','Handover'));

alter table public.projects drop constraint if exists projects_budget_check;
alter table public.projects add constraint projects_budget_check check (budget is null or budget >= 0);

create unique index if not exists projects_user_project_number_unique_idx
  on public.projects(user_id, project_number)
  where project_number is not null and btrim(project_number) <> '';
create index if not exists projects_user_client_idx on public.projects(user_id, client_id);
create index if not exists projects_user_due_date_idx on public.projects(user_id, due_date);
