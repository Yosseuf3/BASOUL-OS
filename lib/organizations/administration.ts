import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { OrganizationRole } from "./rbac";

export type OrganizationMembership = {
  organization_id: string; user_id: string; role: OrganizationRole;
  status: "active" | "invited" | "suspended"; created_at: string; updated_at: string;
};

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
  const { error } = await supabase.rpc("set_organization_membership", {
    target_organization: organizationId, target_user: userId, target_role: role, target_status: status,
  });
  if (error) throw error;
}

export async function removeMembership(organizationId: string, userId: string) {
  const { error } = await supabase.rpc("remove_organization_membership", { target_organization: organizationId, target_user: userId });
  if (error) throw error;
}

