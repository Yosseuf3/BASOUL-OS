# Gated task reason confirmation

Actual states: To Do, In Progress, Waiting, Review, Done.
Allowed edges: To Do -> In Progress; In Progress -> Waiting or Review;
Waiting -> In Progress; Review -> In Progress or Done. Done is terminal.

The reviewed SQL accepts an optional reason on all six edges. It trims and
records the bounded reason in the atomic audit event; reasons confer no authority.
Active tenant membership, update permission, matching creator, exact CAS status
and timestamp, and the existing transition graph remain mandatory.

Conflicts with the proposed semantics are intentionally not implemented:

* Cancellation and explicit rejection have no defined states/edges.
* Reopening Done is forbidden by the current graph.
* Review -> In Progress is the supported rework/backward edge, but the SQL
  explicitly leaves mandatory reason semantics undecided. It remains optional.
* Waiting -> In Progress resumes execution, rather than reopening a completed task.

Web and Mobile now request explicit confirmation for supported workflow actions
behind the unchanged false workflow flag. Both show source/target status in
Arabic and English, an optional reason, the 1000-character limit, progress
preservation guidance, and bilingual validation/error feedback. Confirmation
passes trimmed nonblank text, or omits whitespace-only reasons. Overlong reasons
and unsupported transitions block submission. Cancellation sends no mutation;
a synchronous in-flight guard prevents duplicate confirmation taps. The legacy
pre-activation flow and ordinary task edits do not gain reason requirements.

The existing request clients, authorization, CAS conflicts, response confirmation,
tenant context handling and no-automatic-retry policy are retained. SQL candidates,
migrations, security exceptions and workflow activation are unchanged.

Before mandatory rework reasons can be implemented consistently, approve the
exact edge classification and update the backend/client reason policy together.
Cancellation/reopening additionally require a separately approved graph change.
No production schema rollout or activation is included here.
