import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const source=readFileSync(new URL('../packages/shared-types/src/task-status-contract.ts',import.meta.url),'utf8');
function enabled(env){const exports={};runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,process:{env}});return exports.TASK_WORKFLOW_WRITES_ENABLED;}
test('local activation cannot enable a production build or remote endpoint',()=>{
 assert.equal(enabled({}),false);
 const local={NODE_ENV:'development',NEXT_PUBLIC_BASOUL_LOCAL_WORKFLOW:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:35439'};
 assert.equal(enabled(local),true);
 assert.equal(enabled({...local,NODE_ENV:'production'}),false);
 assert.equal(enabled({...local,NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co'}),false);
 assert.equal(enabled({...local,NEXT_PUBLIC_BASOUL_LOCAL_WORKFLOW:'0'}),false);
});
