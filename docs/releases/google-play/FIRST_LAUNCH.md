# Google Play first launch — BASOUL OS

Status: PREPARATION; not uploaded, submitted or published.

## Identity and build

- Separate app: BASOUL OS; package com.yosseufradwan.os. Accounting net.basoul.accounting must never be edited.
- Version 4.0.0, versionCode 34 (33 remains historical GitHub APK). Production profile explicitly app-bundle, Android autoIncrement false to make reviewed source reproducible. Existing iOS behavior unchanged.
- EAS project 6f770730-8c8e-49b0-81b9-f9773faf567a, SDK57, target36 required by Google after August31 2026.
- Production EAS environment was empty. Added only the two existing public client configuration values from verified Build33 environment, confirming backend ref okghyypmkymxvtsuvdvb and anon/publishable key role. No database changes; no values recorded here.
- Keep existing signing credentials; build with --freeze-credentials. Verify artifact signer against Build33 upload key before upload. Google Play may enroll a different app-signing key; distinguish upload vs app signing.

## Security

Clean install, strict mobile audit, TypeScript, Expo Doctor21/21, tests276/276, crypto12/12 and Android runtime export pass locally. node-forge1.4.2 official; no obsolete postinstall patch or HIGH exceptions. braces3.0.3 advisory GHSA-vfj7-8cjw-p6xm withdrawn. Seven LOW inherited entries remain from deepmerge4.3.1 GHSA-gcqx-w48m-w2h4 in Expo tooling; no HIGH/CRITICAL/MODERATE. Web production audit clean.

## Console evidence

Developer BASOUL, personal account5528390616632723618. Existing app list showed only BASOUL Accounting. New-app form verified package com.yosseufradwan.os available; name BASOUL OS, English en-US, App, Free prepared. Legal policy/export declarations await explicit owner approval. App is not created yet.

## Truthful store declarations — pending owner review

- Authentication required; email/password Supabase session persists in AsyncStorage. No signup/account-creation UI found in mobile login; confirm external provisioning and full account-deletion policy before declaring eligibility.
- Personal info: email/account IDs; organization memberships; project/task/file/note content accessed from Supabase. Inspect actual reviewer workflow before final Data Safety answers. Do not claim no data collected.
- No ads SDK observed in mobile manifests. No generative AI mobile service verified: do not claim AI/CAD/Architecture as broadly available.
- Support email, valid privacy-policy URL, target audience, content-rating answers and legal attestations require verified owner-supplied facts. Never copy Accounting declarations.
- Dedicated isolated reviewer account and organization are NOT provided or verified. No customer data may be used. Credentials belong only in Play Console App Access, never GitHub.
- Personal-account production eligibility not established. If account created after November13 2023, current Google policy requires at least12 opted-in closed testers for14 continuous days, then production-access application. Internal testing alone does not satisfy this.
- Exact AAB must be tested via Play; Build33 owner device PASS cannot be transferred.

## Store copy — ready for review

English short: Your organization, projects and tasks in one connected workspace.

English full: BASOUL OS gives authorized team members mobile access to their organization workspace. Sign in with your assigned account to view your dashboard, browse projects, manage supported tasks, review notifications and access account controls. Available records and actions depend on your organization's permissions and configuration. A network connection and an authorized BASOUL OS account are required.

Arabic short: مؤسستك ومشاريعك ومهامك في مساحة عمل مترابطة.

Arabic full: يتيح BASOUL OS لأعضاء الفريق المصرح لهم الوصول إلى مساحة عمل المؤسسة من الهاتف. سجّل الدخول بحسابك المعتمد لعرض لوحة المعلومات والمشاريع والمهام المدعومة والإشعارات وإعدادات الحساب. تعتمد البيانات والإجراءات المتاحة على صلاحياتك وإعدادات المؤسسة. يتطلب التطبيق اتصالًا بالإنترنت وحساب BASOUL OS مصرحًا به.

Release notes EN: First Google Play test build of BASOUL OS4.0.0. Organization-aware dashboard, projects, supported task workflows, notifications and account access. Official upstream security fixes; production app bundle.

Release notes AR: أول بناء اختباري على Google Play لإصدار BASOUL OS4.0.0، مع لوحة المؤسسة والمشاريع ومسارات المهام المدعومة والإشعارات والحساب وإصلاحات الأمان الرسمية.

## Release gates

AAB identity/checksum/signature, Play upload acceptance, App Signing enrollment, listing assets, privacy/contact, App Access reviewer credentials, Data Safety/content rating/target audience, actual Play installation smoke tests, production eligibility and final owner declarations must all be verified before production submission.

## Sources

- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://github.com/digitalbazaar/forge/security/advisories/GHSA-2g46-22mc-6gwp
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

## Store assets

assets/app-icon-512.png is resized from the existing approved mobile icon. assets/feature-graphic-1024x500.png is branded marketing artwork, not a screenshot. Both were generated locally and visually reviewed. Fresh screenshots from the exact Play-distributed build remain required; no Accounting screenshots used.

