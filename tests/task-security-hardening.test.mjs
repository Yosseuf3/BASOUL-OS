import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('review-only hardening denies dangerous grants without rewriting historical data or RLS',()=>{
 const sql=read('docs/database/proposed-task-security-hardening.sql');
 assert.match(sql,/TASK_VERSION_PREFLIGHT_REQUIRED/);
 assert.match(sql,/ALTER COLUMN updated_at SET NOT NULL/);
 assert.match(sql,/REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN/);
 assert.doesNotMatch(sql.replace(/--[^\n]*/g,''),/UPDATE public.tasks|CREATE POLICY|ALTER POLICY|SECURITY DEFINER/);
});
test('transition audit marker is guarded against edits, deletes and forged inserts',()=>{
 const sql=read('docs/database/proposed-task-security-hardening.sql');
 assert.match(sql,/OLD.metadata \? '_basoul_task_transition'/);
 assert.match(sql,/pg_trigger_depth\(\) <> 2/);
 assert.match(sql,/NEW.user_id IS DISTINCT FROM auth.uid\(\)/);
 assert.match(sql,/BEFORE INSERT OR UPDATE OR DELETE/);
 assert.match(read('docs/database/proposed-task-transition-enforcement.sql'),/'_basoul_task_transition',true/);
});
test('production-shaped SQL and actual HTTP runners cover append-only protection',()=>{
 assert.match(read('scripts/validate-task-postgres.mjs'),/ALTER COLUMN progress DROP NOT NULL/);
 assert.match(read('scripts/validate-task-auth-http.mjs'),/metadata._basoul_task_transition,true/);
 assert.match(read('tests/fixtures/task-security-regression.sql'),/CREATOR_TAKEOVER/);
});
