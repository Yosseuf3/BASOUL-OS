# Organization Foundation

YOSSEUF Platform uses organizations as the tenant boundary. Membership, not client-supplied identity fields, selects access. Each organization has one or more active owners, and every business row remains protected by organization-scoped RLS.

## Request contract

Authenticated APIs accept `X-YOSSEUF-Organization` as an optional organization selector. The server validates an active membership before using it. Omitting the header preserves v3.1 behavior by resolving the user's personal organization.

## Roles

- Owner: organization, membership, workspace, and business administration.
- Admin: membership, workspace, and business administration except organization ownership.
- Member: create and update workspace/business data.
- Viewer: read-only access.

The TypeScript policy layer improves API feedback; PostgreSQL RLS remains authoritative. The workspace migration must be validated on **YOSSEUF Platform Staging** before any separate Production approval.
