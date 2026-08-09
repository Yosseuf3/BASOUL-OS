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

export const ORGANIZATION_ROLE_RANK: Readonly<Record<OrganizationRole, number>> = {
  viewer: 10, member: 20, admin: 30, owner: 40,
};

export function hasOrganizationPermission(role: OrganizationRole, permission: OrganizationPermission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function capabilitiesForRole(role: OrganizationRole) {
  return new Set(ROLE_PERMISSIONS[role]);
}

export function canManageMember(caller: OrganizationRole, target: OrganizationRole) {
  if (!hasOrganizationPermission(caller, "membership.manage")) return false;
  return caller === "owner" || ORGANIZATION_ROLE_RANK[target] < ORGANIZATION_ROLE_RANK.admin;
}

export function canAssignRole(caller: OrganizationRole, role: OrganizationRole, self = false) {
  if (self && ORGANIZATION_ROLE_RANK[role] > ORGANIZATION_ROLE_RANK[caller]) return false;
  if (caller === "owner") return true;
  return caller === "admin" && ORGANIZATION_ROLE_RANK[role] < ORGANIZATION_ROLE_RANK.admin;
}

