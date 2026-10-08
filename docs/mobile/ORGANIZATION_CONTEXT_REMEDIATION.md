# Mobile organization context remediation

Baseline: canonical main `481972c5b35938e342de3ef1f7a1127d7b947ed8`.
Audit: 2026-10-09, read-only live schema and RLS inspection of the existing production project. No production writes, schema/RLS changes, or migrations are part of this remediation.

## Findings and classification

| Operation/data | Classification | Contract / remediation |
| --- | --- | --- |
| Organizations and active memberships | A: organization-scoped | Query authenticated user's active memberships with joined organization name. RLS remains authoritative; never trust persisted role/name. |
| Projects, tasks | A | Existing `organization_id NOT NULL`, tenant RLS. Read selected tenant including colleague-created records; inserts explicitly set tenant and authenticated creator. Validate project references in that tenant. Updates retain creator restriction required by existing RLS. |
| Architectural drawings, reviews, nested findings, plan elements, comments | A | Filter selected tenant (including embedded findings). Check project/drawing references before upload/retry and scope updates. Existing analysis triggers derive organization from drawing/review lineage; Edge Function uses authenticated client/RLS. No function deployment change. |
| Notifications | A, with recipient-private behavior | Tenant RLS exists, but preserve Mobile's `user_id` recipient filter for reads and read-state writes. Do not mark another recipient's notification read. |
| Timeline/events, Search, executive metrics | A: derived view | Existing Mobile Timeline derives from project/task dates and notifications; no standalone event mutation/API is introduced. All derive from current scoped workspace only. Empty-data health/confidence remain computed defaults, not proof of tenant access. |
| Administration | A | Display selected membership role; no membership/global permission writes. |
| Auth session, Account email, local selection preference | B: user-private | Existing canonical auth/sign-out retained. Persist organization ID only under a user-specific key; clear on logout/account change. Auth secrets are never copied into context/preferences/logs. |
| Drawing upload storage | B + A parent boundary | Retain existing user/project folder convention and Storage RLS. Validate project in selected tenant, explicitly persist drawing tenant. |
| Branding/token assets | C: global/public | Unchanged; no organization filter. |

The prior Mobile implementation queried workspace records only by `user_id` and loaded the first membership's role, discarding organization identity. Tenant-aware RLS limits accessible tenants but does not choose one when a user has multiple memberships. Database defaults can infer an unintended organization for inserts; Mobile must set the selected tenant explicitly.

## Shared context and lifecycle

`OrganizationContextStore` is the single selection/generation model used by App. A fresh `auth.getUser()` validates the user before membership resolution. Zero memberships leaves an explicit Web-onboarding/empty state; one is selected automatically; multiple require explicit selection unless a persisted selection is still active. The header exposes name, role and ID, with a bounded selector only for multiple memberships.

Selection persistence contains only an ID, keyed by user; serialized storage operations prevent late persistence overwriting logout cleanup. Roles are always reloaded. Refresh, login/session restoration, and app foregrounding revalidate membership. Every workspace read/write also revalidates the authenticated user and active permission; revocation fails closed. This is not an instant push revocation mechanism—offline clients cannot validate fresh access, so tenant loads/writes fail rather than trust cached membership.

Each refresh/switch invalidates the context generation synchronously and clears all in-memory workspace arrays and mutation indicators. During validation, tenant screens are hidden but Account/logout stays reachable. Late membership/workspace responses, mutation completions and errors cannot populate a newer generation or another user's UI. No persistent workspace cache is introduced.

## Security / compatibility risks

- RLS remains the backend authority. Client validation/filtering is defense in depth, not a replacement or bypass. No service-role credential is added.
- Previously creator-filtered tenant lists now include colleague-created records permitted by tenant RLS. Mutations retain `user_id` checks because current update policies require the authenticated creator. Non-creators get a scoped failure rather than ownership reassignment.
- Organization validation requires network access; failure presents an error and hides stale tenant content. Additional Auth/membership requests add latency; there is intentionally no authorization-result cache.
- Existing multi-step drawing analysis/task conversion remains non-transactional. Backend RLS/triggers and explicit parent checks govern each step; this change does not invent rollback or change deployment contracts.
- A mutation already submitted before a switch can complete in its original authorized tenant; its completion must not alter the newly selected UI. No client-only mechanism can revoke an already committed server operation.
- No migrations, dependency updates, release identity changes, signing changes or security exception expansion are required.

## Regression validation

Executable tests exercise actual production context, query builders and App lifecycle with in-memory I/O only: zero/one/multiple memberships, switching, invalid persistence, revocation, logout/account change, restoration, scoped reads/writes, cross-tenant reference/mutation rejection, creator/recipient behavior, cache clearing and late/concurrent responses. Existing logout, branding, Login keyboard and release tests remain enabled. No production data is used as a test fixture.

Delivery is PR-only. No merge or EAS/APK/AAB build is authorized. An updated APK and emulator/physical verification require separate future authorization.

Local validation: 224/224 tests; Web/Mobile TypeScript PASS; lint 0 errors (19 pre-existing warnings); Expo Doctor 21/21; Mobile production audit PASS and Web production audit 0 vulnerabilities; existing exception topology/expiration unchanged (2026-10-16T00:00:00Z). Release/foundation/accessibility/YVL gates, Android/iOS runtime exports, Web production build and bundle budgets PASS. Web build uses the existing CI placeholder Supabase environment; no production environment file changed. Runtime exports are not APKs and do not constitute physical-device verification.
