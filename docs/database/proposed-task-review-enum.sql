-- REVIEW ONLY. Not under supabase/migrations; do not apply without authorization.
-- Commit this transaction before installing code/functions that use Review.
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'Review' BEFORE 'Done';
-- No row updates, percentage changes, enum renames, grants or RLS changes.
