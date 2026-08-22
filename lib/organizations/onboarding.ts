import { supabase } from "@/lib/supabase";
import { acceptPendingInvitations } from "./administration";

export type OrganizationOnboardingInput = {
  name: string;
  legalName?: string;
  countryCode: string;
  region?: string;
  city?: string;
  addressLine?: string;
  phone?: string;
  contactEmail?: string;
  taxNumber?: string;
};

export type OrganizationAccessState =
  | { kind: "member"; organizationId: string; role: "owner" | "admin" | "member" | "viewer" }
  | { kind: "onboarding" };

function slugify(name: string) {
  const normalized = name.normalize("NFKD").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || `org-${crypto.randomUUID().slice(0, 8)}`;
}

export async function resolveOrganizationAccess(): Promise<OrganizationAccessState> {
  await acceptPendingInvitations().catch(() => undefined);
  const { data, error } = await supabase.from("organization_memberships")
    .select("organization_id,role,status")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { kind: "onboarding" };
  return { kind: "member", organizationId: data.organization_id, role: data.role } as OrganizationAccessState;
}

export async function createOwnedOrganization(input: OrganizationOnboardingInput) {
  const { data, error } = await supabase.rpc("create_owned_organization", {
    organization_name: input.name.trim(),
    organization_slug: `${slugify(input.name)}-${crypto.randomUUID().slice(0, 6)}`,
    profile_legal_name: input.legalName?.trim() || null,
    profile_country_code: input.countryCode.trim().toUpperCase(),
    profile_region: input.region?.trim() || null,
    profile_city: input.city?.trim() || null,
    profile_address_line: input.addressLine?.trim() || null,
    profile_phone: input.phone?.trim() || null,
    profile_contact_email: input.contactEmail?.trim().toLowerCase() || null,
    profile_tax_number: input.taxNumber?.trim() || null,
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Organization creation did not return an identifier.");
  return data;
}
