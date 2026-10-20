// Synthetic local-only bridge; never accepts external upstream URLs.
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export async function startTaskFixtureGateway(){
const root=fileURLToPath(new URL('../',import.meta.url));
const containers=JSON.parse(spawnSync('docker',['inspect','basoul-pr173-auth-db','basoul-pr173-auth-clean','basoul-pr173-postgrest','basoul-pr173-http-client'],{encoding:'utf8'}).stdout);
for(const c of containers) {assert.equal(c.HostConfig.NetworkMode,'basoul-pr173-auth-network');assert.equal(c.State.Running,true);}
assert.equal(JSON.parse(spawnSync('docker',['network','inspect','basoul-pr173-auth-network'],{encoding:'utf8'}).stdout)[0].Internal,true);
const uri=new URL(containers[1].Config.Env.find(value=>value.startsWith('GOTRUE_DB_DATABASE_URL=')).slice('GOTRUE_DB_DATABASE_URL='.length));
assert.equal(uri.hostname,'basoul-pr173-auth-db');assert.equal(uri.pathname,'/basoul_pr173_auth_phase2_clean');
const password=decodeURIComponent(uri.password);
const gateway=createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:3107');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 const prefix=req.url.startsWith('/auth/v1/')?'/auth/v1':req.url.startsWith('/rest/v1/')?'/rest/v1':null;
 if(!prefix){res.writeHead(404);res.end();return;}
 const target=prefix==='/auth/v1'?'http://basoul-pr173-auth-clean:9999':'http://basoul-pr173-postgrest:3000';
 let body='';for await(const chunk of req){body+=chunk;if(body.length>1024*1024){res.writeHead(413);res.end();return;}}
 const options={method:req.method,headers:Object.fromEntries(Object.entries(req.headers).filter(([key])=>!['host','connection','content-length'].includes(key))),...(body?{body}:{})};
 const code="let s='';process.stdin.on('data',v=>s+=v);process.stdin.on('end',async()=>{try{const q=JSON.parse(s),r=await fetch(q.url,{...q.options,signal:AbortSignal.timeout(10000)});process.stdout.write(JSON.stringify({status:r.status,headers:Object.fromEntries(r.headers),body:await r.text()}));}catch{process.exitCode=1;}})";
 const child=spawn('docker',['exec','-i','basoul-pr173-http-client','node','-e',code]);let output='';child.stdout.on('data',chunk=>output+=chunk);child.on('error',()=>{res.writeHead(502);res.end();});
 child.on('close',status=>{if(res.writableEnded)return;try{if(status)throw new Error();const reply=JSON.parse(output);for(const key of ['content-type','content-range','preference-applied'])if(reply.headers[key])res.setHeader(key,reply.headers[key]);res.writeHead(reply.status);res.end(reply.body);}catch{res.writeHead(502);res.end();}});
 child.stdin.end(JSON.stringify({url:target+req.url.slice(prefix.length),options}));
});
await new Promise(resolve=>gateway.listen(35439,'127.0.0.1',resolve));

return {root,password,gateway};
}
