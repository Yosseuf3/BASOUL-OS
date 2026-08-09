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
  const { data, error } = await supabase.functions.invoke("organization-admin", { body });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export async function acceptPendingInvitations() {
  return invokeAdministration<{ accepted: number }>({ action: "accept" });
}

export async function loadAdministration(session: Session) {
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
