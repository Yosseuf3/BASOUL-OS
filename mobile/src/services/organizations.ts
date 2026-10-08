import { supabase } from "../config/supabase";
import { hasMobilePermission, type MobilePermission, type MobileOrganizationRole } from "../permissions/organization";
import type { OrganizationContext } from "../organizations/context";

export async function loadMobileOrganizations(userId: string): Promise<OrganizationContext[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: identity, error: identityError } = await supabase.auth.getUser();
  if (identityError) throw identityError;
  if (identity.user?.id !== userId) throw new Error("Authenticated account changed");
  const { data, error } = await supabase.from("organization_memberships")
    .select("organization_id,role,organizations!inner(id,name)")
    .eq("user_id", userId).eq("status", "active").order("organization_id");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    if (!organization || organization.id !== row.organization_id || !["owner", "admin", "member", "viewer"].includes(row.role)) throw new Error("Invalid organization membership");
    return { userId, organizationId: row.organization_id, name: organization.name, role: row.role as MobileOrganizationRole };
  });
}

export async function validateOrganizationContext(context: OrganizationContext, permission: MobilePermission = "read") {
  if (!context?.userId || !context.organizationId) throw new Error("Active organization required");
  const memberships = await loadMobileOrganizations(context.userId);
  const active = memberships.find((membership) => membership.organizationId === context.organizationId);
  if (!active || !hasMobilePermission(active.role, permission)) throw new Error("Organization access denied");
  return active;
}

export async function requireOrganizationRecord(context: OrganizationContext, table: string, id: string, userOwned = false) {
  if (!supabase) throw new Error("Supabase is not configured.");
  let query = supabase.from(table).select("id").eq("id", id).eq("organization_id", context.organizationId);
  if (userOwned) query = query.eq("user_id", context.userId);
  const { data, error } = await query.single();
  if (error) throw error;
  if (!data) throw new Error("Record does not belong to the active organization");
}
