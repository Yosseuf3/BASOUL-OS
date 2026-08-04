import type { User } from "@supabase/supabase-js";
import type { OrganizationRole } from "./rbac";

export const ORGANIZATION_HEADER = "x-yosseuf-organization";

export type OrganizationContext = {
  organizationId: string;
  user: User;
  role: OrganizationRole;
};

export function requestedOrganization(headers: Headers) {
  const value = headers.get(ORGANIZATION_HEADER)?.trim();
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}
