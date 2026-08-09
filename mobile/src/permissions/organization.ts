export type MobileOrganizationRole = "viewer" | "member" | "admin" | "owner";
export type MobilePermission = "read" | "create" | "update" | "delete" | "manage_members" | "manage_organization";
const minimum: Record<MobilePermission, number> = { read: 10, create: 20, update: 20, delete: 30, manage_members: 30, manage_organization: 40 };
const rank: Record<MobileOrganizationRole, number> = { viewer: 10, member: 20, admin: 30, owner: 40 };
export const hasMobilePermission = (role: MobileOrganizationRole, permission: MobilePermission) => rank[role] >= minimum[permission];
