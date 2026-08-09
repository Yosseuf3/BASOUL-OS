export const ORGANIZATION_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const ORGANIZATION_PERMISSIONS = [
  "organization.read",
  "organization.update",
  "membership.read",
  "membership.manage",
  "workspace.read",
  "workspace.create",
  "workspace.update",
  "workspace.delete",
  "business.read",
  "business.create",
  "business.update",
  "business.delete",
] as const;
export type OrganizationPermission = (typeof ORGANIZATION_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<OrganizationRole, ReadonlySet<OrganizationPermission>> = {
  owner: new Set(ORGANIZATION_PERMISSIONS),
  admin: new Set(ORGANIZATION_PERMISSIONS.filter((permission) => permission !== "organization.update")),
  member: new Set(["organization.read", "membership.read", "workspace.read", "workspace.create", "workspace.update", "business.read", "business.create", "business.update"]),
  viewer: new Set(["organization.read", "membership.read", "workspace.read", "business.read"]),
};

export function hasOrganizationPermission(role: OrganizationRole, permission: OrganizationPermission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function capabilitiesForRole(role: OrganizationRole) {
  return new Set(ROLE_PERMISSIONS[role]);
}
