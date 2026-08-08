# Rollback Plan

## Global triggers

Rollback on authentication failure, cross-tenant access, data/schema change, broken installed-app update, API incompatibility, unresolved redirect loop, material SEO loss, missing external integration, signature/store rejection, critical error increase, or founder attribution loss.

| Phase | Rollback |
|---|---|
| 0 | Revert planning documents; no operational state exists. |
| 1 | Revert the documentation commit and republish prior docs. |
| 2 | Remove preview/staging BASOUL configuration and restore the previous non-production artifact. Approved source assets remain unchanged. |
| 3 | Restore old package scopes, compatibility aliases, lockfiles, imports, and manifest values from the pre-phase tag; rebuild all consumers. |
| 4 | Promote the captured prior immutable Vercel deployment, restore aliases/cache metadata, and verify YOSSEUF labels. |
| 5 | Halt rollout, restore store metadata where permitted, distribute the last signed YOSSEUF build, and retain legacy deep links. Signed identifiers are never changed by this plan. |
| 6 | Restore DNS, canonical host, Auth allowlists, sitemap, and CDN routing; disable new redirects while preserving old hosts. |
| 7 | Restore captured provider display names, environment variables, gateway configuration, social bios, legal text, and monitoring labels. Never roll back by rotating identifiers ad hoc. |
| 8 | Rename repositories/projects back, restore remotes, Actions/webhooks/badges, and cross-repository references; verify old provider redirects. |
| 9 | Re-enable every legacy alias/header/callback/URL and extend the compatibility window. |
| 10 | Reinstate deprecated routes and aliases from the compatibility release; republish deprecation timelines. Historical records are never rewritten. |

Every rollback requires evidence capture before and after, named decision authority, incident timeline, and parity checks appropriate to the affected layer.
