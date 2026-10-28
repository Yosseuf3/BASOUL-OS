# Android security closure and Build 33 release gate

Baseline: main `a0eaa8dc26ca78fb3708db97272a52203e72cfc2`, including PR #183's user-reported physical-device evidence for **Build 32 only**. This document does not transfer those results to a different binary.

## Upstream evidence and minimal remediation

- **node-forge:** official `1.4.2`, npm integrity `sha512-rRtAR5XLJ8gCKd9du4qrKAsgCG1ObGP4gLeNJMa4vYSeq4bmBMOJk5IHkrviBV0q7uoAJlVd8HEQYQSVUb4FGQ==`, upstream git `7928054627d93ab8c0216b756246e8ca8d62a93e`. [Official changelog](https://github.com/digitalbazaar/forge/blob/v1.4.2/CHANGELOG.md) records the canonical DigestInfo fix in 1.4.1 and a PEM Buffer compatibility correction in 1.4.2. [Maintainer advisory GHSA-2g46-22mc-6gwp](https://github.com/digitalbazaar/forge/security/advisories/GHSA-2g46-22mc-6gwp) identifies CVE-2026-85393, also tracked by GHSA-86w9-cpqp-85rv, as fixed in 1.4.1. The older aggregate advisory page still lists no patch; it must not override the newer maintainer/source and installed-audit evidence.
- Both Expo parents already accept `node-forge ^1.3.3`; the lockfile alone selects 1.4.2. No forge override or Expo upgrade is needed. Only that transitive package changes, plus removal of the obsolete local postinstall marker. Remove the local parser patch instead of applying it over upstream's stronger canonical implementation.
- **braces:** remains `3.0.3` through `expo@57.0.31 → @expo/metro@56.0.2 → metro-file-map@0.84.5 → micromatch@4.0.8`. [GHSA-vfj7-8cjw-p6xm was withdrawn on 2026-10-23](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) because it is not practically exploitable. This is withdrawal, not a newly patched braces version. Remove its obsolete exception and expiry; any future/reinstated HIGH finding must fail normally.
- Expo `57.0.31`, CLI `57.0.32`, certificate tooling `0.0.6`, React Native `0.86.3`, existing Zod `4.6.6` override, Android package, EAS project and signing configuration are preserved.

## Security gate

`audit-mobile-production.mjs` now accepts **zero HIGH and zero CRITICAL only**, with no advisory allowlists, dates or temporary exceptions. Missing/malformed scanner evidence, scanner failure, inconsistent severity counts and newly reported findings all fail. Reviewed dependency topology, code-signing boundaries and runtime/build-tool separation remain enforced.

Fresh clean installation and raw production audit: **0 HIGH / 0 CRITICAL / 0 MODERATE; 7 LOW**. LOW findings are still visible; no bulk `audit fix`, suppression or severity change is used.

Focused policy tests cover clean results, the old forge and braces advisories returning, an unknown HIGH finding, fabricated success status with reported HIGH, missing/malformed/network-error audit evidence, a vulnerable lockfile, runtime tooling imports and altered identity/signing boundaries. Crypto regressions execute real upstream forge: valid RSA, modified message, canonical encodings, malformed nested/NULL/length/OID encodings, certificate trust, invalid certificate signature, PEM Buffer handling and Expo synthetic credential round-trip/mismatch rejection. Test keys are disposable in-memory fixtures; actual Android signing credentials are never read or changed by tests.

## Binary and publication

Android `versionName` stays **4.0.0**, `versionCode` increases **32 → 33**. iOS build number is unchanged because no iOS release is requested. A new EAS preview APK is required; Build 32 cannot represent the dependency remediation.

The existing Draft Release (ID `425885656`) must be reused. Preserve Build 32 artifacts and their actual device evidence as historical records. Select a distinct unpublished Build 33 tag, point it at the exact new EAS source, upload the verified new APK/checksum, and label screenshots with their actual build. Do not publish until mandatory checks and exact-binary release validation pass. A physical-device result for Build 32 is not a physical-device result for Build 33.

CI must pass on the reviewed PR and resulting main. The existing EAS preview workflow enforces the strict audit before credentials/build; use that workflow once on main rather than triggering another build unnecessarily. Inspect actual EAS status and exact source independently because the historical `verify-eas-build` workflow references an older build ID.

Dedicated security branch Git deployments are disabled explicitly in `vercel.json` to avoid an unrelated CAD/Web deployment and exhausted image quota. Existing main deployment disabling is preserved; no Web release, Supabase access/mutation, feature activation or signing change is performed.

## Remaining acceptance evidence

- Local clean installs PASS; repository tests 276/276 and cryptographic regressions 12/12 PASS; Web/Mobile TypeScript PASS; Expo Doctor 21/21 PASS; Android runtime export PASS; Web production audit has zero findings. Lint has zero errors and 19 existing warnings. Hosted CI/build receipts must be added to the existing Draft's final notes.
- New EAS build ID/status, exact APK SHA-256 and signer continuity must be verified before selecting the final asset.
- Exact Build 33 emulator smoke and physical-device authenticated smoke must be distinguished. If physical testing cannot be performed with available authorized access, retain Draft and request that specific human test after the new artifact exists.

## العربية

أُزيلت استثناءات الأمان المؤقتة، واستُخدم الإصلاح الرسمي `node-forge 1.4.2` بدل التصحيح المحلي. بقيت `braces 3.0.3` لأن advisory المعني سُحب رسميًا؛ أي HIGH يعود مستقبلًا سيُرفض دون استثناء. التدقيق الحالي خالٍ من HIGH وCRITICAL، مع إبقاء 7 LOW ظاهرة. يلزم APK جديد بالبناء 33؛ نتائج اختبار الجهاز المسجلة في PR #183 تخص البناء 32 فقط. يبقى النشر النهائي محجوبًا حتى اكتمال تحقق الحزمة الجديدة.
