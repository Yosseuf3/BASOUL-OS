# BASOUL Migration Architecture v1

This directory is an auditable, planning-only map for a possible future transition from YOSSEUF technology branding to the BASOUL technology masterbrand. It authorizes no rename, migration, deployment, redirect, account action, or runtime change.

The inventory is the control ledger. Every row has exactly one classification, a phase, risk, rollback method, and operational approval flags. When evidence is incomplete, the conservative classification is `REVIEW_MANUALLY` or `NEVER_TOUCH`.

## Documents

- `MIGRATION_ARCHITECTURE_v1.md` — scope, decision model, and system architecture.
- `MIGRATION_INVENTORY.csv` — canonical dependency ledger.
- `MIGRATION_PHASES.md` — ordered gates from planning through deprecation.
- `ROLLBACK_PLAN.md` — rollback criteria and actions per phase.
- `REDIRECT_MATRIX.md` — proposed web, repository, auth, and domain redirects.
- `RENAME_POLICY.md` — allowed classifications and naming controls.
- `BRAND_TRANSITION_RULES.md` — founder/masterbrand/product-family rules.
- `DEPENDENCY_MAP.md` — coupling and sequence map.
- `APPROVAL_CHECKLIST.md` — mandatory approvals before execution.

Production remains YOSSEUF. BASOUL migration is not started.
