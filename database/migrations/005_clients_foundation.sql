-- YOSSEUF OS v0.5.0
-- Database repair migration tailored to the current Supabase state.
-- Safe to run more than once.

-- 1) Extend the existing enum.
-- Keep this outside the transaction so PostgreSQL can use the new value safely afterward.
ALTER TYPE public.client_status
ADD VALUE IF NOT EXISTS 'Completed';

BEGIN;

-- 2) Complete the clients table.
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS source text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.clients
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

ALTER TABLE public.clients
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL;

-- 3) Link projects to clients.
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS client_id uuid;

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'projects_client_id_fkey'
          AND conrelid = 'public.projects'::regclass
    ) THEN
        ALTER TABLE public.projects
            ADD CONSTRAINT projects_client_id_fkey
            FOREIGN KEY (client_id)
            REFERENCES public.clients(id)
            ON DELETE SET NULL;
    END IF;
END
$migration$;

-- 4) Helpful indexes.
CREATE INDEX IF NOT EXISTS clients_status_idx
    ON public.clients(status);

CREATE INDEX IF NOT EXISTS clients_updated_at_idx
    ON public.clients(updated_at DESC);

CREATE INDEX IF NOT EXISTS projects_client_id_idx
    ON public.projects(client_id);

-- 5) Keep updated_at current automatically.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS clients_set_updated_at ON public.clients;

CREATE TRIGGER clients_set_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6) Confirm RLS remains enabled.
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

COMMIT;
