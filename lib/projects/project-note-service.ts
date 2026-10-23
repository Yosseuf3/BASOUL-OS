import {conversionArguments,confirmedConversion,conversionFailure} from '../../packages/shared-types/src/project-conversion';
import {requireOrganizationLease} from '../organizations/active-context';
import {organizationClient} from '../organizations/scoped-client';


export type ProjectNoteType = "decision" | "meeting" | "review" | "general";
export type ProjectNoteStatus = "open" | "done" | "archived";

export type ProjectNote = {
  id: string;
  organization_id: string;
  task_id?: string | null;
  user_id: string;
  project_id: string;
  project_file_id: string | null;
  type: ProjectNoteType;
  title: string;
  content: string | null;
  status: ProjectNoteStatus;
  assigned_to: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectNoteInput = Pick<ProjectNote, "project_id" | "project_file_id" | "type" | "title" | "content" | "assigned_to" | "follow_up_date">;


export async function listProjectNotes(projectId: string): Promise<ProjectNote[]> {
  const supabase=organizationClient();
  const { data, error } = await supabase.from("project_notes").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectNote[];
}

export async function createProjectNote(input:ProjectNoteInput,id:string=crypto.randomUUID()):Promise<ProjectNote> {
 const lease=requireOrganizationLease();const client=organizationClient();
 const {project_id,...fields}=input;
 const {data,error}=await client.rpc('create_project_note',{p_organization_id:lease.organizationId,p_project_id:project_id,p_note_id:id,p_input:fields});
 if(error)throw conversionFailure(error);
 const row=Array.isArray(data)?data[0]:data;
 if(!row||row.id!==id||row.user_id!==lease.userId||row.organization_id!==lease.organizationId||row.project_id!==project_id)throw new Error('لم يتأكد حفظ الملاحظة؛ أعد نفس المحاولة. / Note save unconfirmed; retry the same draft.');
 return row as ProjectNote;
}

export async function setProjectNoteStatus(note: ProjectNote, status: ProjectNoteStatus): Promise<void> {
  const supabase=organizationClient();
  const { error } = await supabase.from("project_notes").update({ status }).eq("id", note.id);
  if (error) throw error;
}

export async function deleteProjectNote(note: ProjectNote): Promise<void> {
  const supabase=organizationClient();
  const { error } = await supabase.from("project_notes").delete().eq("id", note.id);
  if (error) throw error;
}

export async function convertProjectNoteToTask(note: ProjectNote): Promise<string> {
  const lease=requireOrganizationLease(note.organization_id);
  const supabase=organizationClient(lease.organizationId);
  const input={userId:lease.userId,organizationId:lease.organizationId,projectId:note.project_id,sourceKind:'note' as const,sourceId:note.id,updatedAt:note.updated_at};
  const {data,error}=await supabase.rpc('convert_project_source_to_task',conversionArguments(input));
  if(error)throw conversionFailure(error);
  return confirmedConversion(data,input);
}
