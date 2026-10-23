import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify, evaluate} from '../scripts/release-scope.mjs';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

test('release scope: Web, Mobile, shared, database and policy boundaries', () => {
  for (const paths of [['app/tasks/page.tsx'], ['components/header.tsx'], ['public/logo.svg']]) assert.deepEqual(classify(paths), {web:true,mobile:false});
  assert.deepEqual(classify(['mobile/app/tasks.tsx']), {web:false,mobile:true});
  for (const path of ['app/api/tasks/route.ts', 'app/auth/page.tsx', 'mobile/security/policy.ts', 'packages/shared-types/src/task.ts', 'lib/organizations/rbac.ts', 'supabase/migrations/rls.sql', 'docs/database/candidate.sql', '.github/workflows/quality.yml', 'scripts/audit-mobile-production.mjs', 'package-lock.json', 'unknown.config', 'docs/operations/report.md']) {
    assert.deepEqual(classify([path]), {web:true,mobile:true}, path);
  }
  assert.deepEqual(classify([]), {web:true,mobile:true});
  assert.deepEqual(classify(['app/old.tsx','mobile/new.tsx']), {web:true,mobile:true});
});

test('workflow verifies scope before skipping Android work and always evaluates gates', () => {
  const workflow = readFileSync(new URL('../.github/workflows/quality.yml',import.meta.url),'utf8').replaceAll('\r\n','\n');
  for (const [id, name] of [['web','Web quality'],['mobile','Mobile quality']]) {
    const job = workflow.split(`\n  ${id}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0];
    assert.ok(job?.includes(`name: ${name}`));
    if(id==='web') assert.doesNotMatch(job, /\n    if:/);
    else {
      assert.ok(job.includes('if: ${{ always() }}'));
      assert.ok(job.includes('needs: [scope]'));
      assert.ok(job.indexOf('Verify Android scope evidence') < job.indexOf('uses: actions/checkout'));
      assert.ok(job.includes('SCOPE_RESULT: ${{ needs.scope.result }}'));
      assert.ok(job.includes('working-directory: ${{ github.workspace }}'));
      assert.ok(job.includes('exit 1'));
      assert.equal((job.match(/if: \$\{\{ needs.scope.outputs.mobile == 'true' \}\}/g)??[]).length,6);
    }
  }
  for (const id of ['web-release','android-release']) {
    const job = workflow.split(`\n  ${id}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0];
    assert.ok(job?.includes('if: ${{ always() }}'));
    assert.ok(job?.includes('RELEASE_NEEDS: ${{ toJSON(needs) }}'));
  }
  assert.ok(workflow.includes('needs: [scope, web]'));
  assert.ok(workflow.includes('needs: [scope, mobile]'));
  assert.ok(workflow.includes('run: npm run audit:production'));
  assert.doesNotMatch(workflow, /continue-on-error|\n    paths:/);
});

test('release gates fail closed for affected failure, skips, cancellation and invalid scope', () => {
  for (const platform of ['web','mobile']) {
    for (const result of ['failure','skipped','cancelled',undefined]) {
      assert.throws(() => evaluate(platform, {scope:{result:'success',outputs:{[platform]:'true'}},[platform]:{result}}));
    }
    assert.match(evaluate(platform, {scope:{result:'success',outputs:{[platform]:'true'}},[platform]:{result:'success'}}), /Validated/);
    assert.match(evaluate(platform, {scope:{result:'success',outputs:{[platform]:'false'}},[platform]:{result:'success'}}), /Not affected/);
    for(const result of ['failure','skipped','cancelled',undefined]) {
      assert.throws(()=>evaluate(platform,{scope:{result:'success',outputs:{[platform]:'false'}},[platform]:{result}}));
    }
    for (const result of ['failure','skipped','cancelled']) assert.throws(() => evaluate(platform,{scope:{result,outputs:{[platform]:'false'}}}));
    for (const output of [undefined,'','yes']) assert.throws(() => evaluate(platform,{scope:{result:'success',outputs:{[platform]:output}}}));
  }
});

test('actual Android scope shell guard rejects missing, failed and cancelled evidence',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/quality.yml',import.meta.url),'utf8').replaceAll('\r\n','\n');
  const guard=workflow.split('      - name: Verify Android scope evidence')[1].split('      - uses:')[0].split('        run: |\n')[1].split('\n').map(line=>line.slice(10)).join('\n');
  const shell=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';
  for(const result of ['success','failure','cancelled','skipped','']) {
    for(const affected of ['true','false','','yes']) {
      const run=spawnSync(shell,['-c',guard],{env:{...process.env,SCOPE_RESULT:result,MOBILE_AFFECTED:affected},encoding:'utf8'});
      assert.ifError(run.error);
      const valid=result==='success'&&['true','false'].includes(affected);
      assert.equal(run.status===0,valid,`${result}/${affected}: ${run.stderr}`);
    }
  }
});
