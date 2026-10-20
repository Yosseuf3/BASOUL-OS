# Task transition response confirmation

Local development after checkpoint 34e0d03. Workflow writes remain disabled.

Implemented locally before this change: five-state shared readers/graph, Web and
Mobile CAS request preparation, authorization boundaries, conflict refresh,
review-only enum/enforcement/security SQL candidates and isolated Auth/PostgREST
regressions. No Cloud-only work is assumed available.

Web and Mobile now confirm a successful transition only when the returned task
matches the requested task ID, organization and target state, contains an opaque
PostgreSQL timestamp distinct from the expected old token, and has integer
progress in 0..100. Exact timestamp precision is retained; no JS Date conversion,
progress normalization or write retry occurs. This validates a response shape;
authorization and monotonic versions remain database responsibilities.

Empty, malformed, unrelated or unchanged-token success responses are uncertain
outcomes, because a write may have committed despite a bad response. Both clients
surface refresh-before-retry guidance. Mobile preserves organization context.
Confirmed CAS conflicts retain their existing classification and refresh path.
Invalid Web requests are rejected before transport rather than reported as an
uncertain write. Test-only dependency injection exercises enabled paths; the
production flag remains false. The real isolated HTTP test also validates the
successful RPC row against this same confirmation contract.

Remaining functional gaps: mandatory reason semantics/UX, notification delivery
and deduplication, and supported legacy-client update handling need product and
rollout decisions. Generic field edits do not yet have full CAS protection.
Browser/native E2E remains separate from authenticated backend HTTP validation.

Activation is blocked on separately authorized enum/enforcement installation,
schema/API verification, supported-writer rollout and explicit activation.
No migration is promoted or applied to an external database. Android release
also remains blocked by existing HIGH dependency findings; no exceptions change.
