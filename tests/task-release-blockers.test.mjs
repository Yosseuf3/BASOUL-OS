import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('fresh bootstrap uses the five-state enum without rewriting existing text columns', () => {
  const sql = read('supabase/schema.sql');
  assert.match(sql, /create type public.task_status as enum \('To Do','In Progress','Waiting','Review','Done'\)/);
  assert.match(sql, /status public.task_status not null default 'To Do'/);
  assert.doesNotMatch(sql, /alter column status type/i);
});
test('prepared transition audit is invoker, tenant/actor bound, and transaction-local', () => {
  const sql = read('docs/database/proposed-task-transition-enforcement.sql');
  assert.match(sql, /AFTER UPDATE ON public.tasks/);
  assert.match(sql, /INSERT INTO public.activity_events/);
  assert.match(sql, /auth.uid\(\),NEW.organization_id/);
  for (const field of ['task_id','organization_id','actor_id','old_status','new_status','occurred_at','reason']) assert.ok(sql.includes(`'${field}'`));
  assert.match(sql, /p_reason text DEFAULT NULL/);
  assert.match(sql, /set_config\('basoul.task_reason','',true\)/);
  assert.match(sql, /OLD.updated_at \+ interval '1 microsecond'/);
  assert.doesNotMatch(sql.replace(/--[^\n]*/g,''), /SECURITY DEFINER|CREATE POLICY|ALTER POLICY/i);
});
test('real integration runner cannot target a production database or shared volume', () => {
  const script = read('scripts/validate-task-postgres.mjs');
  assert.match(script, /NetworkMode, 'none'/);
  assert.match(script, /isolation.Mounts, \[\]/);
  assert.match(script, /isolation.NetworkSettings.Ports, \{\}/);
  assert.match(script, /stale.output,\/TASK_TRANSITION_CONFLICT\//);
  assert.match(script, /policies\(\), policiesBefore/);
});
