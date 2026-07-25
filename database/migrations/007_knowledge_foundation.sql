-- YOSSEUF OS v0.7.0 — Knowledge Foundation
-- Safe, repeatable migration for Supabase/PostgreSQL.
BEGIN;

CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NULL,
  type text NOT NULL DEFAULT 'Note',
  tags text NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_items_type_check CHECK (type IN ('Note','Idea','Reference','Template'))
);

ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS tags text;
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE public.knowledge_items SET is_favorite = false WHERE is_favorite IS NULL;
UPDATE public.knowledge_items SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE public.knowledge_items ALTER COLUMN is_favorite SET NOT NULL;
ALTER TABLE public.knowledge_items ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS knowledge_items_user_id_idx ON public.knowledge_items(user_id);
CREATE INDEX IF NOT EXISTS knowledge_items_type_idx ON public.knowledge_items(type);
CREATE INDEX IF NOT EXISTS knowledge_items_favorite_idx ON public.knowledge_items(is_favorite);
CREATE INDEX IF NOT EXISTS knowledge_items_updated_at_idx ON public.knowledge_items(updated_at DESC);

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own knowledge" ON public.knowledge_items;
CREATE POLICY "Users manage own knowledge" ON public.knowledge_items
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

DROP TRIGGER IF EXISTS knowledge_items_set_updated_at ON public.knowledge_items;
CREATE TRIGGER knowledge_items_set_updated_at
BEFORE UPDATE ON public.knowledge_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
