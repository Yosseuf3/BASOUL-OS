import type { Session } from '@supabase/supabase-js';
import { TASK_WORKFLOW_WRITES_ENABLED } from '@/packages/shared-types/src/task-status-contract';
import type { TaskTransitionRequest } from '@/packages/shared-types/src/task-transition-client';
import { taskTransitionError, taskTransitionRpcArgs } from '@/packages/shared-types/src/task-transition-client';

export async function transitionWebTask(session: Session, input: TaskTransitionRequest) {
  if (!TASK_WORKFLOW_WRITES_ENABLED) return {ok:false as const,code:'TASK_UPDATE_REQUIRED',message:'انتقالات المهام غير مفعلة بعد.'};
  try {
    taskTransitionRpcArgs(input);
    // One request only; neither conflict nor an ambiguous response retries a write.
    const response=await fetch('/api/tasks/transition',{method:'POST',headers:{
      'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,
      'x-yosseuf-organization':input.organizationId,
    },body:JSON.stringify(input)});
    const result=await response.json();
    if (!response.ok) {
      const code=result.code==='TASK_TRANSITION_CONFLICT'?'40001':result.code==='TASK_TRANSITION_FORBIDDEN'?'42501':result.code==='TASK_TRANSITION_REJECTED'?'22023':undefined;
      const safe=taskTransitionError({code});
      return {ok:false as const,code:safe.code,message:safe.message};
    }
    return {ok:true as const,data:result.data};
  } catch { return {ok:false as const,code:'TASK_TRANSITION_UNCONFIRMED',message:'لم يتأكد حفظ العملية. حدّث البيانات قبل أي محاولة أخرى.'}; }
}
