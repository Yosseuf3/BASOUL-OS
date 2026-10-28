# BASOUL OS repository audit — 2026-10-28

Baseline main: `e22a74d0c121a9a98a5d2bcfcf2ff912ecb25aa3`. Initial remote branches: 77. After seven verified deletions: 70 (before publishing this new preparation branch). No active PR closed or merged as cleanup.

Classification SUPERSEDED proves the historical branch tree matched its squash merge tree; it does not by itself authorize deletion. Deployment-associated branches and all unique work are retained. CI listed is exact-tip evidence, not a release approval.

## Complete branch inventory

| Branch | Classification | SHA | Age days | Ahead/behind | PRs | Unique patches | Deployment refs | Action |
|---|---|---|---:|---|---|---:|---:|---|
| archive/codex-20260903-144057-YOSSEUF--OS | ARCHIVE | 5855db3dc49ea806fd689cc35272d91975badf48 | 92 | 6/425 |  | 0 | 0 | RETAINED |
| archive/yvl-review-2026-07-31 | ARCHIVE | 2e47792a9d2ceee97609be1a3b6b580b78f3ba0c | 81 | 6/345 |  | 6 | 0 | RETAINED |
| audit/ecosystem-integration-2026-08-30 | MERGED SAFE TO DELETE | e06e998ec699f8ad35bad98d24f251943d5c5c1f | 59 | 0/116 | #136 MERGED | 0 | 0 | DELETED (ancestor preserved in main) |
| chore/architecture-launch-readiness-rc1 | ACTIVE | 3ba78806b1be4a2040513801f98a7465b06f012a | 53 | 22/37 | #163 OPEN | 22 | 1 | RETAINED |
| chore/commercial-readiness-cleanup | SUPERSEDED | 2361f48695cfad33236307eff340ca0e9c5e6dc7 | 61 | 6/141 | #125 MERGED | 6 | 0 | RETAINED |
| chore/vercel-preview-churn-prevention | PROTECTED | ae90a6e0c966078aeb23d7fdcdbe9932b1dee0fb | 31 | 2/36 | #164 MERGED | 2 | 2 | RETAINED |
| ci/one-shot-android-preview-20261027 | PROTECTED | d611b3f5dddb4798ef081782fb1cf1971bfd5f77 | 1 | 2/5 | #180 MERGED | 2 | 2 | RETAINED |
| codex/android-security-exception-closure-20261028 | MERGED SAFE TO DELETE | 050b76dede398f2f22bfca1fe115515fda0100b0 | 0 | 1/1 | #184 MERGED | 0 | 0 | RETAINED |
| codex/five-state-task-compatibility | ACTIVE | 66f5dffd37c2a122e0346ca334fb54b39ea4e41b | 16 | 4/18 | #173 OPEN | 4 | 8 | RETAINED |
| codex/fix-crlf-camera-test | PROTECTED | 60f3185d0e13f7e56769045c85a50a81d3eaea77 | 24 | 0/33 | #166 MERGED | 0 | 2 | RETAINED |
| codex/login-keyboard-reachability | PROTECTED | c6bc84df0d8f727fb6ebb8128489c1cf75f48b97 | 20 | 0/23 | #170 MERGED | 0 | 2 | RETAINED |
| codex/manual-runtime-validation | PROTECTED | 618bff7993f23a43151d40130b969fe788cbe601 | 23 | 0/28 | #168 MERGED | 0 | 1 | RETAINED |
| codex/mobile-brand-identity-remediation | PROTECTED | ad73aa9852cc0d4f0c37c2d1eaacb722f7818f45 | 24 | 0/30 | #167 MERGED | 0 | 2 | RETAINED |
| codex/mobile-logout-access | PROTECTED | 6acd56807740d35b546ba6a976ef4cbac8390c8a | 22 | 0/26 | #169 MERGED | 0 | 1 | RETAINED |
| codex/mobile-mutation-context-safety | PROTECTED | 8ad91afade5e82c55b617da03e27be3a2554e07c | 18 | 0/19 | #172 MERGED | 0 | 1 | RETAINED |
| codex/mobile-organization-context | PROTECTED | 1db6ed5f054b76e444a457206771a019be3f6934 | 19 | 0/21 | #171 MERGED | 0 | 1 | RETAINED |
| codex/path-aware-release-gates | ACTIVE | 912b1b30ceb6ddc6b4ad0164285d0dd467f8e36a | 5 | 10/18 | #175 OPEN | 10 | 0 | RETAINED |
| codex/project-files-rls-security | PROTECTED | 85c93db36552a982025772b168e849382235e667 | 2 | 0/7 | #177 MERGED | 0 | 13 | RETAINED |
| codex/repository-reconciliation | ACTIVE | 755a20083084765e0ee679deb66272a369fbbda9 | 5 | 7/18 | #174 OPEN | 7 | 0 | RETAINED |
| docs/android-4-0-0-build32-release-prep-20261027 | PROTECTED | 0247ec2dbdee97b2275a78693039ab6cd93086b5 | 1 | 4/3 | #182 MERGED | 4 | 4 | RETAINED |
| docs/android-build32-physical-smoke-20261028 | PROTECTED | 61e305504b104086e498dfe980ad99ab1e3aa9d8 | 0 | 1/2 | #183 MERGED | 0 | 1 | RETAINED |
| docs/ecosystem-readiness-2026-08-31 | SUPERSEDED | bbb96029c6aa50ca11ed677c9647246a28da177d | 58 | 1/107 | #140 MERGED | 0 | 0 | RETAINED |
| experiment/zod4-expo-cli-compat-20261027 | PROTECTED | ec436a4d87732b17eb12e263789ee6173c1c89b8 | 1 | 15/6 | #179 MERGED | 15 | 9 | RETAINED |
| feat/ai-runtime-contract | MERGED SAFE TO DELETE | d4f67e3101026efe7730b90be28dad2f37755125 | 59 | 0/112 | #137 MERGED | 0 | 0 | DELETED (ancestor preserved in main) |
| feat/architecture-3d-fidelity-v3 | MERGED SAFE TO DELETE | ac9d15953f07e591e5d45656a7fffa235d4f1b52 | 56 | 0/62 | #160 MERGED | 0 | 0 | DELETED (ancestor preserved in main) |
| feat/architecture-ai-tools | SUPERSEDED | 7b0bb5e811de598bf225fdc44de2e4949808ec06 | 65 | 4/150 | #116 CLOSED, #115 MERGED | 4 | 0 | RETAINED |
| feat/architecture-direct-manipulation | SUPERSEDED | cb66f52bac7de76edc8e45959cca5550c0282185 | 61 | 7/142 | #124 MERGED | 7 | 0 | RETAINED |
| feat/architecture-editing-foundation | SUPERSEDED | a98731f6ce4d753010af83e4a986824fe43c522f | 61 | 6/143 | #123 MERGED | 6 | 0 | RETAINED |
| feat/architecture-foundation-v2 | SUPERSEDED | 3e661c7e1bee5569d2d63277eff52af720d98fc3 | 65 | 4/153 | #112 MERGED | 4 | 0 | RETAINED |
| feat/architecture-geometry-reconciliation | SUPERSEDED | 34eb79c0962baf9c77a1c329b50ce15b324e215e | 61 | 4/135 | #131 MERGED | 4 | 0 | RETAINED |
| feat/architecture-hybrid-parser | SUPERSEDED | f99dac220cd9e77c076a6c18e2b7c22be9837dca | 61 | 3/136 | #130 MERGED | 3 | 0 | RETAINED |
| feat/architecture-ifc-gateway | SUPERSEDED | 3d7f14af20a1d7d62907204202811958fccb6cc6 | 65 | 4/151 | #114 MERGED | 4 | 0 | RETAINED |
| feat/architecture-openings-topology-v3-3 | MERGED SAFE TO DELETE | 95990e13327c3f1a825bcc70d37c4c8b8ca9f10f | 54 | 0/38 | #162 MERGED | 0 | 0 | DELETED (ancestor preserved in main) |
| feat/architecture-pascal-runtime | SUPERSEDED | 44a215aeeeef283be6ac3c890dc48e60490e4679 | 61 | 9/148 | #118 MERGED | 9 | 0 | RETAINED |
| feat/architecture-persistence | SUPERSEDED | 700fd443cc7e099403117657f0e30d2bc8bd1cc4 | 65 | 4/152 | #113 MERGED | 4 | 0 | RETAINED |
| feat/architecture-review-pascal-preview | ACTIVE | 4ef6558ecf49c88d2fe8834c1e3f4c711c3fd3e1 | 61 | 17/134 | #132 OPEN | 17 | 1 | RETAINED |
| feat/architecture-runtime-persistence | MERGED SAFE TO DELETE | 6be1c65a47a8b2df027a6c27db6c35bb3485e6e8 | 61 | 0/147 |  | 0 | 0 | DELETED (ancestor preserved in main) |
| feat/architecture-runtime-persistence-v2 | SUPERSEDED | 06642acd2642e02e10664efb82930bdc24a691f5 | 61 | 3/147 | #119 MERGED | 3 | 0 | RETAINED |
| feat/architecture-wall-thickness-v3-2 | MERGED SAFE TO DELETE | 5ac361adf4a66e8bedbd78bcea8c71f6480ca0b9 | 54 | 0/55 | #161 MERGED | 0 | 0 | DELETED (ancestor preserved in main) |
| feat/architecture-workspace | SUPERSEDED | 0de00821b48d2d42bbc4cc9776603b6884c4867e | 65 | 2/149 | #117 MERGED | 2 | 0 | RETAINED |
| feat/architecture-workspace-persistence-ui | SUPERSEDED | 3c03ded7e865366a70151eb0b4318bc89f9e0559 | 61 | 6/146 | #120 MERGED | 6 | 0 | RETAINED |
| feat/cad-fidelity-v2-4-wall-coverage | PROTECTED | 934fa96600169c2f8cc9b7203b9e2482051c33b9 | 57 | 0/86 | #156 MERGED | 0 | 1 | RETAINED |
| feat/cad-floor-graph-v2 | SUPERSEDED | 36d0d756e0d09320ee36603a1ab89c03f73d2897 | 57 | 2/103 | #144 MERGED | 2 | 0 | RETAINED |
| feat/cad-gateway-vercel-service | PROTECTED | 50561319b30a094be69ea5a55cd102571279133f | 61 | 0/125 | #135 MERGED | 0 | 0 | RETAINED |
| feat/cad-ingestion-v1 | SUPERSEDED | d745ddda3683e44b19e1fbdd7b51ab18cd97072d | 61 | 27/134 | #133 MERGED | 27 | 0 | RETAINED |
| feat/cad-review-overlay | SUPERSEDED | b48a62d8b9866a4e7201660c2038c594e8adee08 | 61 | 6/133 | #134 MERGED | 6 | 0 | RETAINED |
| feat/opening-hosting-v2-1 | SUPERSEDED | 71939a45735cb9538fc45a04c4e0aea3eb4cc5a1 | 57 | 3/102 | #145 MERGED | 3 | 0 | RETAINED |
| feat/pascal-3d-semantic-integration-v2-3 | SUPERSEDED | 7f4cddd0d18ead6f46ba8cb4b186b55fbb9d6ec2 | 57 | 8/99 | #148 MERGED | 8 | 0 | RETAINED |
| feat/semantic-room-binding-v2-2 | SUPERSEDED | 71fd45cb28abf716934ccc0575d12fe3a0c19b3f | 57 | 4/100 | #147 MERGED | 4 | 0 | RETAINED |
| feat/shx-arabic-decoding | SUPERSEDED | bdd823ddc8c4846a2b1a92423fce6e83e535ba26 | 57 | 7/101 | #146 MERGED | 7 | 0 | RETAINED |
| fix/android-eas-node-forge-idempotent-20261027 | PROTECTED | 28dbfa742501c27b75cd94791e57b495e0c549c4 | 1 | 3/4 | #181 MERGED | 3 | 3 | RETAINED |
| fix/android-launch-gate-20260926 | PROTECTED | f32f25bff0596a3a2b415917d7e943761e4a2267 | 32 | 21/37 | #165 MERGED | 21 | 21 | RETAINED |
| fix/android-release-reproducible-ci-20261027 | UNMERGED VALUABLE | 13846a17853e933f89c462160562e29e58c5b6a2 | 1 | 6/6 | #178 CLOSED | 6 | 6 | RETAINED |
| fix/architectural-drawings-tenant-upload | SUPERSEDED | bcfaf0c87fe7bcfd7468c57696ae29e81f826fe2 | 61 | 3/138 | #128 MERGED | 3 | 0 | RETAINED |
| fix/architecture-analysis-tenant-context | SUPERSEDED | a53c978e75ed12cc8dad1a20917720380631e23e | 61 | 2/137 | #129 MERGED | 2 | 0 | RETAINED |
| fix/architecture-dwg-primary-entry | SUPERSEDED | f10fd1a0528eef8a3bbcecf235931e01909fb8c7 | 57 | 8/106 | #141 MERGED | 8 | 0 | RETAINED |
| fix/architecture-scene-privileges | SUPERSEDED | 0c556a3385f6a35413a39b12d79a8f86fd5d7ec2 | 61 | 3/144 | #122 MERGED | 3 | 0 | RETAINED |
| fix/architecture-scene-tenant-integrity | SUPERSEDED | 082ee32923084874efa01379adb01a4e11482853 | 61 | 2/145 | #121 MERGED | 2 | 0 | RETAINED |
| fix/cad-fidelity-v2-4-provenance-gate | MERGED SAFE TO DELETE | a23651608a51446a8df0e841a8e91ea112bf6532 | 57 | 0/91 | #155 MERGED | 0 | 0 | DELETED (ancestor preserved in main) |
| fix/cad-layer-normalization-v2-5-merge | PROTECTED | 84f60da03b79dd9a60412f04d5b2dc1d32a01bc8 | 57 | 3/85 | #158 MERGED | 3 | 1 | RETAINED |
| fix/cad-layer-normalization-v2-5 | UNMERGED VALUABLE | 84f60da03b79dd9a60412f04d5b2dc1d32a01bc8 | 57 | 3/85 | #157 CLOSED | 3 | 1 | RETAINED |
| fix/cad-text-layer-semantics-v2-6 | PROTECTED | 5977780ea5037cb1462984883c4ff38d9d5f769a | 56 | 0/69 | #159 MERGED | 0 | 1 | RETAINED |
| fix/pascal-cad-camera-fit | SUPERSEDED | 382615fe99d61dae0ef4a5195a6e767fa711e6fd | 57 | 3/95 | #154 MERGED | 3 | 0 | RETAINED |
| fix/pascal-v2-3-live-wiring | SUPERSEDED | 1cdd61f6a56908678713fd2833a3d9fc54a043f7 | 57 | 3/96 | #152 MERGED | 3 | 0 | RETAINED |
| fix/project-files-storage-policy-collision | SUPERSEDED | 94f408153c40d080e4807a09f00cac93e5b795e5 | 61 | 2/139 | #127 MERGED | 2 | 0 | RETAINED |
| fix/project-files-tenant-upload | SUPERSEDED | 9187325c3efa9550c67dcd95a3a2d141a1219fef | 61 | 3/140 | #126 MERGED | 3 | 0 | RETAINED |
| main | PROTECTED | e22a74d0c121a9a98a5d2bcfcf2ff912ecb25aa3 | 0 | 0/0 |  | 0 | 3 | RETAINED |
| ops/android-eas-quota-reset-check | UNMERGED VALUABLE | 0274f4a3101aeea2310b28db4f08135819a95552 | 57 | 2/96 | #151 CLOSED | 2 | 0 | RETAINED |
| ops/deploy-architecture-dwg-entry | SUPERSEDED | e179d56f613ab94aa9f9d345dadc7b515e45f096 | 57 | 1/105 | #142 MERGED | 0 | 0 | RETAINED |
| ops/deploy-pascal-3d-v2-3 | SUPERSEDED | f8c763f2f9c5574c6e7ec374f9abfb252cb3cc4c | 57 | 1/98 | #149 MERGED | 0 | 0 | RETAINED |
| ops/one-time-production-cad-gateway | PROTECTED | 538d5768a22d34d1deada9296eb0de71316f4423 | 58 | 0/110 | #138 MERGED | 0 | 0 | RETAINED |
| ops/pascal-v2-3-production-cutover | UNMERGED VALUABLE | 03a876ade1682f0ff72ab40107329ddabffd0729 | 57 | 1/95 | #153 CLOSED | 1 | 0 | RETAINED |
| ops/restore-main-deploy-lock | PROTECTED | 4be1bd63253ea3935fc63fb75ba381a9f0b63065 | 58 | 0/108 | #139 MERGED | 0 | 0 | RETAINED |
| ops/restore-main-deploy-lock-architecture | SUPERSEDED | b6559ee96cedcee4a34ec2c8638ef6312f7c5c7c | 57 | 1/104 | #143 MERGED | 0 | 0 | RETAINED |
| ops/restore-pascal-main-deploy-lock | SUPERSEDED | 3640f6f0285df4c8e2eddf1dfe23ec46fdc25342 | 57 | 1/97 | #150 MERGED | 0 | 0 | RETAINED |
| oss/pascal-architecture-poc | ACTIVE | 9a48f97e0151f754a17d23d65c1101ea9f3b2fbb | 65 | 36/153 | #111 OPEN | 36 | 1 | RETAINED |
| security/temporary-tooling-exception-20261030 | PROTECTED | c36de6d7a23133a1ca639b7b47255db29467846b | 5 | 12/18 | #176 MERGED | 12 | 12 | RETAINED |

## Deletions and reversibility

- `audit/ecosystem-integration-2026-08-30`: `e06e998ec699f8ad35bad98d24f251943d5c5c1f`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin e06e998ec699f8ad35bad98d24f251943d5c5c1f:refs/heads/audit/ecosystem-integration-2026-08-30`.
- `feat/ai-runtime-contract`: `d4f67e3101026efe7730b90be28dad2f37755125`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin d4f67e3101026efe7730b90be28dad2f37755125:refs/heads/feat/ai-runtime-contract`.
- `feat/architecture-3d-fidelity-v3`: `ac9d15953f07e591e5d45656a7fffa235d4f1b52`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin ac9d15953f07e591e5d45656a7fffa235d4f1b52:refs/heads/feat/architecture-3d-fidelity-v3`.
- `feat/architecture-openings-topology-v3-3`: `95990e13327c3f1a825bcc70d37c4c8b8ca9f10f`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin 95990e13327c3f1a825bcc70d37c4c8b8ca9f10f:refs/heads/feat/architecture-openings-topology-v3-3`.
- `feat/architecture-runtime-persistence`: `6be1c65a47a8b2df027a6c27db6c35bb3485e6e8`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin 6be1c65a47a8b2df027a6c27db6c35bb3485e6e8:refs/heads/feat/architecture-runtime-persistence`.
- `feat/architecture-wall-thickness-v3-2`: `5ac361adf4a66e8bedbd78bcea8c71f6480ca0b9`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin 5ac361adf4a66e8bedbd78bcea8c71f6480ca0b9:refs/heads/feat/architecture-wall-thickness-v3-2`.
- `fix/cad-fidelity-v2-4-provenance-gate`: `a23651608a51446a8df0e841a8e91ea112bf6532`. Zero unique commits; no live/open PR, deployment, automation or local worktree dependency. Restore: `git push origin a23651608a51446a8df0e841a8e91ea112bf6532:refs/heads/fix/cad-fidelity-v2-4-provenance-gate`.

## Valuable unmerged work

- fix/android-release-reproducible-ci-20261027: .github/workflows/basoul-phase-6-mobile-runtime.yml, mobile/package.json, mobile/scripts/patch-node-forge.mjs, mobile/scripts/test-security-patches.mjs, scripts/audit-mobile-production.mjs. Retained; no implementation discarded.
- fix/cad-layer-normalization-v2-5: features/architecture/cad-review-panel.tsx, packages/cad-ingestion/src/index.ts, tests/cad-ingestion.test.mjs. Retained; no implementation discarded.
- ops/android-eas-quota-reset-check: .github/workflows/basoul-android-preview-build.yml, .github/workflows/basoul-android-preview-status.yml. Retained; no implementation discarded.
- ops/pascal-v2-3-production-cutover: vercel.json. Retained; no implementation discarded.

## Open pull requests

- #163 Architecture Launch Readiness RC1: retained. 22 commits lack an equivalent patch in main; integration/obsolescence not established. No failing PR merged.
- #173 feat(tasks): five-state compatibility, migration and enforcement preparation: retained. 4 commits lack an equivalent patch in main; integration/obsolescence not established. No failing PR merged.
- #175 ci: propose path-aware Web and Android release gates: retained. 10 commits lack an equivalent patch in main; integration/obsolescence not established. No failing PR merged.
- #174 feat: preserve reconciled BASOUL OS workflows for review: retained. 7 commits lack an equivalent patch in main; integration/obsolescence not established. No failing PR merged.
- #132 Architecture review: Pascal safety gate + Architectural Understanding v5: retained. 17 commits lack an equivalent patch in main; integration/obsolescence not established. No failing PR merged.
- #111 PoC: Pascal architecture engine integration: retained. 36 commits lack an equivalent patch in main; integration/obsolescence not established. No failing PR merged.

## Per-branch evidence

### archive/codex-20260903-144057-YOSSEUF--OS

- Author/date: Yosseuf; 2026-07-28T16:32:42+03:00.
- Subject: feat: detect conservative opening candidates.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success.
- Unique branch-vs-merge-base files: CHANGELOG.md, TEST_CHECKLIST_v3.0.0-alpha.10.md, TEST_CHECKLIST_v3.0.0-alpha.11.md, TEST_CHECKLIST_v3.0.0-alpha.12.md, TEST_CHECKLIST_v3.0.0-alpha.13.md, TEST_CHECKLIST_v3.0.0-alpha.14.md, TEST_CHECKLIST_v3.0.0-alpha.15.md, TEST_CHECKLIST_v3.0.0-alpha.9.md, app/architecture-alpha6.css, app/page.tsx, docs/ARCHITECTURAL_INTELLIGENCE_ROADMAP.md, features/architecture/architecture-review-view.tsx, lib/architecture/plan-understanding-service.ts, lib/architecture/review-service.ts, lib/config/app-info.ts, mobile/App.tsx, mobile/app.json, mobile/package-lock.json, mobile/package.json, mobile/src/features/architecture/architecture-review-screen.tsx, mobile/src/services/workspace.ts, mobile/src/types/domain.ts, package.json, packages/architectural-intelligence/src/types.ts, scripts/check-release-consistency.mjs, supabase/functions/architectural-analyze/index.ts, supabase/migration_v3.0.0_alpha.11.sql, supabase/migration_v3.0.0_alpha.9.sql.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### archive/yvl-review-2026-07-31

- Author/date: Yosseuf; 2026-08-08T19:53:31+03:00.
- Subject: chore: align Expo patch version.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success.
- Unique branch-vs-merge-base files: .github/workflows/quality.yml, YVL_IMPLEMENTATION_REPORT_v1.0.md, design-system/yvl/CHANGELOG.md, design-system/yvl/GOVERNANCE.md, design-system/yvl/PRINCIPLES.md, design-system/yvl/README.md, design-system/yvl/VERSIONING.md, design-system/yvl/YVL_APPROVAL_CHECKLIST_v1.0.md, design-system/yvl/assets/README.md, design-system/yvl/branding/clear-space.md, design-system/yvl/branding/logo-system.md, design-system/yvl/branding/logo-usage.md, design-system/yvl/hud/README.md, design-system/yvl/hud/badges.md, design-system/yvl/hud/corners.md, design-system/yvl/hud/dividers.md, design-system/yvl/hud/frames.md, design-system/yvl/hud/glow-effects.md, design-system/yvl/hud/progress.md, design-system/yvl/iconography/README.md, design-system/yvl/iconography/icon-rules.md, design-system/yvl/illustration/README.md, design-system/yvl/illustration/cityscape.md, design-system/yvl/illustration/global-earth.md, design-system/yvl/illustration/light-trails.md, design-system/yvl/illustration/network.md, design-system/yvl/illustration/tech-schematics.md, design-system/yvl/motion/README.md, design-system/yvl/motion/micro-interactions.md, design-system/yvl/motion/transitions.md, design-system/yvl/patterns/README.md, design-system/yvl/patterns/circuit-lines.md, design-system/yvl/patterns/dot-matrix.md, design-system/yvl/patterns/gradient-streaks.md, design-system/yvl/patterns/hex-grid.md, design-system/yvl/patterns/radial-rings.md, design-system/yvl/schemas/README.md, design-system/yvl/schemas/colors.schema.json, design-system/yvl/schemas/motion.schema.json, design-system/yvl/schemas/radii.schema.json, design-system/yvl/schemas/shadows.schema.json, design-system/yvl/schemas/spacing.schema.json, design-system/yvl/schemas/typography.schema.json, design-system/yvl/showcase/README.md, design-system/yvl/showcase/index.html, design-system/yvl/showcase/showcase.css, design-system/yvl/social/linkedin.md, design-system/yvl/social/shared-rules.md, design-system/yvl/social/x.md, design-system/yvl/tokens/colors.json, design-system/yvl/tokens/motion.json, design-system/yvl/tokens/radii.json, design-system/yvl/tokens/shadows.json, design-system/yvl/tokens/spacing.json, design-system/yvl/tokens/typography.json, design-system/yvl/ui/README.md, design-system/yvl/ui/components.md, design-system/yvl/ui/states.md, mobile/package-lock.json, mobile/package.json, package-lock.json, package.json, packages/yvl-tokens/README.md, packages/yvl-tokens/generated/manifest.json, packages/yvl-tokens/generated/react-native.ts, packages/yvl-tokens/generated/tokens.ts, packages/yvl-tokens/generated/yvl.css, packages/yvl-tokens/package.json, packages/yvl-tokens/src/colors.ts, packages/yvl-tokens/src/index.ts, packages/yvl-tokens/src/motion.ts, packages/yvl-tokens/src/radii.ts, packages/yvl-tokens/src/spacing.ts, packages/yvl-tokens/src/typography.ts, scripts/audit-mobile-production.mjs, scripts/generate-yvl-tokens.mjs, scripts/validate-yvl-tokens.mjs, scripts/yvl-artifacts.mjs, tests/yvl-foundation.test.mjs, tests/yvl-review-layer.test.mjs, tsconfig.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### audit/ecosystem-integration-2026-08-30

- Author/date: Elshenawy Radwan; 2026-08-30T19:02:43+03:00.
- Subject: Audit: close safe quality-gate execution.
- Squash tree matches: 136.
- Exact-head CI: Vercel Preview Comments: success; verify-eas-build: success; build-ios-development: failure; Mobile quality: success; Web quality: success; runtime-validation: success; build-android-preview: failure.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### chore/architecture-launch-readiness-rc1

- Author/date: Elshenawy Radwan; 2026-09-05T22:43:08+03:00.
- Subject: test(mobile): lock approved BASOUL masthead and dashboard hierarchy.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; runtime-validation: success; verify-eas-build: failure; build-android-preview: failure.
- Unique branch-vs-merge-base files: .github/workflows/basoul-android-preview-build.yml, .github/workflows/basoul-android-preview-status.yml, .github/workflows/basoul-ios-development-build.yml, app/architecture/page.tsx, features/architecture/cad-review-panel.tsx, features/architecture/pascal-runtime-viewer.tsx, mobile/App.tsx, mobile/package-lock.json, mobile/package.json, mobile/src/components/Screen.tsx, mobile/src/features/administration/AdministrationScreen.tsx, mobile/src/features/auth/LoginScreen.tsx, mobile/src/features/dashboard/DashboardScreen.tsx, packages/ui-tokens/src/index.ts, tests/architecture-launch-readiness.test.mjs, tests/architecture-workspace-persistence-ui.test.mjs, tests/architecture-workspace.test.mjs, tests/cad-2d-opening-overlay.test.mjs, tests/cad-review-workspace.test.mjs, tests/cad-semantic-rooms.test.mjs, tests/pascal-cad-camera-fit.test.mjs, tests/pascal-cad-provenance-gate.test.mjs, tests/pascal-cad-semantic-integration.test.mjs, tests/pascal-cad-wall-coverage.test.mjs, tests/pascal-node-id-compatibility.test.mjs, tests/sidebar-navigation-wiring.test.mjs, tests/yvl-product-integration.test.mjs.
- Retained deployment IDs: dpl_DTUQakH2RAmyEsfSC4Ldn8bxUUy5.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### chore/commercial-readiness-cleanup

- Author/date: Elshenawy Radwan; 2026-08-28T03:21:59+03:00.
- Subject: test: align runtime authority assertion with canonical wording.
- Squash tree matches: 125.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; build-ios-development: failure; verify-eas-build: success; Web quality: success; runtime-validation: success; build-android-preview: failure.
- Unique branch-vs-merge-base files: README.md, README_AR.md, docs/operations/BASOUL_RUNTIME_REGISTRY_2026-08-28.md, mobile/app.json, tests/commercial-readiness-metadata.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### chore/vercel-preview-churn-prevention

- Author/date: Yosseuf; 2026-09-27T10:59:48+03:00.
- Subject: fix(vercel): scope ignore command to services.
- Squash tree matches: 164.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: scripts/vercel-ignore-build.mjs, tests/vercel-ignore-build.test.mjs, vercel.json.
- Retained deployment IDs: dpl_3xPFTk8tSDfwXBBT5W51zZdjF3g8, dpl_5DxJzfkaMDY8ZwqCrzqsucfozUxP.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ci/one-shot-android-preview-20261027

- Author/date: Elshenawy Radwan; 2026-10-27T03:20:38+03:00.
- Subject: ci(android): request one-shot preview APK build.
- Squash tree matches: 180.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; Mobile security (Android release blocker): success; verify-eas-build: success.
- Unique branch-vs-merge-base files: .github/android-preview-trigger-20261027.txt, .github/workflows/basoul-android-preview-build.yml.
- Retained deployment IDs: dpl_HvhoJ9TjFd2MbsfyRCeDxaNVK1qv, dpl_A6gwXmfom9dWzmVoUT9FFuuKkNXi.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/android-security-exception-closure-20261028

- Author/date: Yosseuf; 2026-10-28T16:39:47+03:00.
- Subject: fix(android): adopt upstream forge fix and eliminate security exceptions.
- Squash tree matches: 184.
- Exact-head CI: Web quality: success; Mobile quality: success; Mobile security (Android release blocker): success; compatibility: success; verify-eas-build: success; runtime-validation: success.
- Unique branch-vs-merge-base files: .github/workflows/basoul-phase-6-mobile-runtime.yml, docs/releases/ANDROID_SECURITY_CLOSURE_BUILD33_2026-10-28.md, mobile/app.json, mobile/package-lock.json, mobile/package.json, mobile/scripts/patch-node-forge.mjs, mobile/scripts/test-security-patches.mjs, scripts/audit-mobile-production.mjs, tests/android-audit-policy.test.mjs, tests/mobile-brand-identity.test.mjs, vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=true; Vercel setting=true.

### codex/five-state-task-compatibility

- Author/date: Yosseuf; 2026-10-12T13:59:27+03:00.
- Subject: security(tasks): harden transition permissions and audit integrity.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; runtime-validation: success; verify-eas-build: success.
- Unique branch-vs-merge-base files: app/api/tasks/transition/route.ts, app/api/workspace/[resource]/route.ts, app/page.tsx, docs/database/PR173_PHASE2_CAS_AUTH_VALIDATION.md, docs/database/PR173_PRODUCTION_SHAPED_HARDENING.md, docs/database/PR173_RELEASE_BLOCKER_VALIDATION.md, docs/database/proposed-task-review-enum.sql, docs/database/proposed-task-security-hardening.sql, docs/database/proposed-task-transition-enforcement.sql, docs/mobile/FIVE_STATE_TASK_CONTRACT_PLAN.md, features/global-search.tsx, lib/data/task-transition-client.ts, lib/types.ts, mobile/App.tsx, mobile/src/features/search/GlobalSearchScreen.tsx, mobile/src/features/tasks/TasksScreen.tsx, mobile/src/features/timeline/TimelineScreen.tsx, mobile/src/organizations/operation.ts, mobile/src/services/task-transitions.ts, mobile/src/services/workspace.ts, mobile/src/types/domain.ts, packages/shared-types/src/index.ts, packages/shared-types/src/task-status-contract.ts, packages/shared-types/src/task-transition-client.ts, scripts/validate-task-auth-http.mjs, scripts/validate-task-postgres.mjs, supabase/schema.sql, tests/fixtures/task-postgres-fixtures.sql, tests/fixtures/task-postgres-regression.sql, tests/fixtures/task-security-regression.sql, tests/mobile-organization-context.test.mjs, tests/task-cas-client.test.mjs, tests/task-release-blockers.test.mjs, tests/task-security-hardening.test.mjs, tests/task-status-compatibility.test.mjs, tests/task-status-contract.test.mjs.
- Retained deployment IDs: dpl_AXhyZL4RHU4QevB47GCvvpnh7b4S, dpl_HFYFYpqPPZnuqSfXffBmDbHvB7fF, dpl_Fa3woVMqRVpwiqMyXrdqSiXqhu24, dpl_9na4h9kpzQZnRWEkuG8BqxSgwWGJ, dpl_FkuQntWkmYWNqKzETSufh5UhWrYj, dpl_FBS7gXrS2YPve67X7dfZXugiuvNT, dpl_E669k7dwpmHGXqGvpwj8zng72qLe, dpl_ECqJdsQnguXqN3FBAv4yy4Xi1238.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/fix-crlf-camera-test

- Author/date: Yosseuf; 2026-10-04T11:38:22+03:00.
- Subject: fix: patch Next.js security and require deliberate EAS builds.
- Squash tree matches: 166.
- Exact-head CI: Vercel Preview Comments: success; verify-eas-build: success; Mobile quality: success; Web quality: success; runtime-validation: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_B1wTULM9cwSQ9CY4zWdcsZxG6hRo, dpl_AKEjHVx3o5XBYn6LaapGXqY9Hjji.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/login-keyboard-reachability

- Author/date: Yosseuf; 2026-10-08T12:52:54+03:00.
- Subject: fix(security): align SDK 57 and patch release dependencies.
- Squash tree matches: 170.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; runtime-validation: success; verify-eas-build: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_C2iUH7q6yVVoVBzxbvXpo1P7B8dN, dpl_A9WxR6S7TttvwcNaTkCcgyymojve.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/manual-runtime-validation

- Author/date: Yosseuf; 2026-10-05T15:23:38+03:00.
- Subject: ci(mobile): allow manual runtime validation without release builds.
- Squash tree matches: 168.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; runtime-validation: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_6RTUQrTRRduL6FVeepfPoiVFMmvX.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/mobile-brand-identity-remediation

- Author/date: Yosseuf; 2026-10-04T18:05:06+03:00.
- Subject: test(brand): tolerate Windows line endings in generated CSS check.
- Squash tree matches: 167.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; verify-eas-build: success; runtime-validation: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_ATk27ZfAiWGyyao3c2idmpXLARsm, dpl_9nbiyvg5QtCRaiKrumFaD8QYK1K1.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/mobile-logout-access

- Author/date: Yosseuf; 2026-10-06T13:09:09+03:00.
- Subject: fix(mobile): expose account logout and clear stale session state.
- Squash tree matches: 169.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; verify-eas-build: success; runtime-validation: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_ATUvkZgNDMoR1z8HzNMSurPSFkWm.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/mobile-mutation-context-safety

- Author/date: Yosseuf; 2026-10-10T18:27:04+03:00.
- Subject: fix(mobile): preserve tenant context on ordinary mutation errors.
- Squash tree matches: 172.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; verify-eas-build: success; runtime-validation: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_4jiQ8qtAQReYaf72eumXULTsX8nA.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/mobile-organization-context

- Author/date: Yosseuf; 2026-10-09T00:57:22+03:00.
- Subject: fix(mobile): validate and isolate authenticated organization context.
- Squash tree matches: 171.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; verify-eas-build: success; Web quality: success; runtime-validation: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_FdERTPK3nB9kaHyGcbnUSZWpkrDv.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### codex/path-aware-release-gates

- Author/date: Yosseuf; 2026-10-23T21:45:05+03:00.
- Subject: docs: publish release blocker evidence and security design.
- Squash tree matches: none.
- Exact-head CI: Web release gate: success; Android release gate: failure; Mobile quality: failure; Web quality: success; Release scope: success.
- Unique branch-vs-merge-base files: .github/workflows/basoul-android-preview-build.yml, .github/workflows/quality.yml, .nvmrc, app/api/platform/organizations/route.ts, app/api/tasks/transition/route.ts, app/api/workspace/[resource]/route.ts, app/layout.tsx, app/page.tsx, components/organizations/organization-provider.tsx, docs/database/HISTORICAL_MIGRATION_ORDER.md, docs/database/PR173_PHASE2_CAS_AUTH_VALIDATION.md, docs/database/PR173_PRODUCTION_SHAPED_HARDENING.md, docs/database/PR173_RELEASE_BLOCKER_VALIDATION.md, docs/database/TASK_REASON_UX.md, docs/database/TASK_TRANSITION_CONFIRMATION.md, docs/database/TASK_WORKFLOW_INSTALL_CANDIDATE.sql, docs/database/proposed-batch3-completion.sql, docs/database/proposed-project-workflows.sql, docs/database/proposed-task-edit-cas.sql, docs/database/proposed-task-notifications.sql, docs/database/proposed-task-review-enum.sql, docs/database/proposed-task-rollout-gate.sql, docs/database/proposed-task-security-hardening.sql, docs/database/proposed-task-transition-enforcement.sql, docs/database/proposed-team-collaboration.sql, docs/database/web-rc-preflight.sql, docs/mobile/FIVE_STATE_TASK_CONTRACT_PLAN.md, docs/operations/ANDROID_SECURITY_DESIGN.md, docs/operations/ANDROID_SECURITY_ROOT_CAUSE.md, docs/operations/BASOUL_OS_PRODUCT_ROADMAP.md, docs/operations/BASOUL_OS_REPOSITORY_RECONCILIATION.md, docs/operations/BATCH_1_ORGANIZATION_CONTEXT.md, docs/operations/BATCH_2_PROJECT_WORKFLOWS.md, docs/operations/BATCH_3_COMPLETION_AND_WEB_RC.md, docs/operations/BATCH_3_TEAM_COLLABORATION.md, docs/operations/CI_BOOTSTRAP_REMEDIATION.md, docs/operations/DEVELOPMENT_READINESS_2026-10-19.md, docs/operations/FINAL_BLOCKER_RESOLUTION_2026-10-20.md, docs/operations/FINAL_RELEASE_CHECKLIST.md, docs/operations/FINAL_RELEASE_READINESS_2026-10-20.md, docs/operations/LOCAL_ANDROID_VALIDATION.md, docs/operations/LOCAL_CHECKPOINT_INVENTORY_2026-10-20.md, docs/operations/LOCAL_DEVELOPMENT_RECOVERY.md, docs/operations/LOCAL_VALIDATION_COMPLETION.md, docs/operations/PATH_AWARE_RELEASE_GATES.md, docs/operations/SECURITY_BLOCKER_ANALYSIS_2026-10-20.md, docs/operations/SECURITY_GATE_REMEDIATION.md, docs/operations/WEB_EXTERNAL_PREFLIGHT.md, docs/operations/WEB_RC_FINALIZATION.md, docs/operations/WEB_RELEASE_READINESS_FINAL.md, docs/operations/WEB_SAFE_INTEGRATION_DECISION.md, features/architecture/architecture-persistence-client.ts, features/architecture/cad-review-panel.tsx, features/architecture/pascal-runtime-viewer.tsx, features/architecture/pdf-image-review-view-source.tsx, features/global-search.tsx, features/notifications/notifications-view.tsx, features/tasks/task-reason-confirmation.tsx, lib/architecture/drawing-service.ts, lib/architecture/plan-understanding-service.ts, lib/architecture/review-comment-service.ts, lib/architecture/review-service.ts, lib/auth/authorized-workspace.ts, lib/data/authorized-workspace-client.ts, lib/data/os-repository.ts, lib/data/task-transition-client.ts, lib/data/workspace-service.ts, lib/events/activity-service.ts, lib/notifications/notification-service.ts, lib/organizations/active-context.ts, lib/organizations/administration.ts, lib/organizations/request.ts, lib/organizations/scoped-client.ts, lib/organizations/settings.ts, lib/organizations/workspace-selection.ts, lib/projects/file-recovery.ts, lib/projects/project-file-service.ts, lib/projects/project-note-service.ts, lib/supabase.ts, lib/types.ts, mobile/App.tsx, mobile/package-lock.json, mobile/package.json, mobile/src/config/supabase.ts, mobile/src/features/architecture/architecture-review-screen.tsx, mobile/src/features/auth/LoginScreen.tsx, mobile/src/features/create/CreateTaskScreen.tsx, mobile/src/features/dashboard/DashboardScreen.tsx, mobile/src/features/notifications/NotificationsScreen.tsx, mobile/src/features/projects/ProjectsScreen.tsx, mobile/src/features/search/GlobalSearchScreen.tsx, mobile/src/features/tasks/TaskDetailsScreen.tsx, mobile/src/features/tasks/TaskReasonConfirmation.tsx, mobile/src/features/tasks/TasksScreen.tsx, mobile/src/features/timeline/TimelineScreen.tsx, mobile/src/organizations/OrganizationBar.tsx, mobile/src/organizations/context.ts, mobile/src/organizations/operation.ts, mobile/src/services/organizations.ts, mobile/src/services/task-edits.ts, mobile/src/services/task-transitions.ts, mobile/src/services/workspace.ts, mobile/src/types/domain.ts, package-lock.json, package.json, packages/services/src/organization-guard.ts, packages/shared-types/src/finding-decision.ts, packages/shared-types/src/index.ts, packages/shared-types/src/organization-scope.ts, packages/shared-types/src/project-conversion.ts, packages/shared-types/src/task-create-transport.ts, packages/shared-types/src/task-edit-contract.ts, packages/shared-types/src/task-notifications.ts, packages/shared-types/src/task-status-contract.ts, packages/shared-types/src/task-transition-client.ts, packages/shared-types/src/task-transition-reason.ts, scripts/audit-mobile-production.mjs, scripts/project-storage-fixture.mjs, scripts/release-scope.mjs, scripts/start-local-android.ps1, scripts/task-fixture-gateway.mjs, scripts/task-historical-manifest.mjs, scripts/validate-invitation-mail-local.mjs, scripts/validate-organization-local.mjs, scripts/validate-project-workflows-local.mjs, scripts/validate-task-auth-http.mjs, scripts/validate-task-browser-local.mjs, scripts/validate-task-historical-local.mjs, scripts/validate-task-http-local.mjs, scripts/validate-task-mobile-local.mjs, scripts/validate-task-postgres.mjs, scripts/validate-team-collaboration-local.mjs, scripts/with-node22.ps1, supabase/functions/architectural-analyze-v2/index.ts, supabase/functions/organization-admin/authorization.ts, supabase/functions/organization-admin/index.ts, supabase/schema.sql, tests/fixtures/historical-host-services.sql, tests/fixtures/historical-storage-catalog.sql, tests/fixtures/task-edit-regression.sql, tests/fixtures/task-notification-regression.sql, tests/fixtures/task-postgres-fixtures.sql, tests/fixtures/task-postgres-regression.sql, tests/fixtures/task-security-regression.sql, tests/mobile-organization-context.test.mjs, tests/mobile-security-gate.test.mjs, tests/mobile-task-edit.test.mjs, tests/organization-foundation.test.mjs, tests/organization-scope.test.mjs, tests/project-file-upload-integrity.test.mjs, tests/project-workflow-recovery.test.mjs, tests/release-scope.test.mjs, tests/rls-write-boundary.test.mjs, tests/task-cas-client.test.mjs, tests/task-historical-manifest.test.mjs, tests/task-readiness.test.mjs, tests/task-release-blockers.test.mjs, tests/task-release-policy.test.mjs, tests/task-security-hardening.test.mjs, tests/task-status-compatibility.test.mjs, tests/task-status-contract.test.mjs, tests/task-transition-confirmation.test.mjs, tests/task-transition-reason.test.mjs, tests/team-collaboration.test.mjs, tests/tenant-owner-onboarding.test.mjs, vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=true; Vercel setting=false.

### codex/project-files-rls-security

- Author/date: Yosseuf; 2026-10-26T12:55:40+03:00.
- Subject: fix: order append-only workspace resources by creation time.
- Squash tree matches: 177.
- Exact-head CI: Vercel Preview Comments: success; Mobile security (Android release blocker): failure; Mobile quality: success; Web quality: success; verify-eas-build: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_AGKsxtiiwinPwWawHoTFWTh6r9dU, dpl_3XW4ZqZ6E5pvxTJ6tMn7atjATHCH, dpl_Ax1pAAWtNLjypSJMKD46wn1v5AiE, dpl_322qWHMywscGAhf2MkkNyCYFcGsq, dpl_6iyyPZNDNmrvyXgbhGkTBf7Hd7rk, dpl_5nbJ74hvoCkfgeuyxAvD9MDWPJwe, dpl_Sazr4MZm3t5Yqt81PXjfFksXCLR8, dpl_xoWbFv2JQ7qPfGDmMhCc5mj4uzuE, dpl_4vZQfXoan7iUdejhXfrSQCxvBTJy, dpl_6z2LEBe6ETzo36CJjrVHbuEgg8dw, dpl_4gSF8Vqeiw74cUkbcJjFbnRet4Ld, dpl_BKYPHrjAJeRrGwvMFpMquC79L1pq, dpl_H2RL5yCcxXdqG6H1j6yG6g8B5QV5.
- Automation/worktree: no exact main workflow reference; worktree=true; Vercel setting=false.

### codex/repository-reconciliation

- Author/date: Yosseuf; 2026-10-23T17:41:04+03:00.
- Subject: feat: preserve reconciled BASOUL OS integration for review.
- Squash tree matches: none.
- Exact-head CI: Mobile quality: failure; Web quality: success; verify-eas-build: success; runtime-validation: failure.
- Unique branch-vs-merge-base files: .github/workflows/basoul-android-preview-build.yml, .nvmrc, app/api/platform/organizations/route.ts, app/api/tasks/transition/route.ts, app/api/workspace/[resource]/route.ts, app/layout.tsx, app/page.tsx, components/organizations/organization-provider.tsx, docs/database/HISTORICAL_MIGRATION_ORDER.md, docs/database/PR173_PHASE2_CAS_AUTH_VALIDATION.md, docs/database/PR173_PRODUCTION_SHAPED_HARDENING.md, docs/database/PR173_RELEASE_BLOCKER_VALIDATION.md, docs/database/TASK_REASON_UX.md, docs/database/TASK_TRANSITION_CONFIRMATION.md, docs/database/TASK_WORKFLOW_INSTALL_CANDIDATE.sql, docs/database/proposed-batch3-completion.sql, docs/database/proposed-project-workflows.sql, docs/database/proposed-task-edit-cas.sql, docs/database/proposed-task-notifications.sql, docs/database/proposed-task-review-enum.sql, docs/database/proposed-task-rollout-gate.sql, docs/database/proposed-task-security-hardening.sql, docs/database/proposed-task-transition-enforcement.sql, docs/database/proposed-team-collaboration.sql, docs/database/web-rc-preflight.sql, docs/mobile/FIVE_STATE_TASK_CONTRACT_PLAN.md, docs/operations/BASOUL_OS_PRODUCT_ROADMAP.md, docs/operations/BASOUL_OS_REPOSITORY_RECONCILIATION.md, docs/operations/BATCH_1_ORGANIZATION_CONTEXT.md, docs/operations/BATCH_2_PROJECT_WORKFLOWS.md, docs/operations/BATCH_3_COMPLETION_AND_WEB_RC.md, docs/operations/BATCH_3_TEAM_COLLABORATION.md, docs/operations/DEVELOPMENT_READINESS_2026-10-19.md, docs/operations/FINAL_BLOCKER_RESOLUTION_2026-10-20.md, docs/operations/FINAL_RELEASE_CHECKLIST.md, docs/operations/FINAL_RELEASE_READINESS_2026-10-20.md, docs/operations/LOCAL_ANDROID_VALIDATION.md, docs/operations/LOCAL_CHECKPOINT_INVENTORY_2026-10-20.md, docs/operations/LOCAL_DEVELOPMENT_RECOVERY.md, docs/operations/LOCAL_VALIDATION_COMPLETION.md, docs/operations/SECURITY_BLOCKER_ANALYSIS_2026-10-20.md, docs/operations/SECURITY_GATE_REMEDIATION.md, docs/operations/WEB_RC_FINALIZATION.md, features/architecture/architecture-persistence-client.ts, features/architecture/cad-review-panel.tsx, features/architecture/pascal-runtime-viewer.tsx, features/architecture/pdf-image-review-view-source.tsx, features/global-search.tsx, features/notifications/notifications-view.tsx, features/tasks/task-reason-confirmation.tsx, lib/architecture/drawing-service.ts, lib/architecture/plan-understanding-service.ts, lib/architecture/review-comment-service.ts, lib/architecture/review-service.ts, lib/auth/authorized-workspace.ts, lib/data/authorized-workspace-client.ts, lib/data/os-repository.ts, lib/data/task-transition-client.ts, lib/data/workspace-service.ts, lib/events/activity-service.ts, lib/notifications/notification-service.ts, lib/organizations/active-context.ts, lib/organizations/administration.ts, lib/organizations/request.ts, lib/organizations/scoped-client.ts, lib/organizations/settings.ts, lib/organizations/workspace-selection.ts, lib/projects/file-recovery.ts, lib/projects/project-file-service.ts, lib/projects/project-note-service.ts, lib/supabase.ts, lib/types.ts, mobile/App.tsx, mobile/package-lock.json, mobile/package.json, mobile/src/config/supabase.ts, mobile/src/features/architecture/architecture-review-screen.tsx, mobile/src/features/auth/LoginScreen.tsx, mobile/src/features/create/CreateTaskScreen.tsx, mobile/src/features/dashboard/DashboardScreen.tsx, mobile/src/features/notifications/NotificationsScreen.tsx, mobile/src/features/projects/ProjectsScreen.tsx, mobile/src/features/search/GlobalSearchScreen.tsx, mobile/src/features/tasks/TaskDetailsScreen.tsx, mobile/src/features/tasks/TaskReasonConfirmation.tsx, mobile/src/features/tasks/TasksScreen.tsx, mobile/src/features/timeline/TimelineScreen.tsx, mobile/src/organizations/OrganizationBar.tsx, mobile/src/organizations/context.ts, mobile/src/organizations/operation.ts, mobile/src/services/organizations.ts, mobile/src/services/task-edits.ts, mobile/src/services/task-transitions.ts, mobile/src/services/workspace.ts, mobile/src/types/domain.ts, package-lock.json, package.json, packages/services/src/organization-guard.ts, packages/shared-types/src/finding-decision.ts, packages/shared-types/src/index.ts, packages/shared-types/src/organization-scope.ts, packages/shared-types/src/project-conversion.ts, packages/shared-types/src/task-create-transport.ts, packages/shared-types/src/task-edit-contract.ts, packages/shared-types/src/task-notifications.ts, packages/shared-types/src/task-status-contract.ts, packages/shared-types/src/task-transition-client.ts, packages/shared-types/src/task-transition-reason.ts, scripts/audit-mobile-production.mjs, scripts/project-storage-fixture.mjs, scripts/start-local-android.ps1, scripts/task-fixture-gateway.mjs, scripts/task-historical-manifest.mjs, scripts/validate-invitation-mail-local.mjs, scripts/validate-organization-local.mjs, scripts/validate-project-workflows-local.mjs, scripts/validate-task-auth-http.mjs, scripts/validate-task-browser-local.mjs, scripts/validate-task-historical-local.mjs, scripts/validate-task-http-local.mjs, scripts/validate-task-mobile-local.mjs, scripts/validate-task-postgres.mjs, scripts/validate-team-collaboration-local.mjs, scripts/with-node22.ps1, supabase/functions/architectural-analyze-v2/index.ts, supabase/functions/organization-admin/authorization.ts, supabase/functions/organization-admin/index.ts, supabase/schema.sql, tests/fixtures/historical-host-services.sql, tests/fixtures/historical-storage-catalog.sql, tests/fixtures/task-edit-regression.sql, tests/fixtures/task-notification-regression.sql, tests/fixtures/task-postgres-fixtures.sql, tests/fixtures/task-postgres-regression.sql, tests/fixtures/task-security-regression.sql, tests/mobile-organization-context.test.mjs, tests/mobile-security-gate.test.mjs, tests/mobile-task-edit.test.mjs, tests/organization-foundation.test.mjs, tests/organization-scope.test.mjs, tests/project-file-upload-integrity.test.mjs, tests/project-workflow-recovery.test.mjs, tests/rls-write-boundary.test.mjs, tests/task-cas-client.test.mjs, tests/task-historical-manifest.test.mjs, tests/task-readiness.test.mjs, tests/task-release-blockers.test.mjs, tests/task-release-policy.test.mjs, tests/task-security-hardening.test.mjs, tests/task-status-compatibility.test.mjs, tests/task-status-contract.test.mjs, tests/task-transition-confirmation.test.mjs, tests/task-transition-reason.test.mjs, tests/team-collaboration.test.mjs, tests/tenant-owner-onboarding.test.mjs, vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### docs/android-4-0-0-build32-release-prep-20261027

- Author/date: Yosseuf; 2026-10-27T22:19:41+03:00.
- Subject: docs(release): verify Android build 32 and preserve reviewed repository work.
- Squash tree matches: 182.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; Mobile security (Android release blocker): success; runtime-validation: success; verify-eas-build: success.
- Unique branch-vs-merge-base files: README.md, docs/assets/screenshots/android-4.0.0-build32-login.png, docs/operations/REPOSITORY_RELEASE_CLEANUP_BUILD32.md, docs/releases/ANDROID_V4_0_0_BUILD32_2026-10-27.md, mobile/README.md.
- Retained deployment IDs: dpl_9B4KR4ARGPJxi7Cu2jYcWNrgaAjE, dpl_6Vgr4vVmucHcYVLRLEd2ECVJLNPN, dpl_HEcVRnYzHDrsrgVHGKHDrLGzLWyt, dpl_7dHGaDGhZcf9nsHeaZ5HjdnYUEjR.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### docs/android-build32-physical-smoke-20261028

- Author/date: Elshenawy Radwan; 2026-10-28T16:20:26+03:00.
- Subject: docs(release): record physical Android smoke tests and unresolved security gates.
- Squash tree matches: 183.
- Exact-head CI: Vercel Preview Comments: success; Mobile security (Android release blocker): success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: docs/releases/ANDROID_V4_0_0_BUILD32_2026-10-27.md.
- Retained deployment IDs: dpl_F9nhamBa2qyCw7hp963S1kCA3Pyz.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### docs/ecosystem-readiness-2026-08-31

- Author/date: Elshenawy Radwan; 2026-08-31T22:15:42+03:00.
- Subject: Audit: record post-cutover ecosystem readiness.
- Squash tree matches: 140.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: docs/operations/BASOUL_ECOSYSTEM_READINESS_2026-08-31.md.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### experiment/zod4-expo-cli-compat-20261027

- Author/date: Elshenawy Radwan; 2026-10-27T03:14:59+03:00.
- Subject: fix(android): remove stale Zod exception reference from audit output.
- Squash tree matches: 179.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; Mobile security (Android release blocker): success; runtime-validation: success; verify-eas-build: success; compatibility: success.
- Unique branch-vs-merge-base files: .github/workflows/basoul-phase-6-mobile-runtime.yml, .github/workflows/experiment-zod4-compat.yml, mobile/package-lock.json, mobile/package.json, mobile/scripts/patch-node-forge.mjs, mobile/scripts/test-security-patches.mjs, scripts/audit-mobile-production.mjs.
- Retained deployment IDs: dpl_FeVKosKfN9NLTRwbMYf2AYsjTLMh, dpl_GDZ7an9A7stp55w22V9b3M3UjUpw, dpl_GvypGniQTn54C6XvuhpFKjSSCPBa, dpl_A5Qs92uuEiTrPvqXQDkED2SG7Qh6, dpl_JCTcoHuM1gSxCtMkuEVmEHL88fNj, dpl_EUhQTTd1SMfAK3Zd3Sqv5RDXgGfU, dpl_59Wg4mQdrmwScfpVFAYFpxepq8SV, dpl_9px3qD4cufEHgUJR4xo3HvXuB6ET, dpl_Az3ZHQy3wZvHP8mWVEVddzVJQAZJ.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/ai-runtime-contract

- Author/date: Elshenawy Radwan; 2026-08-30T19:08:39+03:00.
- Subject: Audit: record AI runtime contract and distribution decision gate.
- Squash tree matches: 137.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-3d-fidelity-v3

- Author/date: Elshenawy Radwan; 2026-09-02T02:25:12+03:00.
- Subject: fix(architecture): make editor responsive on mobile.
- Squash tree matches: 160.
- Exact-head CI: Vercel Preview Comments: success; Web quality: failure; Mobile quality: failure.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-ai-tools

- Author/date: Elshenawy Radwan; 2026-08-24T04:02:20+03:00.
- Subject: test: assert missing wall is rejected.
- Squash tree matches: 115.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: packages/architecture-engine/src/index.ts, packages/architecture-engine/src/tools.ts, tests/architecture-ai-tools.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-direct-manipulation

- Author/date: Elshenawy Radwan; 2026-08-28T02:59:07+03:00.
- Subject: fix(architecture): preserve live editor compatibility status.
- Squash tree matches: 124.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: app/architecture/page.tsx, features/architecture/architecture-editor-panel.tsx, features/architecture/pascal-runtime-viewer.tsx, features/architecture/pascal-scene-editing.ts, tests/architecture-direct-manipulation.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-editing-foundation

- Author/date: Elshenawy Radwan; 2026-08-28T02:45:13+03:00.
- Subject: test(architecture): align persistence contract with production activation.
- Squash tree matches: 123.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: app/architecture/page.tsx, features/architecture/architecture-editor-panel.tsx, features/architecture/pascal-scene-editing.ts, tests/architecture-editing-foundation.test.mjs, tests/architecture-workspace-persistence-ui.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-foundation-v2

- Author/date: Elshenawy Radwan; 2026-08-24T03:45:37+03:00.
- Subject: fix(architecture): keep engine source outside npm workspace lock.
- Squash tree matches: 112.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: packages/architecture-engine/src/index.ts, tests/architecture-foundation.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-geometry-reconciliation

- Author/date: Elshenawy Radwan; 2026-08-28T05:47:48+03:00.
- Subject: test(architecture): guard Pascal reconciliation boundary.
- Squash tree matches: 131.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: features/architecture/pascal-reconciled-scene.ts, packages/architecture-engine/src/index.ts, packages/architecture-engine/src/reconciliation.ts, tests/architecture-geometry-reconciliation.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-hybrid-parser

- Author/date: Elshenawy Radwan; 2026-08-28T05:21:03+03:00.
- Subject: test(architecture): guard hybrid AutoCAD PDF analysis.
- Squash tree matches: 130.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: supabase/functions/architectural-analyze-v2/deno.json, supabase/functions/architectural-analyze-v2/index.ts, tests/architectural-hybrid-parser.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-ifc-gateway

- Author/date: Elshenawy Radwan; 2026-08-24T03:59:00+03:00.
- Subject: test: assert IFC diagnostics remain observable.
- Squash tree matches: 114.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: packages/architecture-engine/src/ifc.ts, packages/architecture-engine/src/index.ts, tests/architecture-ifc-gateway.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-openings-topology-v3-3

- Author/date: Elshenawy Radwan; 2026-09-04T15:29:19+03:00.
- Subject: test(cad): lock launch-readiness provenance and diagnostics.
- Squash tree matches: 162.
- Exact-head CI: Vercel Preview Comments: success; Web quality: failure; Mobile quality: failure; build-and-smoke: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-pascal-runtime

- Author/date: Yosseuf; 2026-08-28T01:49:31+03:00.
- Subject: fix(architecture): render validated Pascal starter scene.
- Squash tree matches: 118.
- Exact-head CI: Vercel Preview Comments: success; build-ios-development: failure; build-android-preview: failure; Web quality: success; runtime-validation: success; Mobile quality: success; verify-eas-build: success.
- Unique branch-vs-merge-base files: app/architecture/page.tsx, features/architecture/pascal-bootstrap.ts, features/architecture/pascal-runtime-viewer.tsx, mobile/package-lock.json, mobile/package.json, next.config.mjs, package-lock.json, package.json, scripts/analyze-bundle.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-persistence

- Author/date: Elshenawy Radwan; 2026-08-24T03:55:57+03:00.
- Subject: feat: export architecture persistence.
- Squash tree matches: 113.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: packages/architecture-engine/src/index.ts, packages/architecture-engine/src/persistence.ts, supabase/migrations/20260824004500_architecture_scenes.sql, tests/architecture-persistence.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-review-pascal-preview

- Author/date: Elshenawy Radwan; 2026-08-28T07:06:34+03:00.
- Subject: fix(architecture): load mobile review overrides.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: app/architecture-mobile.css, app/layout.tsx, features/architecture/architecture-analysis-3d-preview.tsx, features/architecture/architecture-analysis-3d-runtime.tsx, features/architecture/plan-overlay-viewer.tsx, lib/architecture/plan-understanding-service.ts, supabase/functions/architectural-analyze-v2/index.ts, supabase/migrations/20260828034500_architectural_plan_element_types_v4.sql, supabase/migrations/20260828070500_architecture_review_score_precision_v4.sql, tests/architectural-hybrid-parser.test.mjs, tests/architectural-understanding-v4.test.mjs, tests/architecture-review-pascal-preview.test.mjs.
- Retained deployment IDs: dpl_2GvAd2d7HjDU1DnZwR4xVK5n2rKc.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-runtime-persistence

- Author/date: Elshenawy Radwan; 2026-08-28T01:59:42+03:00.
- Subject: feat: activate Pascal 3D runtime in BASOUL Architecture.
- Squash tree matches: none.
- Exact-head CI: Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-runtime-persistence-v2

- Author/date: Elshenawy Radwan; 2026-08-28T02:03:49+03:00.
- Subject: feat(architecture): route architecture API through request proxy.
- Squash tree matches: 119.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: app/api/architecture/scene/route.ts, proxy.ts, tests/architecture-runtime-persistence.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-wall-thickness-v3-2

- Author/date: Elshenawy Radwan; 2026-09-04T06:19:03+03:00.
- Subject: test(architecture): lock Pascal wall thickness materialization.
- Squash tree matches: 161.
- Exact-head CI: Vercel Preview Comments: success; Web quality: failure; Mobile quality: failure.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-workspace

- Author/date: Elshenawy Radwan; 2026-08-24T04:05:34+03:00.
- Subject: test: cover architecture workspace safety boundary.
- Squash tree matches: 117.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: app/architecture/page.tsx, tests/architecture-workspace.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/architecture-workspace-persistence-ui

- Author/date: Elshenawy Radwan; 2026-08-28T02:13:30+03:00.
- Subject: fix(architecture): preserve IFC readiness contract.
- Squash tree matches: 120.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: app/architecture/page.tsx, features/architecture/architecture-persistence-client.ts, features/architecture/pascal-runtime-viewer.tsx, tests/architecture-workspace-persistence-ui.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/cad-fidelity-v2-4-wall-coverage

- Author/date: Elshenawy Radwan; 2026-09-01T20:28:48+03:00.
- Subject: test(architecture): model v2.4 fidelity as additive gate.
- Squash tree matches: 156.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_BvNzX9BdTYUgUE3gDpLiF2XFeFUA.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/cad-floor-graph-v2

- Author/date: Elshenawy Radwan; 2026-09-01T00:32:56+03:00.
- Subject: Test: guard CAD Floor Graph v2 semantics.
- Squash tree matches: 144.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; build-and-smoke: success.
- Unique branch-vs-merge-base files: packages/cad-ingestion/src/floor-graph.ts, tests/cad-ingestion.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/cad-gateway-vercel-service

- Author/date: Elshenawy Radwan; 2026-08-28T22:10:52+03:00.
- Subject: test(cad): remove preview smoke route after DWG verification.
- Squash tree matches: 135.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: failure; Web quality: success; build-and-smoke: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/cad-ingestion-v1

- Author/date: Elshenawy Radwan; 2026-08-28T21:19:11+03:00.
- Subject: test(cad): cover outer shell filtering and Pascal CAD adapter.
- Squash tree matches: 133.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: failure; build-and-smoke: success.
- Unique branch-vs-merge-base files: .github/workflows/cad-gateway.yml, docs/CAD_INGESTION_V1.md, features/architecture/pascal-cad-scene.ts, packages/cad-ingestion/src/floor-graph.ts, packages/cad-ingestion/src/index.ts, tests/cad-ingestion.test.mjs, tools/cad-ingestion/Dockerfile, tools/cad-ingestion/cad_ingest.py, tools/cad-ingestion/requirements.txt.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/cad-review-overlay

- Author/date: Elshenawy Radwan; 2026-08-28T21:40:24+03:00.
- Subject: fix(architecture): restore engine boundary status markers.
- Squash tree matches: 134.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: failure; Web quality: success.
- Unique branch-vs-merge-base files: app/api/architecture/cad/ingest/route.ts, app/architecture/page.tsx, features/architecture/cad-review-panel.tsx, tests/cad-review-workspace.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/opening-hosting-v2-1

- Author/date: Elshenawy Radwan; 2026-09-01T00:48:45+03:00.
- Subject: Test: guard INSERT-footprint opening hosting v2.1.
- Squash tree matches: 145.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; build-and-smoke: success; Web quality: success.
- Unique branch-vs-merge-base files: packages/cad-ingestion/src/floor-graph.ts, tests/cad-ingestion.test.mjs, tools/cad-ingestion/cad_ingest.py.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/pascal-3d-semantic-integration-v2-3

- Author/date: Elshenawy Radwan; 2026-09-01T02:27:48+03:00.
- Subject: test(architecture): cover visible semantic room labels.
- Squash tree matches: 148.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: features/architecture/pascal-cad-scene.ts, features/architecture/pascal-cad-semantic-scene.ts, features/architecture/pascal-runtime-viewer.tsx, tests/pascal-cad-semantic-integration.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/semantic-room-binding-v2-2

- Author/date: Elshenawy Radwan; 2026-09-01T02:00:13+03:00.
- Subject: test(cad): cover semantic room recovery before Pascal.
- Squash tree matches: 147.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; build-and-smoke: success.
- Unique branch-vs-merge-base files: features/architecture/pascal-cad-scene.ts, packages/cad-ingestion/src/index.ts, packages/cad-ingestion/src/semantic-rooms.ts, tests/cad-semantic-rooms.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### feat/shx-arabic-decoding

- Author/date: Elshenawy Radwan; 2026-09-01T01:23:13+03:00.
- Subject: Test: preserve room-label compatibility marker.
- Squash tree matches: 146.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; build-and-smoke: success.
- Unique branch-vs-merge-base files: packages/cad-ingestion/src/index.ts, tests/cad-shx-decoding.test.mjs, tools/cad-ingestion/Dockerfile, tools/cad-ingestion/Dockerfile.vercel, tools/cad-ingestion/cad_ingest.py, tools/cad-ingestion/shx_decode.py.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/android-eas-node-forge-idempotent-20261027

- Author/date: Elshenawy Radwan; 2026-10-27T16:19:43+03:00.
- Subject: fix(security): match npm audit current direct node-forge advisory reporting.
- Squash tree matches: 181.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; Mobile security (Android release blocker): success; verify-eas-build: success; runtime-validation: success.
- Unique branch-vs-merge-base files: mobile/scripts/patch-node-forge.mjs, mobile/scripts/test-security-patches.mjs, scripts/audit-mobile-production.mjs.
- Retained deployment IDs: dpl_HhJ6GuBgNTcKWF2irkLyHjJXjAhe, dpl_5NSNfjYTG6t5UrW8x45inEbeX2qg, dpl_Cyf1gnLDUUZN4qNm61t4kvTGySyC.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/android-launch-gate-20260926

- Author/date: Elshenawy Radwan; 2026-09-26T17:41:06+03:00.
- Subject: test(architecture): assert typed door/window overlay contract.
- Squash tree matches: 165.
- Exact-head CI: Vercel Preview Comments: success; verify-eas-build: success; runtime-validation: success; Mobile quality: success; build-ios-development: failure; build-android-preview: failure; Web quality: success.
- Unique branch-vs-merge-base files: app/architecture/page.tsx, features/architecture/pascal-runtime-viewer.tsx, mobile/package-lock.json, mobile/package.json, package-lock.json, package.json, tests/architecture-workspace-persistence-ui.test.mjs, tests/architecture-workspace.test.mjs, tests/cad-2d-opening-overlay.test.mjs, tests/cad-review-workspace.test.mjs, tests/cad-semantic-rooms.test.mjs, tests/pascal-cad-provenance-gate.test.mjs, tests/pascal-cad-semantic-integration.test.mjs, tests/pascal-cad-wall-coverage.test.mjs, tests/pascal-node-id-compatibility.test.mjs.
- Retained deployment IDs: dpl_7pA1xsTifgnnmCFsq7z69JbV491i, dpl_4bZNYjJF6BV2eNkKEKWEFUjG29AJ, dpl_BotBQxja2C9s6P6BtwkSp1imuMpw, dpl_G8fYn6K6E2aknqhL2WFjzbCcNmFK, dpl_3aoPo9X9aKuSWLKG95Nz99bs8bc1, dpl_GAbhmvcRKotfxHE7bZoq3bNappPm, dpl_DXBQVsf8yExPK2uZLhbCjaEEJ7Wn, dpl_G2BfcSf8E8TCzyj9ooaysWHqSwAK, dpl_GMfPTEUwmDve9qgvZjXpmgmeHLQs, dpl_HxchqCrKgJH9aZPgYBQRenw3Z69S, dpl_BczMJuWZyJqKbziVBpDCJURyUFmG, dpl_3HJPJs8K9Wnf8YDmTXBpnDswd7ph, dpl_DMHiujBjHSCVc7zoJPwaBPx8ptbS, dpl_HsskxE8JTBrxZpLVrvvfdxDfzqaM, dpl_ksbqmkNJfDRnDSw7YMTvvGuWZdLh, dpl_Ct39tiNePS7XgDrZy43Btk8CTcYb, dpl_HnKeo5ASmjw9pXZkFfa94fBaAvF6, dpl_HZuuUWbyPFSNSZmM7vJo5eky8fSW, dpl_8xTDsvwofYNhBNDTCWherKqbxACs, dpl_73yifah6KcWPhcXS2jbrE24LywAF, dpl_AD8tCMXo7ALz9CnVPNmUKrh1Mnr9.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/android-release-reproducible-ci-20261027

- Author/date: Elshenawy Radwan; 2026-10-27T03:02:48+03:00.
- Subject: ci(android): verify patched installed forge before audit and bundling.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile security (Android release blocker): success; Mobile quality: success; runtime-validation: success; verify-eas-build: success.
- Unique branch-vs-merge-base files: .github/workflows/basoul-phase-6-mobile-runtime.yml, mobile/package.json, mobile/scripts/patch-node-forge.mjs, mobile/scripts/test-security-patches.mjs, scripts/audit-mobile-production.mjs.
- Retained deployment IDs: dpl_A9t1352YLbYekyUNVVi4jfKBRn5S, dpl_BkgtXzwRdohTiAGeD6UPyho9GJEc, dpl_2b7Ti4JKcUPYc8TrzNyTr1cGNbqU, dpl_G1iFFSj46uUjMFYX9vathyoJkx1E, dpl_4FEzqXPeTiJgg2BkTXVtsNVhfyem, dpl_Eyux6NRbgic4rBABoNYom5YQVZ2s.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/architectural-drawings-tenant-upload

- Author/date: Elshenawy Radwan; 2026-08-28T04:48:10+03:00.
- Subject: test(architecture): guard tenant-safe drawing upload.
- Squash tree matches: 128.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: lib/architecture/drawing-service.ts, supabase/migrations/20260828044500_architectural_drawings_tenant_upload_repair.sql, tests/architectural-drawings-tenant-upload.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/architecture-analysis-tenant-context

- Author/date: Elshenawy Radwan; 2026-08-28T05:00:20+03:00.
- Subject: test(architecture): guard analysis tenant context lineage.
- Squash tree matches: 129.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: supabase/migrations/20260828051000_architectural_analysis_tenant_context_repair.sql, tests/architectural-analysis-tenant-context.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/architecture-dwg-primary-entry

- Author/date: Elshenawy Radwan; 2026-09-01T00:05:55+03:00.
- Subject: Test: guard DWG primary Architecture entry.
- Squash tree matches: 141.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: app/architecture/pdf-image/page.tsx, features/architecture/architecture-review-view.tsx, features/architecture/pdf-image-review-view-source.tsx, features/architecture/pdf-image-review-view.tsx, tests/architecture-primary-entry.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/architecture-scene-privileges

- Author/date: Elshenawy Radwan; 2026-08-28T02:28:02+03:00.
- Subject: chore(architecture): record production privilege hardening migration.
- Squash tree matches: 122.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: supabase/migrations/20260824004500_architecture_scenes.sql, supabase/migrations/20260828002500_architecture_scenes_privilege_hardening.sql, tests/architecture-persistence.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/architecture-scene-tenant-integrity

- Author/date: Elshenawy Radwan; 2026-08-28T02:22:19+03:00.
- Subject: test(architecture): guard project organization integrity.
- Squash tree matches: 121.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: supabase/migrations/20260824004500_architecture_scenes.sql, tests/architecture-persistence.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/cad-fidelity-v2-4-provenance-gate

- Author/date: Elshenawy Radwan; 2026-09-01T20:19:12+03:00.
- Subject: test(architecture): lock CAD provenance gate for Pascal runtime.
- Squash tree matches: 155.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/cad-layer-normalization-v2-5-merge

- Author/date: Elshenawy Radwan; 2026-09-01T21:08:34+03:00.
- Subject: test(cad): lock normalized layer semantics and diagnostics.
- Squash tree matches: 158.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: failure; build-and-smoke: success; Web quality: success; Mobile quality: success; build-and-smoke: success.
- Unique branch-vs-merge-base files: features/architecture/cad-review-panel.tsx, packages/cad-ingestion/src/index.ts, tests/cad-ingestion.test.mjs.
- Retained deployment IDs: dpl_AKVpBDkXtdE83XRcmgrwr69euGSj.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/cad-layer-normalization-v2-5

- Author/date: Elshenawy Radwan; 2026-09-01T21:08:34+03:00.
- Subject: test(cad): lock normalized layer semantics and diagnostics.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: failure; build-and-smoke: success; Web quality: success; Mobile quality: success; build-and-smoke: success.
- Unique branch-vs-merge-base files: features/architecture/cad-review-panel.tsx, packages/cad-ingestion/src/index.ts, tests/cad-ingestion.test.mjs.
- Retained deployment IDs: dpl_AKVpBDkXtdE83XRcmgrwr69euGSj.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/cad-text-layer-semantics-v2-6

- Author/date: Elshenawy Radwan; 2026-09-02T00:29:14+03:00.
- Subject: fix(architecture): pass translation delta object to editor helper.
- Squash tree matches: 159.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: failure; Web quality: failure; build-and-smoke: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_BnYMfmsikTof1JU4H8V9PvUA7dCg.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/pascal-cad-camera-fit

- Author/date: Elshenawy Radwan; 2026-09-01T18:08:47+03:00.
- Subject: fix(architecture): remove unreachable manipulator return.
- Squash tree matches: 154.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: features/architecture/pascal-runtime-viewer.tsx, tests/pascal-cad-camera-fit.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/pascal-v2-3-live-wiring

- Author/date: Elshenawy Radwan; 2026-09-01T15:08:07+03:00.
- Subject: test(architecture): align CAD review contract with Pascal v2.3 gate.
- Squash tree matches: 152.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: features/architecture/cad-review-panel.tsx, tests/cad-review-workspace.test.mjs, tests/pascal-live-wiring.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/project-files-storage-policy-collision

- Author/date: Elshenawy Radwan; 2026-08-28T04:28:09+03:00.
- Subject: test(project-files): guard storage policy name qualification.
- Squash tree matches: 127.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: supabase/migrations/20260828042500_project_files_storage_policy_name_collision_fix.sql, tests/project-files-storage-policy-collision.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### fix/project-files-tenant-upload

- Author/date: Elshenawy Radwan; 2026-08-28T03:53:10+03:00.
- Subject: test(project-files): guard tenant upload repair.
- Squash tree matches: 126.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: lib/projects/project-file-service.ts, supabase/migrations/20260828035500_project_files_tenant_upload_repair.sql, tests/project-file-upload-integrity.test.mjs.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### main

- Author/date: Elshenawy Radwan; 2026-10-28T16:43:09+03:00.
- Subject: fix(android): resolve upstream security advisories without exceptions.
- Squash tree matches: none.
- Exact-head CI: Android release security (strict): success; build-android-preview: success; Mobile security (Android release blocker): success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: dpl_6j5SThVvoM3Wruowvot5Czcuyy7z, dpl_Do6KCHBCDBLSGDj5Vcnw58X5hewi, dpl_EBfabLdkAq1GaxsTRo5WB3ioo9hz.
- Automation/worktree: origin/main:.github/workflows/basoul-android-preview-build.yml:6:    branches: [main]; origin/main:.github/workflows/basoul-android-preview-build.yml:15:    if: github.ref == 'refs/heads/main'; origin/main:.github/workflows/basoul-android-preview-status.yml:5:    branches:; origin/main:.github/workflows/basoul-ios-development-build.yml:5:    branches:; origin/main:.github/workflows/basoul-ios-simulator-status.yml:5:    branches:; origin/main:.github/workflows/basoul-phase-6-mobile-runtime.yml:6:    branches: [main]; origin/main:.github/workflows/basoul-phase-6-mobile-runtime.yml:12:    branches:; origin/main:.github/workflows/cad-gateway.yml:11:    branches: [main]; origin/main:.github/workflows/experiment-zod4-compat.yml:4:    branches: [main]; origin/main:.github/workflows/publish-basoul-beta1-release.yml:5:    branches: [main]; origin/main:.github/workflows/publish-basoul-beta2-release.yml:5:    branches: [main]; origin/main:.github/workflows/publish-basoul-rc2-release.yml:5:    branches: [main]; origin/main:.github/workflows/publish-basoul-v4-release.yml:5:    branches: [main]; origin/main:.github/workflows/quality.yml:5:    branches: [main, develop]; origin/main:.github/workflows/quality.yml:9:  group: quality-${{ github.ref }}; worktree=false; Vercel setting=true.

### ops/android-eas-quota-reset-check

- Author/date: Elshenawy Radwan; 2026-09-01T08:08:22+03:00.
- Subject: Ops: verify newly queued Android EAS build.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; verify-eas-build: success; build-android-preview: success.
- Unique branch-vs-merge-base files: .github/workflows/basoul-android-preview-build.yml, .github/workflows/basoul-android-preview-status.yml.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/deploy-architecture-dwg-entry

- Author/date: Elshenawy Radwan; 2026-09-01T00:09:12+03:00.
- Subject: Deploy: enable one-time Architecture production build.
- Squash tree matches: 142.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/deploy-pascal-3d-v2-3

- Author/date: Elshenawy Radwan; 2026-09-01T02:33:53+03:00.
- Subject: ops: enable one-time Pascal 3D production deployment.
- Squash tree matches: 149.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: failure.
- Unique branch-vs-merge-base files: vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/one-time-production-cad-gateway

- Author/date: Elshenawy Radwan; 2026-08-31T20:09:00+03:00.
- Subject: Deploy: enable one-time main production build.
- Squash tree matches: 138.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/pascal-v2-3-production-cutover

- Author/date: Elshenawy Radwan; 2026-09-01T16:34:02+03:00.
- Subject: ops: open one-shot Pascal v2.3 production cutover.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Web quality: failure; Mobile quality: success.
- Unique branch-vs-merge-base files: vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/restore-main-deploy-lock

- Author/date: Elshenawy Radwan; 2026-08-31T21:40:08+03:00.
- Subject: Ops: restore main Vercel deploy lock.
- Squash tree matches: 139.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: none.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/restore-main-deploy-lock-architecture

- Author/date: Elshenawy Radwan; 2026-09-01T00:29:16+03:00.
- Subject: Ops: restore main Vercel deploy lock.
- Squash tree matches: 143.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### ops/restore-pascal-main-deploy-lock

- Author/date: Elshenawy Radwan; 2026-09-01T02:37:42+03:00.
- Subject: ops: restore main production deploy lock.
- Squash tree matches: 150.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success.
- Unique branch-vs-merge-base files: vercel.json.
- Retained deployment IDs: none.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### oss/pascal-architecture-poc

- Author/date: Elshenawy Radwan; 2026-08-24T03:34:25+03:00.
- Subject: docs: record final selective Pascal adoption decision.
- Squash tree matches: none.
- Exact-head CI: Vercel Preview Comments: success; Mobile quality: success; Web quality: success; verify: success; verify: success.
- Unique branch-vs-merge-base files: .github/workflows/pascal-architecture-poc.yml, experiments/pascal-architecture-poc/DECISION.md, experiments/pascal-architecture-poc/THIRD_PARTY_NOTICES.md, experiments/pascal-architecture-poc/app/layout.tsx, experiments/pascal-architecture-poc/app/page.tsx, experiments/pascal-architecture-poc/app/styles.css, experiments/pascal-architecture-poc/components/PascalArchitectureHost.tsx, experiments/pascal-architecture-poc/lib/architecture-tool.ts, experiments/pascal-architecture-poc/lib/demo-scene.ts, experiments/pascal-architecture-poc/lib/supabase-scene-adapter.ts, experiments/pascal-architecture-poc/next.config.ts, experiments/pascal-architecture-poc/package.json, experiments/pascal-architecture-poc/scripts/ifc-smoke.mjs, experiments/pascal-architecture-poc/scripts/ifc-smoke.ts, experiments/pascal-architecture-poc/sql/architecture-scenes.proposed.sql, experiments/pascal-architecture-poc/tests/architecture-tool.test.ts, experiments/pascal-architecture-poc/tests/persistence-contract.test.ts, experiments/pascal-architecture-poc/tests/supabase-adapter.test.ts, experiments/pascal-architecture-poc/tsconfig.host.json, experiments/pascal-architecture-poc/tsconfig.json, experiments/pascal-architecture-poc/types/pascal-editor-shim.d.ts, tsconfig.json.
- Retained deployment IDs: dpl_GySgbrc7Md7tHxxuvzxEasp8BKP6.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

### security/temporary-tooling-exception-20261030

- Author/date: Elshenawy Radwan; 2026-10-23T22:29:00+03:00.
- Subject: chore(ci): remove temporary dependency-refresh job after successful lockfile generation.
- Squash tree matches: 176.
- Exact-head CI: Vercel Preview Comments: success; Web quality: success; Mobile quality: success; verify-eas-build: success; runtime-validation: success.
- Unique branch-vs-merge-base files: .github/workflows/quality.yml, mobile/package-lock.json, mobile/package.json, package-lock.json, package.json, scripts/audit-mobile-production.mjs.
- Retained deployment IDs: dpl_8eA8CXE9LvqWe9rdWa4bqginLABy, dpl_6HSgf4AGfU3TjtLSA9ReseaqZyTH, dpl_D4sGZfG5PHuhha4pU8xmHsG9g27b, dpl_3hHiv4nBHfDeEkd3GuheGLinLjTT, dpl_6NAMwMpdB4ZRySaiTEuB48TxGGSx, dpl_9BZV9WxUnxd4isSVTSxnwRe3FZJh, dpl_DDwuJmeyn9WzMgapsFDiVQMhmb7T, dpl_EUa24rqaigQSXbKW5wEpi2se2UTi, dpl_GrL7bmjTykdd22ZeqY885bVVUbGT, dpl_pU5LBcHSSSRpSs2StqpT1HgEmRYV, dpl_Fu8QPYvkj94itdWjckkaMycMAFXb, dpl_71ACWtJVxxc3eNUyCA2coDTLE8ro.
- Automation/worktree: no exact main workflow reference; worktree=false; Vercel setting=false.

