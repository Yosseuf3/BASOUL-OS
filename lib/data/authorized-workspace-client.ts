import type { Session } from "@supabase/supabase-js";
import type { AuthorizedResource } from "@/lib/auth/authorized-workspace";
import {selectedOrganization} from '@/lib/organizations/workspace-selection';

export async function authorizedWorkspaceWrite(resource: AuthorizedResource, session: Session, input: object, id?: string, taskRevision?: { updatedAt: string; organizationId: string; onAuditRecorded?: () => void }) {
  try {
  const response = await fetch(`/api/workspace/${resource}`, {
    method: id ? "PATCH" : "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}`,
      ...((taskRevision?.organizationId ?? selectedOrganization(session.user.id)) ? { 'x-yosseuf-organization': taskRevision?.organizationId ?? selectedOrganization(session.user.id)! } : {}) },
    body: JSON.stringify(id ? { ...input, id, ...(taskRevision ? { expectedUpdatedAt: taskRevision.updatedAt } : {}) } : input),
  });
  const result = await response.json() as { error?: string; auditRecorded?: boolean };
  if(response.ok && resource==='tasks' && id) {
    const changed=(result as {data?:{id?:unknown;updated_at?:unknown;archived?:unknown}}).data;
    if(changed?.id!==id || typeof changed.updated_at!=='string' || !changed.updated_at || changed.updated_at===taskRevision?.updatedAt
      || (('archived' in input) && input.archived===true && changed.archived!==true))
      return 'لم يتأكد الحفظ. حدّث البيانات. / Save unconfirmed. Refresh.';
  }
  if (response.ok && resource === "tasks" && id && result.auditRecorded === true) taskRevision?.onAuditRecorded?.();
  return response.ok ? null : result.error ?? "Request denied";
  } catch { return 'لم يتأكد الحفظ. حدّث البيانات. / Save unconfirmed. Refresh.'; }
}

export async function authorizedWorkspaceDelete(resource: AuthorizedResource, session: Session, id: string) {
  const response = await fetch(`/api/workspace/${resource}?id=${encodeURIComponent(id)}`, {
    method: "DELETE", headers: { authorization: `Bearer ${session.access_token}` },
  });
  const result = await response.json() as { error?: string; auditRecorded?: boolean };

  return response.ok ? null : result.error ?? "Request denied";
}
