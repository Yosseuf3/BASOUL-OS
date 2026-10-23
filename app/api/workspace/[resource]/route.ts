import { NextRequest, NextResponse } from "next/server";
import { authenticatedDatabase, isAuthorizedResource, trustedIdentityPayload } from "@/lib/auth/authorized-workspace";
import { requestedOrganization } from "@/lib/organizations/context";
import { assertCompatibilityTaskWrite, TASK_WORKFLOW_WRITES_ENABLED } from "@/packages/shared-types/src/task-status-contract";
import { taskEditExpectation, TASK_EDIT_CONFLICT, TASK_CLIENT_UPDATE_REQUIRED } from '@/packages/shared-types/src/task-edit-contract';

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function validReferences(database: Awaited<ReturnType<typeof authenticatedDatabase>>,body:Record<string,unknown>) {
  if(!database)return false;
  for(const [field,table] of Object.entries({project_id:'projects',client_id:'clients'})) {
    const id=body[field];if(id===undefined||id===null||id==='')continue;
    if(typeof id!=='string')return false;
    const result=await database.database.from(table).select('id').eq('id',id).eq('organization_id',database.organizationId).single();
    if(result.error||!result.data)return false;
  }
  return true;
}

async function context(request: NextRequest, resource: string) {
  if (!isAuthorizedResource(resource)) return { ok: false as const, response: NextResponse.json({ error: "Unknown resource" }, { status: 404 }) };
  const auth = await authenticatedDatabase(bearer(request), requestedOrganization(request.headers));
  if (!auth) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true as const, auth, resource };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if (!resolved.ok) return resolved.response;
  let query=resolved.auth.database.from(resolved.resource).select("*").eq("organization_id", resolved.auth.organizationId);
  if(resource==='notifications') query=query.eq('user_id',resolved.auth.user.id);
  const result = await query.order(resource==='notifications'||resource==='activity_events'?'created_at':'updated_at', { ascending: false });
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if (!resolved.ok) return resolved.response;
  const body = await request.json() as Record<string, unknown>;
  if(resource==='tasks'&&request.headers.get('x-basoul-task-create-contract')!=='atomic-source-v1')
    return NextResponse.json({code:'TASK_UPDATE_REQUIRED',error:'حدّث التطبيق لإنشاء المهام بأمان. / Upgrade required for safe task creation.'},{status:409});
  if(!await validReferences(resolved.auth,body))return NextResponse.json({error:'السجل المرتبط غير متاح في المؤسسة. / Linked record is unavailable in this organization.'},{status:403});
  const payload: Record<string,unknown> = trustedIdentityPayload(body, resolved.auth.user.id, resolved.auth.organizationId);
  delete payload.expectedUpdatedAt;
  delete payload.updated_at;
  if (resource === "tasks") {
    if(TASK_WORKFLOW_WRITES_ENABLED && body.status!==undefined && body.status!=='To Do')
      return NextResponse.json({error:'New tasks must start in To Do'},{status:400});
    if(body.project_id) {
      const project=await resolved.auth.database.from('projects').select('id').eq('id',body.project_id).eq('organization_id',resolved.auth.organizationId).single();
      if(project.error || !project.data) return NextResponse.json({error:'Task project unavailable'},{status:403});
    }
    try { assertCompatibilityTaskWrite("status" in body ? body.status : "To Do"); }
    catch { return NextResponse.json({ error: "Task status writes are not activated for this value" }, { status: 400 }); }
  }
  const result = await resolved.auth.database.from(resolved.resource).insert(payload).select("*").single();
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const resolved = await context(request, resource);
  if (!resolved.ok) return resolved.response;
  const body = await request.json() as Record<string, unknown>;
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing row id" }, { status: 400 });
  if(!await validReferences(resolved.auth,body))return NextResponse.json({error:'السجل المرتبط غير متاح في المؤسسة. / Linked record is unavailable in this organization.'},{status:403});
  const payload: Record<string,unknown> = trustedIdentityPayload(body, resolved.auth.user.id, resolved.auth.organizationId);
  delete payload.expectedUpdatedAt;
  delete payload.updated_at;
  const expected = resource === 'tasks' ? taskEditExpectation(body) : null;
  if (resource === 'tasks' && !expected) return NextResponse.json(TASK_CLIENT_UPDATE_REQUIRED, {status:409});
  let changesStatus=false;
  if(resource==='tasks' && Object.keys(payload).some(key=>!['user_id','organization_id','title','description','project_id','priority','progress','due_date','status','archived'].includes(key))) {
    return NextResponse.json({error:'Unsupported task edit fields'},{status:400});
  }
  if (resource === "tasks" && "status" in body) {
    const previous = await resolved.auth.database.from("tasks").select("status")
      .eq("id", body.id).eq("organization_id", resolved.auth.organizationId).eq("user_id", resolved.auth.user.id).single();
    if (previous.error) return NextResponse.json({ error: "Task unavailable" }, { status: 403 });
    changesStatus=body.status!==previous.data.status;
    if (body.status!==previous.data.status) {
      return NextResponse.json({code:'TASK_UPDATE_REQUIRED',error:'Use the expected-state task transition protocol'},{status:409});
    }
    try { assertCompatibilityTaskWrite(body.status, previous.data.status); }
    catch { return NextResponse.json({ error: "Task status writes are not activated for this value" }, { status: 400 }); }
  }
  if (resource==='tasks' && !changesStatus) {
    const changes={...payload}; delete changes.user_id; delete changes.organization_id; delete changes.status;
    const result=await resolved.auth.database.rpc('edit_task_fields',{p_task_id:body.id,p_organization_id:resolved.auth.organizationId,p_expected_updated_at:expected,p_changes:changes});
    if(result.error?.code==='PT409') return NextResponse.json(TASK_EDIT_CONFLICT,{status:409});
    // Missing/legacy contracts fail closed. Never retry through a direct writer.
    if(result.error?.code==='PGRST202') return NextResponse.json(TASK_CLIENT_UPDATE_REQUIRED,{status:409});
    return NextResponse.json(result.error?{error:'تعذر التعديل. / Task edit rejected.'}:{data:result.data,auditRecorded:true},{status:result.error?403:200});
  }
  let query = resolved.auth.database.from(resolved.resource).update(payload).eq("id", body.id).eq("organization_id", resolved.auth.organizationId);
  if(resource==='notifications') query=query.eq('user_id',resolved.auth.user.id);
  if (resource === 'tasks') query = query.eq('user_id',resolved.auth.user.id).eq('updated_at',expected!);
  const result = await query.select("*").maybeSingle();
  if (resource === 'tasks' && !result.error && !result.data) return NextResponse.json(TASK_EDIT_CONFLICT,{status:409});
  if(resource==='tasks' && result.error) return NextResponse.json({error:'تعذر تعديل المهمة. / Task edit rejected.'},{status:403});
  if(!result.error&&!result.data)return NextResponse.json({code:'ORGANIZATION_RECORD_UNAVAILABLE',error:'السجل غير متاح في المؤسسة الحالية. / Record unavailable in the current organization.'},{status:404});
  return NextResponse.json(result.error ? { error: result.error.message } : { data: result.data }, { status: result.error ? 403 : 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if(resource==='tasks') return NextResponse.json({code:'TASK_ARCHIVE_REQUIRED',error:'السجل محفوظ؛ حدّث التطبيق واستخدم الأرشفة. / History preserved; upgrade and archive the task.'},{status:409});
  const resolved = await context(request, resource);
  if (!resolved.ok) return resolved.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing row id" }, { status: 400 });
  if(resource==='projects') {
    for(const table of ['tasks','project_files','project_notes','architectural_drawings','finance_transactions','activity_events']) {
      const column=table==='activity_events'?'entity_id':'project_id';
      const related=await resolved.auth.database.from(table).select('id').eq('organization_id',resolved.auth.organizationId).eq(column,id).limit(1);
      if(related.error||related.data?.length)return NextResponse.json({code:'PROJECT_HISTORY_PRESERVED',error:'المشروع محفوظ لوجود سجلات مرتبطة. / Project retained because related records exist.'},{status:409});
    }
  }
  let query=resolved.auth.database.from(resolved.resource).delete().eq("id", id).eq("organization_id", resolved.auth.organizationId);
  if(resource==='notifications') query=query.eq('user_id',resolved.auth.user.id);
  const result = await query.select('id');
  if(!result.error&&!result.data?.length)return NextResponse.json({code:'ORGANIZATION_RECORD_UNAVAILABLE',error:'السجل غير متاح في المؤسسة الحالية. / Record unavailable in the current organization.'},{status:404});
  return NextResponse.json(result.error ? { error: result.error.message } : { data: null }, { status: result.error ? 403 : 200 });
}
