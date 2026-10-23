// Optional Android development-client check; no APK build or production access.
import {spawn,spawnSync} from 'node:child_process';
import {createWriteStream,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {startTaskFixtureGateway} from './task-fixture-gateway.mjs';
const device='emulator-5556';
const teamMode=process.env.BASOUL_NATIVE_TEAM==='1';
const useGo=process.env.BASOUL_NATIVE_EXPO_GO==='1';
const appPackage=useGo?'host.exp.exponent':'com.yosseufradwan.os';
function adb(args,options={}) {const r=spawnSync('adb',['-s',device,...args],{encoding:'utf8',timeout:20000,...options});if(r.status!==0)throw new Error('Isolated Android command failed: '+args.slice(0,2).join(' '));return r.stdout;}
assert.equal(adb(['get-state']).trim(),'device');
assert.equal(adb(['emu','avd','name']).split(/\r?\n/)[0].trim(),'BASOUL_Local_API35','Use the dedicated project-local AVD; preserve unrelated emulators');
assert.equal(adb(['shell','getprop','ro.build.version.sdk']).trim(),'35');
let booted=false;for(let i=0;i<120;i++){if(adb(['shell','getprop','sys.boot_completed']).trim()==='1'){booted=true;break;}await new Promise(resolve=>setTimeout(resolve,1000));}
assert.ok(booted,'Dedicated Android emulator did not complete boot');
const {root,password,gateway}=await startTaskFixtureGateway();
assert.match(password,/^[A-Za-z0-9_-]+$/); // synthetic input only; no shell metacharacters
const log=createWriteStream(root+'.git/basoul-local/mobile-metro.log');
const metro=spawn(process.execPath,[root+'mobile/node_modules/expo/bin/cli','start',useGo?'--go':'--dev-client','--localhost','--max-workers','1','--port','8083'],{
 cwd:root+'mobile',env:{...process.env,NODE_OPTIONS:((process.env.NODE_OPTIONS??'')+' --dns-result-order=ipv4first --max-old-space-size=768').trim(),CI:'1',EXPO_PUBLIC_BASOUL_LOCAL_SESSION_RUN:teamMode?String(Date.now()):'',EXPO_PUBLIC_BASOUL_LOCAL_WORKFLOW:teamMode?'0':'1',EXPO_PUBLIC_SUPABASE_URL:'http://127.0.0.1:35439',EXPO_PUBLIC_SUPABASE_ANON_KEY:'synthetic-local-anon-key'},stdio:['ignore','pipe','pipe']});
metro.stdout.pipe(log);metro.stderr.pipe(log);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function tree(){adb(['shell','uiautomator','dump','/sdcard/basoul-local-ui.xml']);const xml=adb(['shell','cat','/sdcard/basoul-local-ui.xml']);writeFileSync(root+'.git/basoul-local/native-last-ui.xml',xml.replaceAll(password,'[synthetic-redacted]'));return xml;}
function find(xml,label){xml=xml.replace(/<node\b[^>]*\senabled="false"[^>]*>/g,"");for(const node of xml.matchAll(/<node\b[^>]+>/g)){if(['text','content-desc','resource-id','hint'].some(key=>node[0].includes(`${key}="${label}"`))){const b=node[0].match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);if(b && +b[3]>+b[1] && +b[4]>+b[2])return [(+b[1]+ +b[3])/2,(+b[2]+ +b[4])/2];}}return null;}
async function tap(label){stage("finding native control: "+label);for(let i=0;i<32;i++){const xml=tree();const warning=xml.match(/content-desc="(!, SafeAreaView[^"]*)"/);const warningPos=warning&&find(xml,warning[1]);if(warningPos){adb(["shell","input","tap",String(Math.round(warningPos[0])),String(Math.round(warningPos[1]))]);await pause(500);continue;}const dismiss=find(xml,"Dismiss");if(dismiss){adb(["shell","input","tap",String(Math.round(dismiss[0])),String(Math.round(dismiss[1]))]);await pause(500);continue;}const actionable=xml.replace(/<node\b[^>]*\sclickable="false"[^>]*>/g,""),pos=find(actionable,label);if(pos){adb(['shell','input','tap',String(Math.round(pos[0])),String(Math.round(pos[1]))]);await pause(500);return;}if(i%3===2){const scrolls=[...xml.matchAll(/<node\b[^>]*scrollable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)],bounds=scrolls.at(-1);if(bounds){const x=Math.round((+bounds[1]+ +bounds[3])/2),top=+bounds[2],height=+bounds[4]-top,down=i%12===11;adb(['shell','input','swipe',String(x),String(Math.round(top+height*(down?.2:.85))),String(x),String(Math.round(top+height*(down?.85:.2))),'300']);}}await pause(1000);}throw new Error('Native UI element unavailable: '+label);}
function fixtureSql(input){const r=spawnSync('docker',['exec','-i','basoul-pr173-auth-db','psql','-X','-U','supabase_admin','-d','basoul_pr173_auth_phase2_clean','-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});assert.equal(r.status,0,'Synthetic native SQL assertion failed');return r.stdout.trim();}
async function waitSql(query,expected){for(let i=0;i<45;i++){if(fixtureSql(query)===expected)return;await pause(1000);}throw new Error('Native committed-state confirmation timed out');}
function stage(value){writeFileSync(root+'.git/basoul-local/native-stage.txt',value);console.log('NATIVE '+value);}
function hideKeyboard(){if(/(?:mInputShown|mIsInputViewShown|isInputViewShown)=true/.test(adb(['shell','dumpsys','input_method'])))adb(['shell','input','keyevent','4']);}
async function fill(label,value){await tap(label);adb(['shell','input','keycombination','113','29']);adb(['shell','input','keyevent','67']);await pause(500);adb(['shell','input','text',value]);await pause(150);hideKeyboard();}
try {
 // No Wi-Fi/mobile path to production; adb reverse serves loopback-only fixtures.
 adb(['shell','svc','wifi','disable']);adb(['shell','svc','data','disable']);
 adb(['shell','settings','put','secure','show_ime_with_hard_keyboard','1']);
 adb(['reverse','tcp:35439','tcp:35439']);adb(['reverse','tcp:8083','tcp:8083']);
 let ready=false;for(let i=0;i<90;i++){assert.equal(metro.exitCode,null,'Metro exited before readiness; see mobile-metro.log');try{if((await fetch('http://127.0.0.1:8083/status',{signal:AbortSignal.timeout(2000)})).ok){ready=true;break;}}catch{}await pause(1000);}
 assert.ok(ready,'Local Metro not ready');
 adb(['shell','am','start','-W','-a','android.intent.action.VIEW','-d',useGo?'exp://127.0.0.1:8083':'exp+yosseuf-os://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8083',appPackage]);
 stage('waiting for verified synthetic bundle');
 let localBundle=false;for(let i=0;i<60;i++){try{const xml=tree();if(xml.includes('basoul-synthetic-login')){localBundle=true;break;}for(const label of ['Continue','Continue anonymously','Open project','Got it','Close','Dismiss']){const pos=find(xml,label);if(pos)adb(['shell','input','tap',String(Math.round(pos[0])),String(Math.round(pos[1]))]);}}catch{/* boot/UI capture may not yet be available; credentials remain gated */}await pause(1000);}
 assert.ok(localBundle,useGo?'Expo Go did not load the verified synthetic bundle; native UI/runtime coverage remains blocked':'Installed Android binary did not load the synthetic development bundle; a compatible development client is required');
 await tap('name@example.com');adb(['shell','input','text','actor1@synthetic.invalid']);hideKeyboard();await pause(500);
 await tap('••••••••');adb(['shell','input','text',password]);hideKeyboard();await pause(500);
 await tap('تسجيل الدخول');
 stage('authenticated; opening native task creation');
 await tap('+ مهمة');await fill('مثال: مراجعة مخططات الواجهة','Native_verified_task');await tap('إنشاء المهمة');
 await waitSql("SELECT count(*) FROM tasks WHERE title='Native_verified_task';",'1');
 const task=fixtureSql("SELECT id FROM tasks WHERE title='Native_verified_task';");assert.match(task,/^[0-9a-f-]{36}$/);
 for(const target of (teamMode?[]:['In Progress','Waiting','In Progress','Review','In Progress','Review','Done'])){
  stage('native transition to '+target);await tap(`task-transition-${task}-${target.replaceAll(' ','-')}`);
  await fill('السبب (اختياري) / Reason (optional)','native_transition_reason');await tap('تأكيد / Confirm');
  await waitSql(`SELECT status::text FROM tasks WHERE id='${task}';`,target);
 }
 assert.equal(fixtureSql(`SELECT count(*) FROM activity_events WHERE entity_id='${task}' AND metadata->>'reason'='native_transition_reason';`),teamMode?'0':'7');
 assert.equal(fixtureSql(`SELECT count(*) FROM notifications n JOIN activity_events e ON e.id=n.activity_event_id WHERE e.entity_id='${task}' AND e.metadata->>'_basoul_task_transition'='true';`),'0');
 stage(teamMode?'native To Do creation confirmed; editing fields':'native transitions confirmed; editing Done task fields');await tap('الكل');await tap('task-details-'+task);
 await fill('عنوان المهمة / Task title','Native_verified_task_edited');await fill('التقدم / Progress','42');await tap('حفظ البيانات / Save fields');
 await waitSql(`SELECT title||'|'||progress::text||'|'||status::text FROM tasks WHERE id='${task}';`,teamMode?'Native_verified_task_edited|42|To Do':'Native_verified_task_edited|42|Done');
 await tap('الكل');await tap('task-details-'+task);await tap('أرشفة مع حفظ السجل / Archive and preserve history');
 await waitSql(`SELECT archived::text FROM tasks WHERE id='${task}';`,'true');
 assert.equal(fixtureSql(`SELECT count(*) FROM activity_events WHERE entity_id='${task}' AND metadata->>'new_archived'='true';`),'1');
 if(teamMode){
fixtureSql(`INSERT INTO organization_memberships(organization_id,user_id,role,status) SELECT '10000000-0000-0000-0000-000000000002',id,'viewer','active' FROM auth.users WHERE email='actor1@synthetic.invalid';`);
await tap('تحديث المؤسسة');await tap('Synthetic B · viewer');await tap('المشاريع');assert.ok(tree().includes('Synthetic project B'));assert.ok(!tree().includes('Native_verified_task_edited'));
fixtureSql(`UPDATE organization_memberships SET status='suspended' WHERE organization_id='10000000-0000-0000-0000-000000000002' AND user_id=(SELECT id FROM auth.users WHERE email='actor1@synthetic.invalid');`);
await tap('تحديث المؤسسة');assert.ok(!tree().includes('Synthetic project B'));assert.equal(fixtureSql('SELECT count(*) FROM private.task_workflow_activation WHERE enabled;'),'0');
}
 stage(teamMode?'native create/edit/archive/org switching/revocation verified':'native create/all six edges/reasons/edit/archive/history/no-self notifications verified');
 const shot=spawnSync('adb',['-s',device,'exec-out','screencap','-p']);if(shot.status===0)writeFileSync(root+'.git/basoul-local/native-task-screen.png',shot.stdout);
 console.log(teamMode?'PASS actual native authentication/create/edit/archive/organization switching/project access/membership revocation; workflow OFF':'PASS actual native synthetic authentication/list/create/all six transition edges/reasons/field edit/archive/audit retention/no-self notifications; external radios disabled');
} finally {
 try{adb(['shell','am','force-stop',appPackage]);adb(['reverse','--remove','tcp:35439']);adb(['reverse','--remove','tcp:8083']);}catch{/* retain diagnostic failure */}
 if(metro.pid)spawnSync('taskkill',['/PID',String(metro.pid),'/T','/F'],{stdio:'ignore'});
 gateway.closeAllConnections();await new Promise(resolve=>gateway.close(resolve));log.end();
}
