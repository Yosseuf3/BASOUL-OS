import { supabase } from '../config/supabase';
import type { Task } from '../types/domain';
import type { OrganizationContext } from '../organizations/context';
import { validateOrganizationContext } from './organizations';

export type TaskFieldEdit = {title:string;progress:number;due_date:string|null};
export async function editMobileTask(context:OrganizationContext,task:Task,input:TaskFieldEdit) {
  if(!supabase) throw new Error('Supabase is not configured.');
  if(!input.title.trim() || input.title.trim().length>160 || !Number.isInteger(input.progress) || input.progress<0 || input.progress>100
    || (input.due_date!==null && !/^\d{4}-\d{2}-\d{2}$/.test(input.due_date))) throw {code:'22023'};
  await validateOrganizationContext(context,'update');
  if(!task.updated_at) throw {code:'PT409'};
  const changes={...input,title:input.title.trim()};
  const result=await supabase.rpc('edit_task_fields',{p_task_id:task.id,p_organization_id:context.organizationId,p_expected_updated_at:task.updated_at,p_changes:changes});
  if(result.error?.code==='PGRST202') throw {code:'TASK_UPDATE_REQUIRED'};
  if(result.error?.code==='PGRST116' || (!result.error && !result.data)) throw {code:'PT409'};
  if(result.error) throw result.error;
  if(result.data.id!==task.id || result.data.organization_id!==context.organizationId || result.data.status!==task.status
    || typeof result.data.updated_at!=='string' || result.data.updated_at===task.updated_at
    || result.data.title!==changes.title || result.data.progress!==changes.progress) throw {code:'TASK_TRANSITION_UNCONFIRMED'};
}

export async function archiveMobileTask(context:OrganizationContext,task:Task) {
  if(!supabase) throw {code:'TASK_UPDATE_REQUIRED'};
  await validateOrganizationContext(context,'update');
  if(!task.updated_at) throw {code:'PT409'};
  const {data,error}=await supabase.rpc('edit_task_fields',{p_task_id:task.id,p_organization_id:context.organizationId,p_expected_updated_at:task.updated_at,p_changes:{archived:true}});
  if(error?.code==='PGRST202') throw {code:'TASK_UPDATE_REQUIRED'};
  if(error) throw error;
  if(data?.id!==task.id || data.organization_id!==context.organizationId || data.archived!==true || !data.updated_at || data.updated_at===task.updated_at) throw {code:'TASK_TRANSITION_UNCONFIRMED'};
}
