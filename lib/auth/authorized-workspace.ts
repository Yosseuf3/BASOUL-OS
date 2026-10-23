import { createClient } from "@supabase/supabase-js";
import type { OrganizationRole } from "@/lib/organizations/rbac";

export const AUTHORIZED_RESOURCES = ["projects", "tasks", "clients", "content_items", "knowledge_items", "finance_transactions", "activity_events", "notifications"] as const;
export type AuthorizedResource = (typeof AUTHORIZED_RESOURCES)[number];

export function isAuthorizedResource(value: string): value is AuthorizedResource {
  return AUTHORIZED_RESOURCES.includes(value as AuthorizedResource);
}

export function trustedIdentityPayload(input: unknown, userId: string, organizationId: string) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const businessFields = { ...source };
  for (const field of ["user_id", "organization_id", "created_by", "owner_id", "id"]) delete businessFields[field];
  return { ...businessFields, user_id: userId, organization_id: organizationId };
}

/** Account-only bootstrap: organization discovery/creation still relies on RLS/RPC. */
export async function authenticatedAccountDatabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  const database = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}`, 'x-basoul-task-create-contract':'atomic-source-v1' } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await database.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return {database,user:data.user};
}

export async function authenticatedDatabase(accessToken: string, requestedOrganizationId?: string) {
  // No first-membership fallback for a user-selected workspace request.
  if(!requestedOrganizationId)return null;
  const account=await authenticatedAccountDatabase(accessToken);
  if(!account)return null;
  const {database,user}=account;
  const membership = await database.from("organization_memberships")
    .select("role,status").eq("organization_id",requestedOrganizationId)
    .eq("user_id",user.id).eq("status","active").maybeSingle();
  if(membership.error || !membership.data || !["owner","admin","member","viewer"].includes(membership.data.role))return null;
  return {database,user,organizationId:requestedOrganizationId,role:membership.data.role as OrganizationRole};
}
