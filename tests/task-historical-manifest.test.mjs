import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historicalMigrationPlan} from '../scripts/task-historical-manifest.mjs';
test('historical dependency plan installs the existing client baseline before v0.5 and IAM after architecture',()=>{
 const plan=historicalMigrationPlan(['migration_v3.0.0_alpha.11.sql','migration_v0.5.0.sql','migration_v3.0.0_alpha.5.sql','migration_v3.0.0_alpha.9.sql','migration_v0.1.0.sql'],['20260802204811_iam_foundation.sql','20260802204800_clients_baseline_repair.sql']);
 assert.ok(plan.indexOf('supabase/migrations/20260802204800_clients_baseline_repair.sql')<plan.indexOf('supabase/migration_v0.5.0.sql'));
 assert.ok(plan.indexOf('supabase/migration_v3.0.0_alpha.9.sql')<plan.indexOf('supabase/migration_v3.0.0_alpha.11.sql'));
 assert.equal(plan.at(-1),'supabase/migrations/20260802204811_iam_foundation.sql');
 assert.equal(plan.filter(p=>p.endsWith('clients_baseline_repair.sql')).length,1);
 assert.ok(plan.indexOf('database/migrations/011_architectural_intelligence_foundation.sql')<plan.indexOf('supabase/migration_v3.0.0_alpha.5.sql'));
});
test('missing canonical baseline or client upgrade fails before any replay',()=>{
 assert.throws(()=>historicalMigrationPlan(['migration_v0.5.0.sql'],[]),/CLIENT_BASELINE_MISSING/);
 assert.throws(()=>historicalMigrationPlan([],['20260802204800_clients_baseline_repair.sql']),/CLIENT_UPGRADE_MISSING/);
});
