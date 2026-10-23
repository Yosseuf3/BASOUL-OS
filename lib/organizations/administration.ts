import {organizationClient} from './scoped-client';
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { OrganizationRole } from "./rbac";

export type OrganizationMembership = {
  organization_id: string; user_id: string; role: OrganizationRole;
  status: "active" | "invited" | "suspended"; created_at: string; updated_at: string;
};

export type OrganizationInvitation = {
  id: string; email: string; target_user_id: string | null; role: Exclude<OrganizationRole, "owner">;
  status: "pending" | "accepted" | "expired" | "revoked"; expires_at: string; created_at: string; updated_at: string;
};

async function invokeAdministration<T>(body: Record<string, unknown>) {
  const supabase=organizationClient();
  const { data, error } = await supabase.functions.invoke("organization-admin", { body });
  if (error) {
    const context=(error as {context?:unknown}).context;
    let code:unknown;
    if(context instanceof Response){try{code=(await context.clone().json()).code;}catch{/* Unconfirmed transport failure. */}}
    if(code==='INVITATION_DELIVERY_UNCONFIRMED')throw new Error('لم يتأكد تسليم الدعوة. تحقق من رابط التحقق السابق قبل إعادة المحاولة. / Invitation delivery is unconfirmed. Verify the original link before retrying.');
    if(code==='ADMIN_UPDATE_REQUIRED')throw new Error('يتطلب عرض الفريق تحديث الخادم. / Team administration requires a server update.');
    throw error;
  }
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export async function acceptPendingInvitations() {
  const {data:before,error:identityError}=await supabase.auth.getUser();
  if(identityError||!before.user)throw new Error('تحقق من الجلسة قبل قبول الدعوة. / Verify your session before accepting.');
  const {data,error}=await supabase.functions.invoke('organization-admin',{body:{action:'accept'}});
  if(error||data?.error||!Number.isSafeInteger(data?.accepted)||data.accepted<0)
    throw new Error('لم يتأكد قبول الدعوة. حدّث العضويات قبل إعادة المحاولة. / Acceptance unconfirmed. Refresh memberships before retrying.');
  const {data:after,error:refreshError}=await supabase.auth.getUser();
  if(refreshError||after.user?.id!==before.user.id)
    throw new Error('تغيرت الجلسة. أعد التحقق من العضويات. / Session changed. Verify memberships again.');
  return {accepted:data.accepted as number};
}

export async function loadAdministration(session: Session) {
  const supabase=organizationClient(undefined,session.user.id);
  const { data: memberships, error } = await supabase.from("organization_memberships")
    .select("organization_id,user_id,role,status,created_at,updated_at,organizations(id,name,slug)")
    .eq("user_id", session.user.id).eq("status", "active");
  if (error) throw error;
  const current = memberships?.[0];
  if (!current) return null;
  const { data: members, error: membersError } = await supabase.from("organization_memberships")
    .select("organization_id,user_id,role,status,created_at,updated_at")
    .eq("organization_id", current.organization_id).order("created_at");
  if (membersError) throw membersError;
  return { current, members: (members ?? []) as OrganizationMembership[] };
}

export async function setMembership(organizationId: string, userId: string, role: OrganizationRole, status: OrganizationMembership["status"]) {
  if (status !== "active") return deactivateMembership(organizationId, userId);
  await invokeAdministration({ action: "change_role", organizationId, userId, role });
}

export async function removeMembership(organizationId: string, userId: string) {
  await invokeAdministration({ action: "remove", organizationId, userId });
}

export async function deactivateMembership(organizationId: string, userId: string) {
  await invokeAdministration({ action: "deactivate", organizationId, userId });
}

export async function inviteMember(organizationId: string, email: string, role: Exclude<OrganizationRole, "owner">) {
  return invokeAdministration<{ invitation: OrganizationInvitation; delivery: "existing_user" | "email_sent" }>({
    action: "invite", organizationId, email, role,
  });
}

export async function loadInvitations(organizationId: string) {
  return invokeAdministration<{ invitations: OrganizationInvitation[]; members: OrganizationMembership[] }>({ action: "list", organizationId });
}

export async function revokeInvitation(organizationId: string, invitationId: string) {
  await invokeAdministration({ action: "revoke", organizationId, invitationId });
}
