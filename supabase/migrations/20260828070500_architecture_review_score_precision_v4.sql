-- Architectural Understanding v4 produces weighted confidence scores.
-- Preserve decimal precision instead of rejecting valid analysis runs at persistence time.
alter table public.architectural_reviews
  alter column plan_health type numeric(5,2) using plan_health::numeric;

alter table public.architectural_analysis_runs
  alter column quality_score type numeric(5,2) using quality_score::numeric;
