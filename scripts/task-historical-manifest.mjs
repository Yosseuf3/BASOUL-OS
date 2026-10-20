// The legacy version stream requires the timestamped client baseline at v0.5.
export function historicalMigrationPlan(legacy,timestamped) {
 const baseline='20260802204800_clients_baseline_repair.sql';
 if(!timestamped.includes(baseline))throw new Error('CLIENT_BASELINE_MISSING');
 const versions=legacy.filter(n=>/^migration_v.*\.sql$/.test(n)).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
 if(!versions.includes('migration_v0.5.0.sql'))throw new Error('CLIENT_UPGRADE_MISSING');
 return versions.flatMap(n=>n==='migration_v0.5.0.sql'?['supabase/migrations/'+baseline,'supabase/'+n]
  :n==='migration_v3.0.0_alpha.5.sql'?['database/migrations/011_architectural_intelligence_foundation.sql','supabase/'+n]:['supabase/'+n])
  .concat(timestamped.filter(n=>n.endsWith('.sql')&&n!==baseline).sort().map(n=>'supabase/migrations/'+n));
}
