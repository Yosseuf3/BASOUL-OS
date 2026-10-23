# Web readiness and safe integration decision

2026-10-23. **Web release: HOLD. Supported present route: deferred release (D).** Existing local and CI Web quality evidence is positive, but no policy-compliant independent integration route exists under the currently enforced checks. No production data was accessed. No source, checks, dependencies or protection settings were changed.

## Refreshed GitHub state

Fetched remote refs using `git fetch origin --prune` and verified:

| Reference | Exact SHA / state |
|---|---|
| `origin/main` | `d8a6b80750b7df8b43a7f8f31fa61db72ad14308` |
| [Draft PR #174](https://github.com/Yosseuf3/BASOUL-OS/pull/174) | `755a20083084765e0ee679deb66272a369fbbda9`; OPEN; base main; BLOCKED |
| [Draft PR #175](https://github.com/Yosseuf3/BASOUL-OS/pull/175) | `209d36e3bd6aa70a438ddffd5d4c99dbf782d895`; OPEN; base `codex/repository-reconciliation`; UNSTABLE |
| Local HEAD | Same as #175; branch `codex/path-aware-release-gates` |

Ancestry: main is an ancestor of #174 with seven additional commits (0/7 left/right difference); #174 is an ancestor of #175 with two additional commits (0/2). PR #174 changes 156 files; #175's complete main-relative history changes 161 files. #174 includes Mobile, shared packages, organization authorization, Supabase functions/schema and SQL candidates. It is not a Web-only change set. #175 is a stacked CI proposal, not a main-based bootstrap.

Live ruleset **19746250 — Protect Main Branch** is active on `refs/heads/main`, with no bypass actors, strict required checks, and GitHub Actions integration **15368** for both **Web quality** and **Mobile quality**. Deletion/non-fast-forward protections and PR requirements remain in place. The legacy branch protection endpoint returns 404; the active ruleset still enforces main protection.

Latest checks:

- #174, [run 39971800336](https://github.com/Yosseuf3/BASOUL-OS/actions/runs/39971800336): Web quality PASS; mandatory Mobile quality FAIL. Additional runtime-validation FAIL; verify-eas-build status workflow PASS (not a new native build).
- #175, [run 39985365060](https://github.com/Yosseuf3/BASOUL-OS/actions/runs/39985365060): Release scope, Web quality and Web release gate PASS; Mobile quality and Android release gate FAIL. Aggregate checks are not yet main's required checks and are not installed on main.

## Web release evidence

No completed reconciliation, Android investigation or regression suite was repeated. Results below identify reused evidence and its limits.

| Prerequisite | Evidence and decision |
|---|---|
| Production dependency audit | PASS in latest Web CI on both reviewed heads; prior full Web audit also clean. No new audit run in this unchanged assessment. |
| Next security version | Integration/current branch retains 16.4.3. Fresh registry metadata confirms `next` latest=16.4.3. Next 16 is Active LTS under the [official support policy](https://nextjs.org/support-policy). Main still has 16.3.8; integration evidence must not be attributed to main. |
| TypeScript, lint, production build, bundle budgets | PASS in latest Web quality CI. These builds use placeholder Supabase settings and do not certify hosted configuration. |
| Auth, authorization, organization isolation | Reused actual isolated browser/Auth/PostgREST evidence: owner/member/viewer negatives, two organizations, stale organization response/mutation handling, task CAS/audit, membership revocation and deep links. PASS locally; no external target certification. |
| Database compatibility | Reused fresh/upgrade rehearsal: 37 ordered migrations plus review enum/eight candidates, historical preservation, rollback/reapply and dump/restore fingerprints PASS. Synthetic fixtures only; authorized external target ledger/schema/RLS preflight remains HOLD. |
| Environment | Root/mobile contain only example env files. No newly established authorized hosted non-production target. No credential values decrypted. |
| Vercel | Existing project `yosseuf-os`, `prj_uHdvrknlDGmNyvHNu0dzWEOPzSkA`, reused for metadata inspection only. Live project Node remains 24.x versus CI 22.13.1. Current Git config disables main/integration/CI-branch deployments. No deployment was attempted. |
| Database/provider separation | Live encrypted Vercel metadata still scopes Supabase URL and anon-key entries jointly to production and preview. This is not proof of separate test infrastructure; no database queried. |
| External email | HOLD: isolated synthetic SMTP rejection/retry/acceptance passed previously; approved external account/recipient/provider verification and deliverability are not evidenced. No external email sent. |
| Storage/file scope | Existing uploader-only bytes policy and 60-second signed URLs retained. Local tenant/revocation/reference checks passed previously. Team-wide sharing is not implemented/approved; pilot scope must be explicit. |
| Rollback | Local Git backups/bundle directories remain present; synthetic database restore fingerprints previously passed. Hosted previous-version promotion, target-specific backup/restore and migration rollback remain unverified. No production rollback exercise performed. |

Historical Preview failures remain distinct from intentional disabling: three inspected historical builds failed publishing the CAD image because registry image capacity was exhausted; two reported `git_info_fail` with no underlying build log. No new retry or capacity change was made, and current capacity is not certified. See the existing local `WEB_RELEASE_READINESS_FINAL.md` for exact deployment IDs and evidence.

## Integration approaches

**A — Existing PRs:** blocked. #174 legitimately affects Android/shared/database contracts and fails mandatory Mobile security. #175 legitimately changes CI/security and also requires Android evidence. Merging #175 into its integration base would not itself install anything on main, and no merge is authorized. The new aggregate names cannot replace the live checks before the protected target reports them reliably.

**B — Separate genuine Web-only PR:** cannot pass current policy merely by reducing the diff. Main's existing Quality Gate runs Mobile quality unconditionally. Its exact audit script has a deterministic expired-exception failure (2026-10-16), previously reproduced without changing it. A Web-only cherry-pick would retain that failure. Including a CI exemption to avoid it would itself be a cross-platform security change, not an honest Web-only change. Extracting organization/task work while omitting required shared/SQL contracts would also be unsafe. No such PR was created.

**C — Official upstream remediation:** the correct prerequisite route, but currently blocked. Reuse `ANDROID_SECURITY_ROOT_CAUSE.md`: one real node-forge advisory affects 1.4.0, three parent entries inherit it, and the checked supported Expo chain has no clean published fix. No Android investigation was rerun here. Neither updating the exception date nor replacing it with a strict audit alone eliminates the vulnerable dependency.

**D — Deferred release:** the only currently compliant outcome. A passing Web aggregate on a stacked branch is useful evidence, not permission to bypass a failing raw required check, deploy around main or mislabel shared work.

## Smallest supported plan

1. Keep both Draft PRs and all current required checks unchanged. Do not open an ineffective Web-only PR just to duplicate failing checks.
2. When a supported upstream fix exists, prepare a minimal main-based security PR with compatible dependency remediation and the strict exception-free audit, preserving required check names and security thresholds. If a replacement cryptographic design is proposed instead, obtain separate security review before implementation; it is not an approved workaround.
3. Require both old quality checks to pass genuinely on the latest up-to-date security PR. Obtain explicit merge approval; this task does not merge.
4. Rebuild the four-file CI bootstrap already designed in `CI_BOOTSTRAP_REMEDIATION.md` against clean main; preserve old raw jobs and require their success. After separately authorized integration onto main, verify replacement aggregate reporting. Then obtain/reconfirm approval for the exact ruleset transition; no protection edit here.
5. Land the reviewed path-aware optimization through passing CI. It may avoid Android work only for correctly verified non-Android changes. Revalidate #174 as a shared change; the new policy must still block it if Android fails.
6. Independently close Web release prerequisites: approved isolated backend preflight; verified email sender/test recipients; Vercel Node alignment, Git/registry issues and exact-SHA Preview validation; uploader-only pilot scope; target backup/restore and rollback plan. Use the existing project/environments, no duplicate infrastructure.
7. Obtain separate merge, schema-application (if needed), Preview deployment, and production deployment/release approvals. Keep five-state workflow OFF unless a later specific activation is approved.

## Executed changes and preservation

Executed remote fetch and read-only GitHub/Vercel/registry inspection; reviewed existing validation logs and backup directory presence; added only this local decision report. No regression reruns, source edits, commits, pushes, new PRs, merge, EAS, email, remote migration, workflow activation or deployment occurred. Existing untracked reports, `AGENTS.md`, `CLAUDE.md`, `error.log`, local settings, credentials and backups were preserved. No secrets were printed or staged.

**Exact next action:** retain release HOLD and the existing protection; pursue a supported upstream Android fix (or separately reviewed replacement design), then execute the normal security-PR → passing old checks → approved bootstrap → verified gate transition sequence. There is no currently supported independent Web integration route under the fixed ruleset and stated restrictions.
