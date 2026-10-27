# Repository cleanup and Android Build 32 review — 2026-10-27

Baseline main: `18219ccf4fa67d1b6be830b9ffdec99d835431f2`. Existing release `v4.0.0` already exists and is preserved. Proposed distinct artifact identity: `v4.0.0-android-build.32`, targeting the actual APK source commit; app version remains 4.0.0. Draft publication is required while authenticated/physical-device release checks remain incomplete.

## Pull request disposition

All eight open PRs were inspected, including changed-file manifests, ancestry, patch-equivalence checks, current main comparisons and reported checks. Neither age nor a green historical CI run establishes that work is obsolete. Branches and local untracked files are retained.

| PR | Classification | Evidence and disposition |
| --- | --- | --- |
| #182 | Required release documentation | README/mobile README/release notes; required Web quality and Mobile quality passed at `3c0be95`. Updated with actual binary verification and emulator screenshot. Final head must pass checks before squash merge. |
| #178 | Superseded | Main `8d78d17` already implements reproducible mobile installs and security-patch verification, with Zod 4.6.6 compatibility validation instead of the PR's Zod 3 exception. Main `18219cc` adds idempotent patching and regression coverage. One of five changed paths matches main; the other four would restore older dependency/audit/patch behavior. PR conflicts with main. Close as superseded, retain branch/commits. No exception extension is accepted. |
| #175 | Requires repair / separate CI decision | Stacked on #174, not main; Release scope/Web aggregate passed, Mobile quality/Android aggregate failed on its historical head. Eleven proposed paths differ from main, including unmerged scope classifier and tests. Preserve as draft; no ruleset transition or merge. |
| #174 | Required independent integration review | 100 proposed paths differ from main, including organization/project/task workflows and SQL candidates. Main's #176 was a six-file security/Expo update, not a merge of this integration. Preserve draft and branch; do not claim integrated or close. |
| #173 | Required independent task review | 36 proposed paths differ from main, including task CAS/enforcement candidates and tests. Preserve draft/branch; schema/workflow activation is outside this cleanup. |
| #163 | Requires repair | Architecture/mobile work has 22 of 27 paths differing from main, merge conflicts, and failed historical Android build/status checks. Preserve; do not merge. |
| #132 | Required architecture review | Twelve proposed paths differ from main, including two migrations and architectural analysis behavior. Historical checks passed, but branch is behind main. Preserve; do not roll out migrations or infer current acceptance. |
| #111 | Retained proof of concept | Twenty-two proposed paths differ from main, including isolated Pascal experiment and proposed persistence SQL. Its own decision limits adoption to selected engine adapters. Preserve evidence/branch rather than merging a whole prototype or deleting it. |

No branch was deleted. No temporary log, backup, APK, credential, local setting, AGENTS.md, CLAUDE.md or error.log is included in source changes. Existing untracked work is preserved. CI experiments and old preview/status workflows were inspected: the status workflow still verifies historical build `1eb15013-a059-436d-84c3-b5c335017b35`, so its success must not be presented as verification of Build 32. Direct EAS Build 32 metadata and APK verification supply the current artifact evidence. Workflow removal/change needs its own focused review; none is deleted merely because it is old.

## Preview failure and bounded cleanup

PR #182's original Vercel Preview `dpl_6Vgr4vVmucHcYVLRLEd2ECVJLNPN` failed publishing CAD (`buildah push`, exit 125). Registry inventory was 50 images with complete pagination. All 98 retained deployments were reviewed against image digests and source tags, using immutable terminal-state cached evidence and fresh logs for newer deployments: zero lookup errors and no active builds. The two older READY deployments without CAD digests predate the candidate and have no CAD service configuration.

Exactly one image was selected: `image_e4KiPX4y38tNmKEc2Ae3kmF5TNic`, tag `6872488f73c3`, digest `sha256:53ace06852eefa12e6a3ca97ad36cb58ddad5c8cf08c752ce3d41e9966408c78`, created 2026-09-01. It has zero retained deployment digest references and zero source-tag matches. Its deletion restores one publication slot; protected Production/Rollback/Preview images are not selected. The replacement PR Preview must be verified separately; capacity cleanup alone is not a deployment PASS.

Production deployment/domain configuration and Supabase databases/RLS/Auth are outside this change. Main Git deployment is currently disabled in `vercel.json`; preserve that behavior. A GitHub asset release is not a Web production promotion.
