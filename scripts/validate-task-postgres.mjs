// Opt-in real PostgreSQL regression. Never accepts a remote URL or credentials.
import { readFileSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const container = 'basoul-pr173-validation';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'Docker failed');
  return result.stdout.trim();
}
const isolation = JSON.parse(docker(['inspect', container]))[0];
assert.equal(isolation.HostConfig.NetworkMode, 'none');
assert.deepEqual(isolation.Mounts, []);
assert.ok(isolation.HostConfig.Tmpfs['/var/lib/postgresql/data']);
assert.deepEqual(isolation.NetworkSettings.Ports, {});
const query = (db, sql) => docker(['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-At'], sql);
const auth = `CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`;
const stamp = Date.now();
const databases = [];
for (const path of ['fresh', 'upgrade']) {
  const db = `basoul_pr173_${path}_${stamp}`; databases.push(db);
  docker(['exec', container, 'createdb', '-U', 'postgres', db]);
  query(db, auth);
  let bootstrap = read('supabase/schema.sql');
  if (path === 'upgrade') {
    // Representative pre-Review enum installation; full task/project shape retained.
    bootstrap = bootstrap.replace("'Waiting','Review','Done'", "'Waiting','Done'");
  }
  query(db, bootstrap);
  query(db, read('database/migrations/009_activity_feed_foundation.sql'));
  query(db, read('supabase/migrations/20260802204811_iam_foundation.sql'));
  // Exact repository organization/table policies. Storage tests are out of scope.
  query(db, read('supabase/migrations/20260802204818_iam_rls.sql').split('-- Storage remains')[0] + '\nCOMMIT;');
  query(db, read('tests/fixtures/task-postgres-fixtures.sql'));
  const rows = () => query(db, "SELECT md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.tasks t;");
  const before = rows();
  const policies = () => query(db, "SELECT md5(string_agg(row_to_json(p)::text,'|' ORDER BY polname)) FROM pg_policy p WHERE polrelid IN ('tasks'::regclass,'activity_events'::regclass);");
  const policiesBefore = policies();
  // Separate committed invocation: newly added enum values cannot be used before commit.
  query(db, read('docs/database/proposed-task-review-enum.sql'));
  assert.equal(rows(), before, 'migration changed historical rows/progress');
  query(db, 'BEGIN;\n' + read('docs/database/proposed-task-transition-enforcement.sql') + '\nCOMMIT;');
  assert.equal(policies(), policiesBefore, 'enforcement changed RLS');
  query(db, read('tests/fixtures/task-postgres-regression.sql'));
  console.log(`${path}: migration, preservation, 25 transitions, RLS, audit and legacy-request tests PASS`);
}
const schema = (db) => query(db, `SELECT data_type||':'||udt_name||':'||column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='status';
SELECT enumlabel FROM pg_enum WHERE enumtypid='task_status'::regtype ORDER BY enumsortorder;`);
assert.equal(schema(databases[0]), schema(databases[1]), 'fresh/upgrade status schema mismatch');
const db = databases[1];
const base = `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`;
const transition = `SELECT status FROM public.transition_task_status('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Waiting','2026-10-11T00:00:00Z','In Progress');`;
function asyncSql(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec','-i',container,'psql','-X','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At']);
    let output = ''; child.stdout.on('data', x => output += x); child.stderr.on('data', x => output += x);
    child.on('error', reject); child.on('close', code => resolve({code,output})); child.stdin.end(sql);
  });
}
const [first, stale] = await Promise.all([
  asyncSql(`BEGIN; ${base} ${transition} SELECT pg_sleep(3); COMMIT;`),
  asyncSql(`SELECT pg_sleep(0.5); ${base} ${transition}`),
]);
assert.equal(first.code,0,first.output); assert.notEqual(stale.code,0);
assert.match(stale.output,/TASK_TRANSITION_CONFLICT/);
assert.equal(query(db,"SELECT count(*) FROM activity_events WHERE entity_id='20000000-0000-0000-0000-000000000001';"),'1');
console.log('PASS fresh/upgrade status parity; real concurrent row lock + stale-version rejection; exactly one audit event');
console.log('Databases retained for inspection:', databases.join(', '));
console.log('LIMIT: simulated auth.uid, not GoTrue/PostgREST/JWT verification; legacy direct writers remain BLOCKED for activation.');
