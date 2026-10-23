# Web external preflight — metadata only

Date: 2026-10-23. **Release decision: HOLD.** Authenticated read-only connector inspection reused existing Vercel project `yosseuf-os`, ID `prj_uHdvrknlDGmNyvHNu0dzWEOPzSkA`, team `team_VBfclN55jUH4c2bOGLjHPQE2`. No deployment, configuration edit, protected-site request, database connection, email or rollback operation was performed. Secrets were neither decrypted nor printed.

## Decision matrix

| Check | Result | Evidence / residual risk |
|---|---|---|
| Existing project identity | VERIFIED metadata | Existing Next.js project reused; no duplicate resource |
| Preview configuration | HOLD | Repository disables Git deployment for main, integration and CI branches. Latest listed Previews are historical ERROR builds; no exact-current-SHA hosted PASS |
| Node configuration | HOLD | Live project Node 24.x differs from validated CI/local 22.13.1; no setting changed |
| Environment presence/scope | VERIFIED metadata only | Encrypted `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` both target production + preview, no branch override returned. Presence is not key validity or isolation proof |
| Supabase connectivity | UNVERIFIED | No authorized non-production URL/credentials identified. Shared env scopes cannot establish target isolation. No database query or production connection |
| External email provider | UNVERIFIED | No provider entry appears in returned Vercel env metadata; SMTP could be provider-side, so absence here is not proof it is unconfigured. No approved external recipients/configuration established |
| Production deployment identity | VERIFIED metadata | READY production record with production aliases identified below; application health/security/data state not tested |
| Previous deployment availability | PARTIAL metadata | Two records marked rollback candidates by normal production list; dedicated rollback resource list denied 403. Promotion permission, eligibility, retention and schema compatibility unverified |
| Web dependency/build quality | Reused PASS | Existing exact-SHA Web CI production audit, TS/lint/build/bundle PASS; no repeated suite or new clean-audit claim |
| Release eligibility | HOLD | Ruleset 19746250 still requires both raw quality checks; Mobile fails. No ruleset edit or bypass |

## Production and rollback identification

`get_deployment` confirms production deployment **`dpl_BnYMfmsikTof1JU4H8V9PvUA7dCg`**, state READY, commit **`5977780ea5037cb1462984883c4ff38d9d5f769a`**, branch `fix/cad-text-layer-semantics-v2-6`. Its alias metadata includes `os.basoul.net`, `yosseuf-os.vercel.app` and project aliases. This identifies the assigned production deployment without sending requests to the application or reading production data. It is neither #174 nor #175. Project metadata's separate `live:false` field was not used to infer uptime or availability.

Normal production listing returned:

| Deployment | Commit | State | Returned rollback-candidate flag |
|---|---|---|---|
| `dpl_BnYMfmsikTof1JU4H8V9PvUA7dCg` | `5977780ea5037cb1462984883c4ff38d9d5f769a` | READY | true |
| `dpl_AKVpBDkXtdE83XRcmgrwr69euGSj` | `84f60da03b79dd9a60412f04d5b2dc1d32a01bc8` | READY | true |
| `dpl_BvNzX9BdTYUgUE3gDpLiF2XFeFUA` | `934fa96600169c2f8cc9b7203b9e2482051c33b9` | READY | false |

The dedicated `rollbackCandidate=true` request returned **403 forbidden**, resource `deploymentRollback`. A mapped Vercel CLI fallback was considered, but no Vercel command/local CLI installation was available; no installation or credential request was initiated. No unchanged retry or rollback mutation was made. Candidate flags from ordinary metadata support record availability only; they do not prove a safe restore or permission to promote. Snapshot-specific secrets, service images and pending migrations must be assessed before a rollback decision. No deployment should be deleted to resolve capacity without a reviewed retention plan.

[Production deployment inspection](https://vercel.com/yosseuf-os/yosseuf-os/BnYMfmsikTof1JU4H8V9PvUA7dCg). A deployment dashboard link does not imply a verified production journey.

## Preview and services

The existing `vercel.json` defines Web and containerized `cad_gateway` with a Web service binding; it retains explicit deployment disabling for `main`, `codex/repository-reconciliation`, and `codex/path-aware-release-gates`. No new Preview was requested.

Latest returned Preview records `dpl_AXhyZL4RHU4QevB47GCvvpnh7b4S` and `dpl_HFYFYpqPPZnuqSfXffBmDbHvB7fF` are ERROR at historical SHA `66f5dffd37c2a122e0346ca334fb54b39ea4e41b`. Prior inspected logs established CAD image registry-capacity rejection for these; separate historical records had `git_info_fail`. This task rechecked metadata, not old log downloads or a fresh build. Current registry capacity and Git failure resolution remain UNVERIFIED. Intentional Git disabling is not a failed build and does not validate a release.

## Database, email and authorization boundaries

Only example env files were previously found locally. Supabase env names scoped jointly to Preview/Production do not authorize decrypting or querying a potentially production backend. An owner must identify an existing authorized isolated target and safe connection method before `docs/database/web-rc-preflight.sql` can run. That SQL is read-only post-install validation, not an installer; it assumes candidate RPCs/historical relations. Target-specific migration ledger/RLS/trigger/grant and data compatibility remain UNVERIFIED.

No external sender/provider DNS settings, credentials, webhook configuration, recipient allowlist or delivery were available for verification. Prior isolated synthetic GoTrue SMTP failure/retry/acceptance evidence is retained but does not establish inbox deliverability or provider configuration. Confirm the existing provider account, sender/SPF/DKIM/DMARC, redirects, non-production target and approved recipients before any bounded external test. No real email was sent.

## Existing evidence and residual risks

- #174 (`755a200...`) Web quality passed run 39971800336; #175 (`209d36e...`) Web quality and Web release gate passed run 39985365060. Their corresponding Mobile/Android checks failed. Builds use placeholder backend values; hosted connectivity is not covered.
- Prior local actual browser/Auth/PostgREST/Storage tests cover organization isolation, authorization/revocation, CAS/audit, project journeys, uploader-only file access and synthetic email. Historical fresh/upgrade/rollback rehearsals passed on synthetic fixtures. These are reused evidence, not fresh hosted PASS results.
- Existing local Git backups/bundle and synthetic dump/restore fingerprints support local recovery only. A ready old deployment does not roll back a changed database or establish application compatibility with pending SQL candidates.
- Uploader-only file scope, signed-URL TTL residual access, disabled feature activation and review of current deployment credentials/configuration remain release considerations. No permission expansion is authorized.

## Recommended sequence and approvals

1. Review `ANDROID_SECURITY_DESIGN.md`; keep affected Android/integration gates blocked until a supported or separately reviewed remediation meets actual mandatory policy. No audit waiver arises from local crypto tests.
2. Owner/project administrator provides read-only rollback metadata access or independently verifies retained eligible deployment/service artifacts and target backup/restore compatibility. No rollback execution requested.
3. Identify an already configured isolated backend and approved email account/recipients; authorize only the bounded preflight/test appropriate to those exact targets. Keep production data inaccessible to this test.
4. Review Node alignment and Preview registry/Git failures; configuration changes and a new isolated Preview need explicit follow-up authorization. Reuse the current project.
5. Verify current required checks and protected-target gate availability before any approved bootstrap/ruleset sequence. Merge, remote schema application, deployment, signing, EAS and workflow activation remain outside this task.

Initial design task created two local documentation files only. The subsequent authorized blocker-resolution pass publishes the reviewed evidence documents on the existing #175 branch; no source/dependency/security-policy changes or production resource mutations are included.

## Final blocker-resolution follow-up (2026-10-23)

- Fetched remote refs; main/#174/#175 were unchanged at the three baseline SHAs before this documentation publication. Required checks remain Web quality + Mobile quality, strict, integration 15368, no bypass actors.
- Safe `HEAD https://os.basoul.net` returned **200**, content type HTML. This verifies hostname/HTTP response only, not authenticated application, database connectivity or email delivery. No session, user record or production data was requested.
- Supabase connector project inventory is accessible. It returned **BASOUL Accounting v1.8 Validation** (`drzsfeqtftvjbaruikcm`) and **Accounting software** (`qwvipqxjrfgdpaoumkns`), both **INACTIVE**. Neither was established as the BASOUL OS Web backend. Do not restore either project or infer identity from the BASOUL name.
- Vercel environment metadata still provides exactly the public Supabase URL/key entries shared between production and preview. A read of the URL entry returned metadata with `decrypted` boolean but **no value field**. No anon key was requested, no secret printed, and no target URL was guessed. Correct database correlation/connectivity therefore remains **UNVERIFIED**, requiring owner identification and an authorized readable connection configuration.
- No email provider metadata/configuration or approved recipients were established. Supabase connector exposes no Auth/SMTP configuration operation in this session. No provider credentials or real external email were accessed/sent.
- Team metadata confirms the expected Vercel team/slug; it does not expose the caller's membership role. The earlier rollback list error explicitly names forbidden resource `deploymentRollback`; available project/deployment read access does not confer that permission. No CLI installation/authentication is available for the documented fallback. The precise underlying grant cannot be determined from accessible metadata. Required external action: project/team owner verify read permission for rollback eligibility or provide an independently verified retained-deployment/rollback assessment. No permission grant or rollback action was attempted.
- Registry reads still report node-forge latest **1.4.0** and SDK-57 Expo **57.0.31**. No supported remediation appeared; no crypto patch, override or new Android audit was attempted. Existing four-HIGH evidence remains blocking.
- Current production deployment identity was not changed by any operation here. Inspection/HEAD is not a deployment; no promotion, alias assignment, production setting edit or DB mutation was performed. A rollback drill and exact-target health evidence remain unverified, so no production-readiness PASS or release candidate approval is issued.

Actionable local work is complete. External prerequisites remain: supported upstream remediation or independent approval of a crypto design; correct backend identification/read access; verified email configuration and approved recipients; rollback permission/evidence; then genuine passing required checks and explicit merge/deployment approvals. Do not initiate the bootstrap while its required security evidence is failing.
