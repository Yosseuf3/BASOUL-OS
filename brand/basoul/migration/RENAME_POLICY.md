# Rename Policy

## Policy

A rename is permitted only when its inventory row is `RENAME`, its phase is approved, dependencies are enumerated, compatibility behavior is tested, and rollback is rehearsed. `REVIEW_MANUALLY` is a stop state, not permission.

Bulk search-and-replace is prohibited. YOSSEUF RADWAN personal/founder identity must be preserved.

## Protected defaults

The following default to `NEVER_TOUCH`:

- database primary keys, UUIDs, persisted foreign keys, table/function/policy/schema identifiers, and migration history;
- Auth provider IDs, user IDs, identity links, session identifiers, OAuth client IDs, and callback secrets;
- secrets, API keys, signing keys, certificates, tokens, and Production environment-variable values;
- signed iOS bundle IDs, Android application IDs, EAS project IDs, store application identities, and package identifiers that would break installed apps;
- stable API routes unless a separately versioned compatibility design exists;
- historical release tags, published release artifacts, deployment IDs, Git history, signed commits, audit evidence, and historical release notes;
- approved BASOUL assets and YVL visual rules.

An exception requires a later architecture that proves provider support, compatibility, migration/rollback mechanics, downtime, data parity, and explicit owner/security/legal approval.

## Naming direction

Technology display names may move from YOSSEUF to BASOUL by phase. Founder, author, account owner, and personal-brand references remain YOSSEUF RADWAN. Historical statements remain historically accurate.
