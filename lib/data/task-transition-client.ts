import type { Session } from '@supabase/supabase-js';
import {organizationFetch} from '../organizations/request';
import { TASK_WORKFLOW_WRITES_ENABLED } from '@/packages/shared-types/src/task-status-contract';
import type { TaskTransitionRequest } from '@/packages/shared-types/src/task-transition-client';
import { confirmedTaskTransition, taskTransitionError, taskTransitionRpcArgs } from '@/packages/shared-types/src/task-transition-client';

export async function transitionWebTask(session: Session, input: TaskTransitionRequest) {
  if (!TASK_WORKFLOW_WRITES_ENABLED) return {ok:false as const,code:'TASK_UPDATE_REQUIRED',message:'حدّث التطبيق؛ انتقالات المهام غير مفعلة. / Upgrade required; task transitions are not activated.'};
  try { taskTransitionRpcArgs(input); }
  catch { const safe=taskTransitionError({code:'22023'}); return {ok:false as const,code:safe.code,message:safe.message}; }
  try {
    // One request only; neither conflict nor an ambiguous response retries a write.
    const response=await organizationFetch('/api/tasks/transition',{method:'POST',headers:{
      'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,
      'x-yosseuf-organization':input.organizationId,
    },body:JSON.stringify(input)},input.organizationId,session.user.id);
    const result=await response.json();
    if (!response.ok) {
      const code=result.code==='TASK_TRANSITION_CONFLICT'?'40001':result.code==='TASK_TRANSITION_FORBIDDEN'?'42501':result.code==='TASK_TRANSITION_REJECTED'?'22023':undefined;
      const safe=taskTransitionError({code});
      return {ok:false as const,code:safe.code,message:safe.message};
    }
    const data=confirmedTaskTransition(result?.data,input);
    if (!data) {
      const safe=taskTransitionError(null);
      return {ok:false as const,code:safe.code,message:safe.message};
    }
    return {ok:true as const,data};
  } catch { return {ok:false as const,code:'TASK_TRANSITION_UNCONFIRMED',message:'لم يتأكد حفظ العملية. حدّث البيانات قبل أي محاولة أخرى.'}; }
}
