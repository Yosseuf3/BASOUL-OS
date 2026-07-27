-- YOSSEUF OS v2.2.0 — Architectural Intelligence Foundation
create table if not exists public.drawing_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  format text not null check (format in ('pdf','image','dwg','dxf','ifc','rvt')),
  revision text not null default 'A',
  storage_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.architectural_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  drawing_id uuid not null references public.drawing_assets(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing','ready','failed','archived')),
  plan_health integer check (plan_health between 0 and 100),
  engine_version text not null,
  disclaimer text not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.architectural_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid not null references public.architectural_reviews(id) on delete cascade,
  drawing_id uuid not null references public.drawing_assets(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  recommendation text not null,
  category text not null,
  severity text not null check (severity in ('info','opportunity','warning','critical')),
  status text not null default 'open' check (status in ('open','accepted','rejected','resolved','converted_to_task')),
  confidence integer not null check (confidence between 0 and 100),
  location jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drawing_assets enable row level security;
alter table public.architectural_reviews enable row level security;
alter table public.architectural_findings enable row level security;

create policy "drawing_assets_owner" on public.drawing_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "architectural_reviews_owner" on public.architectural_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "architectural_findings_owner" on public.architectural_findings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists drawing_assets_project_idx on public.drawing_assets(project_id, created_at desc);
create index if not exists architectural_reviews_drawing_idx on public.architectural_reviews(drawing_id, created_at desc);
create index if not exists architectural_findings_review_idx on public.architectural_findings(review_id, severity, status);
