import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const migration = fs.readFileSync('supabase/migrations/20260828051000_architectural_analysis_tenant_context_repair.sql', 'utf8');

test('analysis persistence no longer depends on default organization inference', () => {
  for (const table of [
    'architectural_analysis_runs',
    'architectural_reviews',
    'architectural_review_findings',
    'architectural_plan_elements',
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} alter column organization_id drop default`));
  }
  assert.doesNotMatch(migration, /default_organization_id\s*\(/);
});

test('tenant context is derived from drawing and review lineage', () => {
  assert.match(migration, /from public\.architectural_drawings d/);
  assert.match(migration, /from public\.architectural_reviews r/);
  assert.match(migration, /Architectural project\/drawing tenant mismatch/);
  assert.match(migration, /Architectural review\/drawing tenant mismatch/);
});

test('all analysis persistence tables install tenant triggers', () => {
  assert.match(migration, /trg_architectural_analysis_runs_tenant/);
  assert.match(migration, /trg_architectural_reviews_tenant/);
  assert.match(migration, /trg_architectural_review_findings_tenant/);
  assert.match(migration, /trg_architectural_plan_elements_tenant/);
});
