# Android certificate-verification security design

Date: 2026-10-23. **Design only — implementation not approved.** Inspected local HEAD `209d36e3bd6aa70a438ddffd5d4c99dbf782d895`; main baseline `d8a6b80750b7df8b43a7f8f31fa61db72ad14308`; integration #174 `755a20083084765e0ee679deb66272a369fbbda9`. No dependency, crypto, signing, CI-policy or remote resource changed. Existing PRs and local work are preserved.

## Recommendation and evidence boundary

Prefer **A: official forge correction adopted by compatible Expo parents**, or **B: an officially supported Expo replacement**. Neither is currently available in the inspected published SDK 57 graph. If the owner wants an alternative developed, authorize a separate independent security review of candidate E before implementation; do not treat that review or a locally passing patch as an audit waiver. Android and affected shared-change gates remain blocked.

Fresh `npm ls node-forge --all` confirms:

```text
expo@57.0.31 → @expo/cli@57.0.32 → node-forge@1.4.0
                              → @expo/code-signing-certificates@0.0.6
                                → node-forge@1.4.0 (same installation)
```

One actual advisory, [GHSA-86w9-cpqp-85rv / CVE-2026-85393](https://github.com/advisories/GHSA-86w9-cpqp-85rv), affects forge <=1.4.0; three parent findings inherit HIGH from that implementation. Fresh registry reads still return forge latest 1.4.0 and Expo SDK-57 57.0.31. The advisory lists no patched version. Previous exact-lockfile clean-install/strict-audit evidence remains four HIGH; no repeated audit or regression suite was needed for these documentation-only changes. Latest certificates 0.0.7 and CLI 58 still require affected forge, as recorded in `ANDROID_SECURITY_ROOT_CAUSE.md`.

## Installed call-site inventory

Paths below are relative to `mobile/node_modules`. Line references are from this exact installed lockfile, not upstream main. Searches included all shipped `.js` in the two packages, excluding source maps and tests. Test fixtures also import forge but are not production entry points. This inventory does not assert coverage of uninstalled EAS CLI/service source.

| Location | Operation / callers | Reachability and limits |
|---|---|---|
| `@expo/code-signing-certificates/build/main.js:8` | Direct forge import, used by the exports below | Node tooling; reachable from development manifest middleware; not a demonstrated Android bundle import |
| Same file:21–100 | RSA key generation; key/certificate/CSR PEM parse/serialize helpers | CLI imports key/cert conversion at `codesigning.js:306–307,328,399–400`; PEM parsing can receive files or cached certificate data |
| Same file:108–145 | `generateSelfSignedCodeSigningCertificate`, random serial, RSA/SHA-256 signing | Exported tooling API; no direct call in the inspected CLI's codesigning consumer. Other build/service consumers unverified |
| Same file:147–188 | Public/private modulus/exponent match; `validateSelfSignedCertificate`; certificate signature verification at 176 | CLI `utils/codesigning.js:308` validates project signing certificate/key inputs. Conditional Android development path, not necessarily exercised on every start |
| Same file:200–209 | `signBufferRSASHA256AndVerify`; private-key signing and `certificate.publicKey.verify` at 203 | CLI `codesigning.js:401`; manifests signed only when signing information is available |
| Same file:216–228 | `generateCSR`, CSR RSA/SHA-256 signature | CLI `codesigning.js:372` generates development CSR |
| Same file:245–286 | `generateDevelopmentCertificateFromCSR`; `csr.verify(csr)` at 246; issuer signing | Exported issuer/server helper; no direct local CLI call found. Remote EAS/Expo service use UNVERIFIED |
| `expo/node_modules/@expo/cli/build/src/utils/codesigning.js:26` | Imports certificate library; cached-chain parsing at 328, key/CSR generation 370–373, signing 398–401 | Called by `start/server/middleware/ExpoGoManifestHandlerMiddleware.js:152,185`; processes manifest requests across supported platforms, including Android |
| `expo/node_modules/@expo/cli/build/src/run/ios/codeSigning/Security.js:42,69–70` | Direct forge import; parses certificate PEM returned by macOS `security find-certificate` | Local iOS signing-identity path, not an Android credential path. Parsing here alone does not establish use of vulnerable RSA verification. No macOS credential command executed |

`utils/codesigning.js:328–340` parses a cached chain and checks dates; its source contains further-validation TODOs. Parsing and date checks are **not full PKIX chain verification**. Do not claim the installed client establishes chain trust solely from this helper. Trust anchors, issuer checks, extensions and server authorization need explicit review in any replacement.

The underlying affected verifier is `node-forge/lib/rsa.js:1160+`: it checks outer DigestInfo element count while validating/decoding its algorithm identifier; the advisory concerns additional nested elements. This is a source inspection, not a proposed one-line fix or proof that one extra count check is sufficient.

### Exposure classification

- **Android development:** confirmed conditional Node-side reachability through Expo Go manifest generation, development certificate cache and project-signing paths. EAS project metadata is used by the development-certificate flow. No live request, key read, certificate issuance or signing was executed here.
- **Application runtime:** no direct forge/certificates import was found in `mobile/App.tsx` or `mobile/src` in the prior source inspection. The installed forge paths are tooling paths. Bundle/APK exclusion has not been verified by an artifact inspection, so “not shipped in every artifact” is not a proven release claim.
- **EAS Build, credential validation and release:** exact remote dependency graph, entry points, worker image and signing tooling are UNVERIFIED. Local SDK/image declarations cannot establish remote safety. A trusted inventory/SBOM/source attestation from Expo or an already authorized isolated build environment is required; do not launch an EAS build to acquire evidence under this authorization.
- **Signing distinction:** Android APK/AAB keystore signing and Expo manifest/update signing are different protocols. Forge's tooling reachability does not by itself prove APK signature forgery. Conversely, lack of an application runtime import does not make development/build verification safe. Existing keys, trust anchors, application identity and update configuration must remain intact.

## Decision matrix

| Option | Feasibility / security effect | SDK 57 and support | Decision |
|---|---|---|---|
| A. Official forge fix + compatible Expo adoption | Lowest divergence; must actually reject advisory corpus and clean the dependency graph | No published fixed forge now; wait for supported versions | Preferred; blocked upstream |
| B. Official Expo dependency replacement/removal | Can eliminate forge if both CLI and certificate paths are removed/replaced | No supported SDK-57 replacement evidenced; cross-major upgrade alone still retains forge | Preferred alternative if upstream delivers |
| C. Node/OpenSSL-backed replacement | Signature primitives feasible; complete PEM/CSR/issuance/extension/chain behavior is much broader | Not a drop-in replacement for forge object APIs; no demonstrated Expo support | Requires separate design approval, not implemented |
| D. Isolation of certificate operations | Reduces key/input blast radius, does not correct signature acceptance or clean npm audit | Possible separate process/container boundary without changing protocol; no support guarantee | Defense in depth only, not release remediation |
| E. Narrow source patch | Could correct affected nested ASN.1 acceptance while minimizing API changes | Unreviewed downstream divergence; requires independent crypto review and upstream submission | Candidate design only; no patch applied |

### Compatibility, tests and rollback by option

**A:** preserve manifest bytes, RSA/SHA-256 algorithm identifier, PEM serialization, certificate fields and existing key identity. Obtain fixed-release provenance and Expo compatibility evidence; run all tests below plus Doctor/typecheck/clean install. EAS workers must use the reviewed dependency, not a stale cache. Rollback means restore reviewed manifests/lockfile and **halt signing/release** if reverting to vulnerable forge; do not describe reverting as a secure operational fallback. Maintenance follows upstream release policy.

**B:** require explicit supported parent versions for both direct and certificates-derived paths. Prove certificate/CSR interoperability and signed update compatibility with existing trust anchors. A major SDK/native change requires separate approval and package/runtime-version review; no automatic SDK 58 migration. Run API contract and independent signature/chain tests, plus Android artifact checks when separately authorized. Roll back the exact package graph and stop affected release operations; preserve installed-client trust and history. Upstream must own long-term replacement support.

**C:** [`node:crypto`](https://nodejs.org/docs/latest-v22.x/api/crypto.html) offers RSA signing/verification and X509 parsing, but `X509Certificate.verify` is not an entire trust-chain/path-policy engine. Define an explicit adapter for every exported behavior above, including CSR and certificate issuance via a separately approved maintained library/tool. No handwritten ASN.1 parser, permissive fallback to forge, disabled verification or “verify self-issued means trusted” shortcut. Pin Node/OpenSSL/provider assumptions to actual approved 22.13.1 runtime and test independently; latest Node 22 documentation is not evidence all later APIs exist in that pinned version. Preserve key formats, update certificate identity/validity/extensions and wire protocol. EAS compatibility and maintenance ownership must be established before selecting this option. Rollback is adapter removal plus release stop, never silently falling back to vulnerable verification.

**D:** isolate operations with synthetic inputs first, least-privilege worker identity, no production DB/app tokens, restricted filesystem/network, bounded parsing time/memory, explicit certificate/key permissions and no logging of private material. Preserve required signing/verification; do not disable it. A forged signature can still be incorrectly accepted inside a sandbox, so isolation cannot justify a gate PASS. Test boundary escape, failure propagation and key non-exfiltration separately from cryptographic correctness. Roll back worker routing without deleting keys or making validation optional. Operator-maintained isolation is not an upstream fix.

**E:** scope review to the affected RSA PKCS#1 v1.5 verifier and schema validation. Specify exact allowed DigestInfo/AlgorithmIdentifier structure, algorithm-specific parameter policy, full input consumption, digest length/algorithm binding and padding requirements. Reject unexpected nested elements without disrupting valid supported certificates. Do not implement here. An independent reviewer must approve the exact diff, test vectors and negative results on unmodified 1.4.0, followed by upstream review. Preserve package provenance and reproducible patch hash; do not rename/override the dependency to obtain a false clean audit. Local tests do not change the advisory's affected range: existing npm HIGH findings/gates remain unless recognized supported remediation actually resolves them. Roll back by discarding the candidate and retaining the release block. Assign a maintenance owner and removal criteria when upstream publishes a fix.

## Security regression specification — NOT EXECUTED

All fixtures must be synthetic/public, with deterministic seeds or checked-in non-secret test keys clearly marked test-only. Never load production credentials. Maintain a versioned corpus with hashes and expected outcomes; tests must fail on a known vulnerable negative fixture before accepting a candidate.

| Test group | Required cases and oracle |
|---|---|
| Valid RSA | Known-answer RSA PKCS#1 v1.5 SHA-256 messages/signatures with representative supported RSA sizes; empty/Unicode/binary manifest bytes; independently verify via Node/OpenSSL and target Expo consumer. Preserve exact signed bytes and header algorithm |
| DigestInfo | Missing/extra outer fields, malformed lengths/tags, truncated/trailing data, wrong digest length, wrong/mismatched OID, absent/NULL/unexpected parameters per explicitly reviewed compatibility policy |
| Advisory nested elements | Extra nested DigestAlgorithm children, duplicate OID/parameters, nested sequences before/after expected elements; advisory reproducer and mutations must be rejected. A mutation signed with a synthetic private key can test encoding acceptance without attempting a real forgery |
| Invalid signatures | Wrong key/message/hash, changed signature byte, invalid length/padding and downgrade attempts; reject with bounded fail-closed errors and no retry through a weaker verifier |
| Certificates/chains | Trusted synthetic root/intermediate/leaf positive; unknown root, broken issuer signature, wrong issuer, invalid validity, CA/basicConstraints/path length, keyUsage/EKU, unsupported critical extension, revoked credentials where revocation is part of the approved trust model. Do not invent network revocation guarantees |
| Identity/credentials | Public/private mismatch, wrong app/project/scope identity, wrong CSR signature, malformed/encrypted PEM, file permissions, inaccessible/changed files and cache corruption. No key logging, regeneration, uploads or trust-anchor rotation |
| Expo/API compatibility | Every exported conversion/generation/verification API above; cached/fresh development certs; synthetic manifest request through Android-compatible client; preserve application ID, scheme, versionCode and update runtime compatibility |
| Clean installation/provenance | Fresh disposable install from exact committed lockfile, tarball integrity, no mutable postinstall patch drift, no stale cache assumptions; compare resolved trees. Strict npm audit remains a separate required result |
| Failure/recovery | Worker timeout, parser error, unavailable crypto provider, concurrent signing and interrupted cache write; no unsigned fallback, secret leakage or partial credential replacement |

Further actual Android/EAS artifact/signing tests require separate authorization; they are specified, not claimed PASS. Prior 368/368 repository tests, Doctor 21/21 and SDK/target-36 evidence do not cover this new adversarial design.

## Approval and next action

Owner/security reviewer must select the option and scope, approve trust model/API requirements, assign independent cryptographic review and maintenance, and approve synthetic test implementation before a crypto change. Production signing/keys, EAS execution and rollout remain separately gated. The immediate next safe action is review of this design and an explicit choice between waiting for upstream and authorizing a bounded candidate investigation. No protected-branch or audit exception is implied.
