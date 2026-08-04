import { createClient } from "@supabase/supabase-js";

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

export async function authenticatedDatabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  const database = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await database.auth.getUser(accessToken);
  if (error || !data.user) return null;
  const { data: organizationId, error: organizationError } = await database.rpc("ensure_personal_organization");
  if (organizationError || typeof organizationId !== "string") throw new Error("Unable to resolve an active organization.");
  return { database, user: data.user, organizationId };
}
