import { hasOrganizationPermission, type OrganizationPermission, type OrganizationRole } from "./rbac";

export type OrganizationPolicyDecision = {
  allowed: boolean;
  reason: "allowed" | "inactive-membership" | "missing-permission";
};

export function evaluateOrganizationPolicy(input: {
  role: OrganizationRole;
  status: "active" | "invited" | "suspended";
  permission: OrganizationPermission;
}): OrganizationPolicyDecision {
  if (input.status !== "active") return { allowed: false, reason: "inactive-membership" };
  return hasOrganizationPermission(input.role, input.permission)
    ? { allowed: true, reason: "allowed" }
    : { allowed: false, reason: "missing-permission" };
}
