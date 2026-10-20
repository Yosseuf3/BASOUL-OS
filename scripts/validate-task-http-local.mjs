// Restore only the existing disposable, internal-network synthetic fixture stack.
// Never accepts connection URLs, credentials, container names or external targets.
import { spawnSync } from 'node:child_process';
import { readFileSync,readdirSync } from 'node:fs';
import { historicalMigrationPlan } from './task-historical-manifest.mjs';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const network = 'basoul-pr173-auth-network';
const database = 'basoul_pr173_auth_phase2_clean';
const services = ['basoul-pr173-auth-db', 'basoul-pr173-http-client', 'basoul-pr173-auth-clean', 'basoul-pr173-postgrest'];
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  // SQL and container environment can contain synthetic secrets: never echo them.
  if (result.status !== 0) throw new Error(`Local Docker ${args[0]} failed`);
  return result.stdout.trim();
}
const inspect = name => JSON.parse(docker(['inspect', name]))[0];
const env = (container, key) => container.Config.Env.find(value => value.startsWith(key + '='))?.slice(key.length + 1);
const literal = value => "'" + value.replaceAll("'", "''") + "'";
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
assert.equal(JSON.parse(docker(['network', 'inspect', network]))[0].Internal, true);
const images = ['public.ecr.aws/supabase/postgres:17.6.1.156', 'node:24-alpine', 'supabase/gotrue:v2.196.0', 'postgrest/postgrest:v14.17'];
const configurations = services.map(inspect);
for (let index = 0; index < configurations.length; index++) {
  const container = configurations[index];
  assert.equal(container.Config.Image, images[index]);
  assert.equal(container.HostConfig.NetworkMode, network);
  assert.deepEqual(Object.keys(container.NetworkSettings.Networks), [network]);
  assert.deepEqual(container.Mounts, []);
  assert.equal(container.HostConfig.Privileged, false);
  for (const bindings of Object.values(container.HostConfig.PortBindings ?? {})) {
    for (const binding of bindings ?? []) assert.equal(binding.HostIp, '127.0.0.1');
  }
}
assert.ok(configurations[0].HostConfig.Tmpfs['/var/lib/postgresql/data']);
const auth = configurations[2], rest = configurations[3];
const authUri = new URL(env(auth, 'GOTRUE_DB_DATABASE_URL'));
const restUri = new URL(env(rest, 'PGRST_DB_URI'));
for (const uri of [authUri, restUri]) {
  assert.equal(uri.hostname, services[0]);
  assert.equal(uri.pathname, '/' + database);
  assert.equal(uri.protocol, 'postgres:');
}
assert.equal(authUri.username, 'supabase_auth_admin');
assert.equal(restUri.username, 'authenticator');
assert.equal(env(auth, 'GOTRUE_MAILER_AUTOCONFIRM'), 'true');
const secret = env(auth, 'GOTRUE_JWT_SECRET');
assert.ok(secret && secret.length >= 32);
assert.equal(env(rest, 'PGRST_JWT_SECRET'), secret);
const password = decodeURIComponent(authUri.password);
const sql = (query, db = database) => docker(['exec', '-i', services[0], 'psql', '-X', '-U', 'supabase_admin', '-d', db, '-v', 'ON_ERROR_STOP=1', '-At'], query);
function request(path, body) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(header + '.' + payload).digest('base64url');
  const token = header + '.' + payload + '.' + signature;
  const code = "let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',async()=>{try{const q=JSON.parse(s);const r=await fetch('http://basoul-pr173-auth-clean:9999'+q.path,{method:q.body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+q.token},body:q.body?JSON.stringify(q.body):undefined,signal:AbortSignal.timeout(3000)});process.stdout.write(JSON.stringify({status:r.status,data:await r.json()}));}catch{process.exitCode=1;}})";
  return JSON.parse(docker(['exec', '-i', services[1], 'node', '-e', code], JSON.stringify({ path, body, token })));
}
try {
  docker(['start', services[0], services[1]]);
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    // TCP excludes the entrypoint's temporary socket-only initialization server.
    const result = spawnSync('docker', ['exec', services[0], 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']);
    if (result.status === 0) { ready = true; break; }
    await pause(1000);
  }
  assert.ok(ready, 'Synthetic PostgreSQL did not become ready');
  const exists = sql(`SELECT count(*) FROM pg_database WHERE datname=${literal(database)};`, 'postgres') === '1';
  if (!exists) {
    sql(`CREATE DATABASE ${database} OWNER supabase_admin;`, 'postgres');
    sql(`ALTER ROLE supabase_auth_admin PASSWORD ${literal(password)};
      ALTER ROLE supabase_auth_admin SET search_path = auth, public, extensions;
      ALTER ROLE authenticator PASSWORD ${literal(decodeURIComponent(restUri.password))};
      GRANT anon, authenticated, service_role TO authenticator;
      CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
      GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
      GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;`);
  }
  docker(['start', services[2]]);
  ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { if (request('/health').status === 200) { ready = true; break; } } catch { /* startup */ }
    await pause(1000);
  }
  assert.ok(ready, 'Synthetic GoTrue did not become ready');
  const users = [];
  const existing = request('/admin/users?page=1&per_page=50');
  assert.equal(existing.status, 200);
  for (let actor = 1; actor <= 4; actor++) {
    const email = `actor${actor}@synthetic.invalid`;
    let user = existing.data.users.find(candidate => candidate.email === email);
    if (!user) {
      const created = request('/admin/users', { email, password, email_confirm: true });
      assert.equal(created.status, 200, 'Synthetic Auth user creation failed');
      user = created.data;
    }
    assert.match(user.id, /^[0-9a-f-]{36}$/);
    users.push(user.id);
  }
  if (sql("SELECT to_regclass('public.tasks') IS NULL;") === 't') {
    // Standard JWT claim reader, matching Supabase auth.uid semantics.
    sql(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
      nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid $$;
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
    sql(read('supabase/schema.sql'));
    let fixtures = read('tests/fixtures/task-postgres-fixtures.sql');
    fixtures = fixtures.slice(fixtures.indexOf('INSERT INTO organizations'));
    users.forEach((id, index) => { fixtures = fixtures.replaceAll(`00000000-0000-0000-0000-00000000000${index + 1}`, id); });
    if(sql("SELECT to_regclass('storage.objects') IS NULL;")==='t')sql(read('tests/fixtures/historical-storage-catalog.sql'));
    const history=historicalMigrationPlan(readdirSync(new URL('../supabase/',import.meta.url)),readdirSync(new URL('../supabase/migrations/',import.meta.url)));
    for(const migration of history){
      sql(read(migration));
      if(migration.endsWith('20260802204818_iam_rls.sql'))sql(fixtures);
    }
    sql(`GRANT USAGE ON SCHEMA public TO authenticated;
      GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
      REVOKE CREATE ON SCHEMA public,private FROM PUBLIC,anon,authenticated;`);
    sql('BEGIN;\n' + read('docs/database/proposed-task-security-hardening.sql') + '\nCOMMIT;');
    sql('BEGIN;\n' + read('docs/database/proposed-task-transition-enforcement.sql') + '\nCOMMIT;');
  }
  if (sql("SELECT to_regclass('private.task_workflow_activation') IS NULL;") === 't') sql(read('docs/database/proposed-task-rollout-gate.sql'));
  // Exact synthetic organization only, never an externally supplied tenant.
  sql("INSERT INTO private.task_workflow_activation VALUES('10000000-0000-0000-0000-000000000001',true) ON CONFLICT(organization_id) DO UPDATE SET enabled=true;");
  if (sql("SELECT to_regclass('private.task_notification_receipts') IS NULL;") === 't') sql(read('docs/database/proposed-task-notifications.sql'));
  if(sql("SELECT to_regprocedure('public.edit_task_fields(uuid,uuid,timestamp with time zone,jsonb)') IS NULL;")==='t') sql(read('docs/database/proposed-task-edit-cas.sql'));
  docker(['start', services[3]]);
  sql("NOTIFY pgrst, 'reload schema';");
  const runner=process.argv.includes('--mobile')?'./validate-task-mobile-local.mjs':process.argv.includes('--browser')?'./validate-task-browser-local.mjs':'./validate-task-auth-http.mjs';
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(runner, import.meta.url))], { encoding: 'utf8',maxBuffer:8*1024*1024 });
  process.stdout.write(result.stdout ?? '');
  if (result.status !== 0) {
    let diagnostic = result.stderr ?? '';
    for (const credential of [secret, password, decodeURIComponent(restUri.password)]) {
      if (credential) diagnostic = diagnostic.replaceAll(credential, '[redacted]');
    }
    process.stderr.write(diagnostic);
    throw new Error('Authenticated HTTP validation failed');
  }
  console.log('PASS restored synthetic Auth/PostgREST stack');
} finally {
  // Stop only the four dedicated temporary services; retain containers/images/networks.
  docker(['stop', '--timeout', '10', ...services.toReversed()]);
  assert.ok(services.every(name => !inspect(name).State.Running));
  console.log('PASS all four synthetic HTTP services stopped');
}
