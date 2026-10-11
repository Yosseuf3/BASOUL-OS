# Mobile mutation safety — partial remediation

Baseline: f0b0c25150b515665ec5a9efb5e41ae29d015bad.

Read-only production verification on 2026-10-10 found task_status values:
To Do, In Progress, Waiting, Done. Mobile and Web currently define Review.
No product documentation or checked-in SQL establishes that Waiting means
review/approval rather than blocked/deferred. No Review-to-Waiting mapping,
status-domain change, schema change or Web change is authorized by this evidence.
The owner must define the intended stage and approve the application contract.
Status compatibility and pre-submission rejection tests remain blocked by that
decision; they are not represented as passing release gates. Task lifecycle
release acceptance remains blocked until the contract is resolved.

This independent change preserves the selected organization on ordinary
mutation errors, while confirmed revoked membership/account changes clear it.
Every mutation still revalidates identity, membership and permission before
writing. Temporary verification failures reject the write, not membership.
Refresh retains the last organization identity for presentation; its revision
is invalid during revalidation, so cached tenant data and writes remain blocked
if verification fails. Same-user auth events no longer eagerly clear identity
or navigation; the existing refresh effect and revision guards still run.
Logout/account changes continue clearing previous-user state and persistence.

Errors expose a controlled Arabic category message and only recognized code
formats. Arbitrary backend message/details/hints are not displayed, because they
can contain record contents, credentials or identities. Network errors warn of
ambiguous outcomes. No operation is automatically retried. Safe diagnostics
retain category/code; raw payloads and session secrets are never logged.

Focused tests execute the operation helper for ordinary errors, revocation,
stale failure suppression and one-attempt ambiguous writes. Service tests prove
temporary identity verification failure performs no write. Existing tenant,
revocation, persistence/logout and role revalidation coverage remains intact.
An App integration assertion checks use of the tested helper and conditional
account clearing; fresh APK lifecycle/device verification remains required.

No production task records, RLS, dependencies, release identity, signing,
security exceptions or approved artwork are changed. This is a PR-only partial
remediation, not authorization to merge or build.

## Local validation

- Baseline full suite: 224/224 PASS; remediation full suite: 235/235 PASS.
- Focused organization/App lifecycle tests: 42/42 PASS.
- Web and Mobile TypeScript: PASS.
- Lint: 0 errors, 19 unchanged existing warnings.
- Expo Doctor: 21/21 PASS.
- Mobile production audit: PASS under the unchanged two exact tooling
  exceptions, expiring 2026-10-16T00:00:00Z; no exception expansion.
- Release consistency and diff whitespace audit: PASS.
- Authorized read-only verification: both existing E2E tasks remain
  In Progress, progress 15, in the expected organization/project/creator scope.

These results do not resolve the status contract or establish new APK/device
behavior. No EAS build or production deployment was performed.
