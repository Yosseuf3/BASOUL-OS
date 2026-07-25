-- YOSSEUF OS v0.6.0 — Content Studio Foundation
-- Safe, repeatable migration for Supabase/PostgreSQL.

BEGIN;

CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id uuid NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  hook text NULL,
  script text NULL,
  cta text NULL,
  hashtags text NULL,
  platform text NOT NULL DEFAULT 'TikTok',
  status text NOT NULL DEFAULT 'Idea',
  publish_date date NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_items_platform_check CHECK (platform IN ('TikTok','Instagram','YouTube','Facebook','LinkedIn','X')),
  CONSTRAINT content_items_status_check CHECK (status IN ('Idea','Draft','Recording','Editing','Scheduled','Published'))
);

ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS hook text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS script text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS cta text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS hashtags text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS publish_date date;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.content_items SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.content_items ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS content_items_user_id_idx ON public.content_items(user_id);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON public.content_items(status);
CREATE INDEX IF NOT EXISTS content_items_platform_idx ON public.content_items(platform);
CREATE INDEX IF NOT EXISTS content_items_publish_date_idx ON public.content_items(publish_date);
CREATE INDEX IF NOT EXISTS content_items_project_id_idx ON public.content_items(project_id);
CREATE INDEX IF NOT EXISTS content_items_client_id_idx ON public.content_items(client_id);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own content" ON public.content_items;
CREATE POLICY "Users manage own content" ON public.content_items
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS content_items_set_updated_at ON public.content_items;
CREATE TRIGGER content_items_set_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
