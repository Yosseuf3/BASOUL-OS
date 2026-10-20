import { NextRequest, NextResponse } from 'next/server';
import { authenticatedDatabase } from '@/lib/auth/authorized-workspace';
import { requestedOrganization } from '@/lib/organizations/context';
import { TASK_WORKFLOW_WRITES_ENABLED } from '@/packages/shared-types/src/task-status-contract';
import { taskTransitionError, taskTransitionRpcArgs, type TaskTransitionRequest } from '@/packages/shared-types/src/task-transition-client';

export async function POST(request: NextRequest) {
  // No production workflow activation is included in this PR.
  if (!TASK_WORKFLOW_WRITES_ENABLED) return NextResponse.json({code:'TASK_UPDATE_REQUIRED',error:'حدّث التطبيق؛ انتقالات المهام غير مفعلة. / Upgrade required; task transitions are not activated.'},{status:503});
  const organizationId=requestedOrganization(request.headers);
  if (!organizationId) return NextResponse.json({code:'TASK_TRANSITION_REJECTED',error:'Organization context required'},{status:400});
  const token=request.headers.get('authorization') ?? '';
  let auth: Awaited<ReturnType<typeof authenticatedDatabase>>;
  try { auth=await authenticatedDatabase(token.startsWith('Bearer ')?token.slice(7).trim():'',organizationId); }
  catch { return NextResponse.json({code:'TASK_TRANSITION_UNCONFIRMED',error:'Authentication verification unavailable'},{status:503}); }
  if (!auth) return NextResponse.json({code:'AUTH_REQUIRED',error:'Unauthorized'},{status:401});
  let args: ReturnType<typeof taskTransitionRpcArgs>;
  try {
    const body=await request.json() as TaskTransitionRequest;
    if (body.organizationId!==auth.organizationId) return NextResponse.json({code:'TASK_TRANSITION_FORBIDDEN',error:'Organization mismatch'},{status:403});
    // Tenant is resolved from authenticated membership, not the request body.
    args=taskTransitionRpcArgs({...body,organizationId:auth.organizationId});
  } catch {
    return NextResponse.json({code:'TASK_TRANSITION_REJECTED',error:'Invalid transition request'},{status:400});
  }
  try {
    const {data,error}=await auth.database.rpc('transition_task_status',args);
    if (error) { const safe=taskTransitionError(error); return NextResponse.json({code:safe.code,error:safe.message},{status:safe.status}); }
    return NextResponse.json({data});
  } catch {
    const safe=taskTransitionError(null);
    return NextResponse.json({code:safe.code,error:safe.message},{status:safe.status});
  }
}
