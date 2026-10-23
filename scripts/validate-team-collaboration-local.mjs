import assert from 'node:assert/strict';

// Called only from the existing verified, loopback-only project fixture.
export async function teamHttp({identity,password,sql}) {
  const base='http://127.0.0.1:35439', org='10000000-0000-0000-0000-000000000001';
  const project='40000000-0000-0000-0000-000000000001';
  const email='actor3@synthetic.invalid';
  const login=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json',apikey:'synthetic-local-anon-key'},body:JSON.stringify({email,password})});
  assert.equal(login.status,200);const teammate=await login.json();
  async function rest(path,method='GET',body,actor=identity) {
    const r=await fetch(base+'/rest/v1/'+path,{method,headers:{authorization:'Bearer '+actor.access_token,apikey:'synthetic-local-anon-key','Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
    return {status:r.status,body:await r.json()};
  }
  const rpc=(name,input,actor)=>rest('rpc/'+name,'POST',input,actor);
  const invite=await rpc('create_organization_invitation',{target_organization:org,target_email:email,target_role:'viewer'});
  assert.equal(invite.status,200,JSON.stringify(invite.body));
  const administration=await rpc('organization_administration_state',{target_organization:org});
  assert.equal(administration.status,200);assert.ok(administration.body.invitations.some(i=>i.id===invite.body.id));
  assert.equal((await rpc('create_organization_invitation',{target_organization:org,target_email:email,target_role:'viewer'})).body.id,invite.body.id);
  assert.ok((await rpc('attach_organization_invitation',{target_invitation:invite.body.id,target_user:identity.user.id})).status>=400);
  assert.equal((await rpc('attach_organization_invitation',{target_invitation:invite.body.id,target_user:teammate.user.id})).status,200);
  assert.equal((await rpc('accept_organization_invitations',{},teammate)).body,1);
  assert.equal((await rpc('accept_organization_invitations',{},teammate)).body,0);
  assert.equal(sql(`SELECT count(*) FROM activity_events WHERE action='membership_changed' AND metadata->>'event'='invitation_accepted' AND metadata->>'invitation_id'='${invite.body.id}';`),'1');
  const inbox=await rest('notifications?entity_id=eq.'+teammate.user.id);
  assert.equal(inbox.status,200);assert.equal(inbox.body.length,1);
  assert.match(inbox.body[0].title,/Team invitation accepted/);
  assert.equal(inbox.body[0].source_kind,'membership');
  assert.equal((await rpc('membership_notification_target',{p_organization_id:org,p_notification_id:inbox.body[0].id})).body.view,'administration');
  assert.equal((await rpc('membership_notification_target',{p_organization_id:org,p_notification_id:inbox.body[0].id},teammate)).status,403);
  assert.equal((await rpc('membership_notification_target',{p_organization_id:'10000000-0000-0000-0000-000000000002',p_notification_id:inbox.body[0].id})).status,403);
  sql(`BEGIN;
   UPDATE organization_memberships SET role='viewer' WHERE organization_id='${org}' AND user_id='${identity.user.id}';
   SET LOCAL ROLE authenticated;
   SELECT set_config('request.jwt.claim.sub','${identity.user.id}',true);
   DO $$ BEGIN BEGIN PERFORM public.membership_notification_target('${org}','${inbox.body[0].id}'); RAISE EXCEPTION 'Revoked admin link allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END $$;
   ROLLBACK;`);
  assert.deepEqual((await rest('notifications?entity_id=eq.'+teammate.user.id,'GET',null,teammate)).body,[]);
  const visible=await rest('projects?id=eq.'+project,'GET',null,teammate);
  assert.equal(visible.status,200);assert.equal(visible.body.length,1);
  assert.equal((await rpc('organization_administration_state',{target_organization:org},teammate)).status,403);
  assert.equal((await rpc('create_organization_invitation',{target_organization:org,target_email:'actor4@synthetic.invalid',target_role:'member'},teammate)).status,403);
  assert.ok((await rest('tasks','POST',{organization_id:org,user_id:teammate.user.id,project_id:project,title:'Forbidden viewer task',status:'To Do'},teammate)).status>=400);
  assert.equal((await rpc('change_organization_member_role',{target_organization:org,target_user:teammate.user.id,target_role:'member'})).status,200);
  const note=await rpc('create_project_note',{p_organization_id:org,p_project_id:project,p_note_id:crypto.randomUUID(),p_input:{title:'Synthetic team note',type:'general'}},teammate);
  assert.equal(note.status,200,JSON.stringify(note.body));
  const converted=await rpc('convert_project_source_to_task',{p_organization_id:org,p_project_id:project,p_source_kind:'note',p_source_id:note.body.id,p_expected_updated_at:note.body.updated_at},teammate);
  assert.equal(converted.status,200,JSON.stringify(converted.body));
  assert.equal(converted.body.user_id,teammate.user.id);assert.equal(converted.body.organization_id,org);
  const fileId=crypto.randomUUID(),path=teammate.user.id+'/'+project+'/'+fileId+'-member.txt';
  assert.equal((await rest('project_files','POST',{id:fileId,organization_id:org,user_id:teammate.user.id,project_id:project,name:'member.txt',storage_path:path,file_size:4,mime_type:'text/plain',category:'other'},teammate)).status,201);
  const storage=(endpoint,method='GET',body,actor=teammate)=>fetch(base+'/storage/v1/'+endpoint,{method,headers:{authorization:'Bearer '+actor.access_token,apikey:'synthetic-local-anon-key','Content-Type':method==='POST'&&typeof body==='string'?'application/json':'text/plain'},...(body?{body}:{})});
  assert.equal((await storage('object/project-files/'+path,'POST',Buffer.from('team'))).status,200);
  assert.equal((await storage('object/authenticated/project-files/'+path)).status,200);
  // Existing uploader-only policy is retained, including for owners of the org.
  assert.ok(!(await storage('object/authenticated/project-files/'+path,'GET',null,identity)).ok);
  const signed=await storage('object/sign/project-files/'+path,'POST',JSON.stringify({expiresIn:3}));assert.equal(signed.status,200);
  const signedUrl=base+'/storage/v1'+(await signed.json()).signedURL;
  assert.equal((await fetch(signedUrl)).status,200);
  await new Promise(resolve=>setTimeout(resolve,4500));assert.ok(!(await fetch(signedUrl)).ok);
  assert.equal((await rpc('deactivate_organization_member',{target_organization:org,target_user:teammate.user.id})).status,200);
  assert.ok(!(await storage('object/authenticated/project-files/'+path)).ok);
  assert.ok(!(await storage('object/sign/project-files/'+path,'POST',JSON.stringify({expiresIn:60}))).ok);
  assert.deepEqual((await rest('projects?id=eq.'+project,'GET',null,teammate)).body,[]);
  assert.ok((await rpc('create_project_note',{p_organization_id:org,p_project_id:project,p_note_id:crypto.randomUUID(),p_input:{title:'Revoked write',type:'general'}},teammate)).status>=400);
  // A new pending invitation can be revoked, and acceptance must not restore access.
  const pending=await rpc('create_organization_invitation',{target_organization:org,target_email:email,target_role:'viewer'});
  assert.equal(pending.status,200);
  assert.equal((await rpc('revoke_organization_invitation',{target_invitation:pending.body.id})).status,200);
  assert.equal((await rpc('accept_organization_invitations',{},teammate)).body,0);
  assert.equal(sql(`SELECT count(*) FROM organization_memberships WHERE organization_id='${org}' AND user_id='${teammate.user.id}' AND status='active';`),'0');
  const expired=await rpc('create_organization_invitation',{target_organization:org,target_email:email,target_role:'member'});
  assert.equal(expired.status,200);
  sql(`UPDATE organization_invitations SET expires_at=now()-interval '1 minute' WHERE id='${expired.body.id}';`);
  assert.equal((await rpc('accept_organization_invitations',{},teammate)).body,0);
  assert.equal(sql(`SELECT status FROM organization_invitations WHERE id='${expired.body.id}';`),'expired');
  sql(`BEGIN;
   UPDATE auth.users SET email_confirmed_at=NULL WHERE id='${teammate.user.id}';
   SET LOCAL ROLE authenticated;
   SELECT set_config('request.jwt.claim.sub','${teammate.user.id}',true);
   DO $$ BEGIN BEGIN PERFORM public.accept_organization_invitations(); RAISE EXCEPTION 'Unverified acceptance was allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END $$;
   ROLLBACK;`);
  const retry=await rpc('create_organization_invitation',{target_organization:org,target_email:email,target_role:'member'});
  assert.equal(retry.status,200);
  sql(`CREATE FUNCTION private.synthetic_team_notification_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity_id='${teammate.user.id}'::uuid THEN RAISE EXCEPTION 'Synthetic notification failure'; END IF; RETURN NEW; END $$;
   CREATE TRIGGER synthetic_team_notification_failure BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION private.synthetic_team_notification_failure();`);
  try {
    assert.ok((await rpc('accept_organization_invitations',{},teammate)).status>=400);
    assert.equal(sql(`SELECT status FROM organization_invitations WHERE id='${retry.body.id}';`),'pending');
    assert.equal(sql(`SELECT count(*) FROM activity_events WHERE action='membership_changed' AND metadata->>'event'='invitation_accepted' AND metadata->>'invitation_id'='${retry.body.id}';`),'0');
    assert.equal(sql(`SELECT count(*) FROM organization_memberships WHERE organization_id='${org}' AND user_id='${teammate.user.id}' AND status='active';`),'0');
  } finally {
    sql('DROP TRIGGER synthetic_team_notification_failure ON notifications; DROP FUNCTION private.synthetic_team_notification_failure();');
  }
  assert.equal((await rpc('accept_organization_invitations',{},teammate)).body,1);
  assert.equal((await rpc('accept_organization_invitations',{},teammate)).body,0);
  assert.equal((await rpc('deactivate_organization_member',{target_organization:org,target_user:teammate.user.id})).status,200);
  console.log('PASS team HTTP: owner invite, identity attach, idempotent acceptance, viewer read/write denial, role change, member note/task conversion, revocation with existing JWT, revoked invitation cannot restore access');
}
