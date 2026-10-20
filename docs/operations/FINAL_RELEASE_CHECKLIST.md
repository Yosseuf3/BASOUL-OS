# Local release checkpoint and controlled rollout checklist

This document implements the owner policies approved on 2026-10-20. It authorizes no commit, remote operation or activation. Current candidate code is uncommitted.

## Approved policies and implementation

- A task transition notification is eligible only for the task creator, with current tenant read permission, when the committed audit actor differs from that creator. All six current transition edges remain creator-only: normal current actions therefore create no self-notification. No authorization was widened. Other-actor delivery tests use explicitly privileged synthetic historical audit fixtures, not a new actor permission.
- Missing atomic edit RPC and old direct status/field writers fail closed. No direct-update fallback is used. Web and Mobile show upgrade-required guidance. Unsupported physical task DELETE is rejected; old clients must upgrade.
- All physical task deletion is denied, including project/user cascade paths. This conservatively protects audit/accounting history even when historical accounting relationships cannot be inferred. Archiving is an explicit CAS field-edit operation, keeps task rows and activity, advances revision, atomically audits archive state, and makes the task read-only. Ordinary lists hide archived tasks. Restore/unarchive and permanent purge are not exposed permissions.
- The rollout SQL candidate has an empty organization activation table by default. Installing the schema activates no organization. Authenticated clients can read only membership-scoped activation state and cannot modify it. Disabled organizations cannot transition or drain task notifications. Only synthetic organization A is explicitly enabled by local fixture setup. Organization B remains disabled.
- The client activation override is limited to development mode plus the exact synthetic loopback endpoint and an explicit local rehearsal flag. Production builds and remote endpoints always remain disabled by this override. A production tenant-aware client gate is not enabled or supplied by these test flags; it needs a reviewed release implementation before actual activation.

## Checkpoint inventory

Include only reviewed source, tests, SQL candidates, supported dependency patch changes and documentation listed in the final readiness report. Keep preserved earlier reason/confirmation work. Exclude error.log, generated AGENTS.md/CLAUDE.md and every ignored .git/basoul-local artifact (logs, exports, synthetic state, clean dependency installation, screenshots). No staging or automatic commit.

## Schema preflight and rehearsal

- Confirm actual full schema, enum order, all historical task versions, creator and organization identities, accounting links, IAM grants/RLS, audit/notification columns, triggers and foreign-key cascade paths against a disposable non-production copy.
- Do not guess NULL historical CAS versions. Existing preflight rejects them; separately review any needed data repair.
- Fresh and pre-Review upgrade rehearsals now pass all 37 ordered repository migrations, including the existing canonical client baseline before v0.5.0 and the additional architectural foundation. Atomic candidate rollback and full dump/restore fingerprints pass. See docs/database/HISTORICAL_MIGRATION_ORDER.md. Hosted Storage API and real deployed migration ledgers/data remain uncovered; no production parity is claimed.
- Review the psql install manifest under docs/database. Enum expansion commits separately; rollout, hardening, enforcement, notification privacy/receipts and edit/archive guards install transactionally. These candidates are not automatically registered remote migrations. Review existing object names before applying: several CREATE TRIGGER/POLICY statements intentionally fail on an already-installed candidate rather than silently replacing protections.
- Notification policy replacement narrows the entire inbox to the current authorized recipient. Review other notification producers and grants. The task DELETE trigger also stops FK cascades. Retain these protections during rollback.
- Confirm zero activation rows after schema installation; snapshot/backup and rehearse recovery before any authorized external work.

## Deployment order — preparation only

1. Resolve HIGH dependency advisories with supported upstream versions; rerun clean installs, full audits, lint, TypeScript, tests and build. Do not extend exceptions.
2. Close historical schema gaps and native runtime coverage. Verify complete activated Web/Mobile flows on the rehearsed schema, including conflicts, authorization, archiving, private inbox links and network recovery.
3. Review the full checkpoint inventory and request explicit approval before committing it. A local checkpoint is distinct from release approval.
4. Prepare reviewed tracked migrations and a tenant-aware production client gate. The local-only test override must never become a remote activation mechanism.
5. Obtain separate authorization for deployment, migration and later activation. Enter maintenance/write fencing for incompatible old clients. Back up data, install candidates atomically with all organization gates off, and deploy compatible clients with production writes still off.
6. Only after all prerequisite evidence passes and activation is explicitly authorized, enable exactly one separately approved isolated test organization. Do not start with general membership or an entire environment. Verify that all other organizations remain disabled.
7. Observe transition/audit counts, no-self-notification behavior, duplicate receipts, denied legacy writes, archive retention and CAS conflict outcomes. Expand only through separately approved organization allowlist changes after a defined observation period.

## Rollback checklist — non-destructive

- Fence new writes, allow or account for in-flight transactions, disable the isolated organization's activation row and client gate, and stop notification drains. Verify another transition is denied and delivery returns zero.
- Retain tasks, archive flags, immutable activity and notification receipts. Do not delete inbox/outbox/audit data or roll back a task by retrying its transition.
- Keep CAS, identity/tenant guards and delete protection installed. Rolling clients back to versions that cannot use the protocol requires read-only maintenance/upgrade guidance; never reopen direct unsafe writes.
- Enum additions are not undone by deleting enum values. Restore backups only as a separately reviewed recovery operation; no destructive down migration is included.
- SQL/HTTP tests cover transaction failure rollback (including archive audit failure) and local gate shutdown. They do not certify full production disaster recovery or zero in-flight delivery after a concurrent flag change.
