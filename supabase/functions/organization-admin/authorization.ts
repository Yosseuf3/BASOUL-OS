// Do not rank untrusted strings: undefined < 30 is false in JavaScript.
export function canAdministerMembership(membership: { role?: unknown; status?: unknown } | null): boolean {
  return membership?.status === "active" &&
    (membership.role === "owner" || membership.role === "admin");
}
