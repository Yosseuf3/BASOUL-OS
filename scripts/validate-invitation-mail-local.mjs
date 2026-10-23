import {spawnSync} from 'node:child_process';
import {createHmac} from 'node:crypto';
import assert from 'node:assert/strict';

// Synthetic SMTP capture inside the already verified internal-only fixture.
// No recipient outside synthetic.invalid is accepted; no external provider.
export async function invitationMailHttp(identity){
 const docker=(args,input)=>{const r=spawnSync('docker',args,{input,encoding:'utf8',timeout:30000});assert.equal(r.status,0,'Local mail fixture command failed');return r.stdout;};
 const auth=JSON.parse(docker(['inspect','basoul-pr173-auth-clean']))[0];
 assert.equal(auth.State.Running,true);assert.equal(auth.HostConfig.NetworkMode,'basoul-pr173-auth-network');
 assert.equal(JSON.parse(docker(['network','inspect','basoul-pr173-auth-network']))[0].Internal,true);
 const env=Object.fromEntries(auth.Config.Env.map(v=>[v.slice(0,v.indexOf('=')),v.slice(v.indexOf('=')+1)]));
 assert.ok(env.GOTRUE_JWT_SECRET);assert.ok(env.GOTRUE_DB_DATABASE_URL.includes('basoul_pr173_auth_phase2_clean'));
 const smtp=`const net=require('net'),fs=require('fs');fs.writeFileSync('/tmp/basoul-inbox.json','[]');net.createServer(s=>{s.setEncoding('utf8');s.write('220 synthetic SMTP\\r\\n');let b='',data=false,lines=[];s.on('data',v=>{b+=v;while(b.includes('\\r\\n')){const i=b.indexOf('\\r\\n'),l=b.slice(0,i);b=b.slice(i+2);if(data){if(l==='.') {const a=JSON.parse(fs.readFileSync('/tmp/basoul-inbox.json'));a.push(lines.join('\\r\\n'));fs.writeFileSync('/tmp/basoul-inbox.json',JSON.stringify(a));lines=[];data=false;s.write('250 captured\\r\\n');}else lines.push(l);}else if(/^EHLO|^HELO/i.test(l))s.write('250 synthetic\\r\\n');else if(/^RCPT/i.test(l))s.write(fs.existsSync('/tmp/basoul-mail-fail')?'450 synthetic delivery failure\\r\\n':/@synthetic[.]invalid[> ]?$/i.test(l)?'250 recipient accepted\\r\\n':'550 external recipient forbidden\\r\\n');else if(/^DATA/i.test(l)){data=true;s.write('354 send data\\r\\n');}else if(/^QUIT/i.test(l)){s.end('221 goodbye\\r\\n');}else s.write('250 ok\\r\\n');}});}).listen(2525,'0.0.0.0');`;
 docker(['exec','-d','basoul-pr173-http-client','node','-e',smtp]);
 docker(['exec','-d','-e','GOTRUE_API_PORT=9998','-e','API_EXTERNAL_URL=http://basoul-pr173-auth-clean:9998','-e','GOTRUE_SMTP_HOST=basoul-pr173-http-client','-e','GOTRUE_SMTP_PORT=2525','-e','GOTRUE_SMTP_ADMIN_EMAIL=owner@synthetic.invalid','-e','GOTRUE_SMTP_SENDER_NAME=BASOUL Synthetic','-e','GOTRUE_SMTP_MAX_FREQUENCY=1s','-e','GOTRUE_MAILER_AUTOCONFIRM=false','basoul-pr173-auth-clean','sh','-c','auth >/tmp/basoul-mail-auth.log 2>&1']);
 const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const head=encode({alg:'HS256',typ:'JWT'}),payload=encode({role:'service_role',iss:'supabase',exp:Math.floor(Date.now()/1000)+120});
 const token=head+'.'+payload+'.'+createHmac('sha256',env.GOTRUE_JWT_SECRET).update(head+'.'+payload).digest('base64url');
 function request(path,body){const code=`let s='';process.stdin.on('data',v=>s+=v);process.stdin.on('end',async()=>{try{const q=JSON.parse(s),r=await fetch('http://basoul-pr173-auth-clean:9998'+q.path,{method:q.body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+q.token},...(q.body?{body:JSON.stringify(q.body)}:{}),redirect:'manual',signal:AbortSignal.timeout(10000)});process.stdout.write(JSON.stringify({status:r.status,location:r.headers.get('location'),body:await r.text()}));}catch{process.stdout.write(JSON.stringify({status:0}));}});`;return JSON.parse(docker(['exec','-i','basoul-pr173-http-client','node','-e',code],JSON.stringify({path,body,token})));}
 const org='10000000-0000-0000-0000-000000000001';
 async function rpc(name,body,access=identity?.access_token){const r=await fetch('http://127.0.0.1:35439/rest/v1/rpc/'+name,{method:'POST',headers:{authorization:'Bearer '+access,apikey:'synthetic-local-anon-key','Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,'Synthetic invitation RPC failed');return r.json();}
 const args={target_organization:org,target_email:'smtp-invite@synthetic.invalid',target_role:'member'};
 const invitation=identity?await rpc('create_organization_invitation',args):null;
 let ready=false;for(let i=0;i<20;i++){if(request('/health').status===200){ready=true;break;}await new Promise(r=>setTimeout(r,500));}assert.ok(ready,'Isolated SMTP Auth did not start');
 docker(['exec','basoul-pr173-http-client','node','-e',"require('fs').writeFileSync('/tmp/basoul-mail-fail','1')"]);
 assert.ok(request('/invite',{email:'smtp-invite@synthetic.invalid'}).status>=400,'SMTP failure must not report delivery');
 docker(['exec','basoul-pr173-http-client','node','-e',"require('fs').unlinkSync('/tmp/basoul-mail-fail')"]);
 await new Promise(r=>setTimeout(r,1500));
 const sent=request('/invite',{email:'smtp-invite@synthetic.invalid'});assert.ok(sent.status===200||sent.status===201,'SMTP retry was not delivered');
 if(invitation){assert.equal((await rpc('create_organization_invitation',args)).id,invitation.id);await rpc('attach_organization_invitation',{target_invitation:invitation.id,target_user:JSON.parse(sent.body).id});}
 const inbox=JSON.parse(docker(['exec','basoul-pr173-http-client','node','-e',"process.stdout.write(require('fs').readFileSync('/tmp/basoul-inbox.json'))"]));
 assert.equal(inbox.length,1);assert.match(inbox[0],/smtp-invite@synthetic.invalid/);
 const decoded=inbox[0].replaceAll('=\r\n','').replaceAll('=3D','=').replaceAll('&amp;','&');
 const url=decoded.match(/http:\/\/basoul-pr173-auth-clean:9998\/[^\s"<>]+/);assert.ok(url,'Captured invitation verification link missing');
 const accepted=request(url[0].slice('http://basoul-pr173-auth-clean:9998'.length));assert.equal(accepted.status,303);
 if(invitation){const session=new URLSearchParams(new URL(accepted.location).hash.slice(1));const access=session.get('access_token');assert.ok(access);assert.equal(await rpc('accept_organization_invitations',{},access),1);assert.equal(await rpc('accept_organization_invitations',{},access),0);}
 assert.ok(request('/invite',{email:'smtp-invite@synthetic.invalid'}).status>=400,'Confirmed user must not receive a duplicate invitation');
 console.log('PASS actual isolated GoTrue SMTP: rejected delivery, explicit retry, one captured email, verification link acceptance and confirmed-user duplicate rejection; no external mail');
 // The wrapper stops both dedicated containers, including these child processes.
}
