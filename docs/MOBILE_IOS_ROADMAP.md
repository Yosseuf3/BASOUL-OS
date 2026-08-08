# BASOUL OS — iOS & Mobile Roadmap

## القرار المعتمد
تطبيق iOS جزء رسمي من خارطة المنتج، لكننا لن نحول واجهة الويب إلى WebView. سنبني تجربة موبايل مستقلة تعتمد على نفس طبقات البيانات والأعمال والقرار.

## المبادئ
1. لا يوضع منطق الأعمال داخل React UI.
2. الويب والموبايل يشتركان في الأنواع والخدمات وطبقة Intelligence.
3. Supabase هو مصدر البيانات المشترك مع RLS موحد.
4. كل ميزة جديدة تُراجع من منظور الهاتف قبل اعتمادها.
5. الموبايل يركز على القرارات السريعة والعمل أثناء التنقل.

## المراحل

### v1.0 — Web Stable
- تثبيت الـ schema والعقود الأساسية.
- إنهاء تحسين الواجهة والأداء والاختبارات.
- توثيق الخدمات التي سيستهلكها تطبيق الموبايل.

### v1.1 — Shared Platform
- الانتقال تدريجيًا إلى Monorepo.
- استخراج `types`, `core`, `services`, و`intelligence` إلى packages مشتركة.
- منع أي وصول مباشر إلى Supabase من مكونات العرض الجديدة.
- إضافة اختبارات لعقود الخدمات.

### v1.2 — Mobile Foundation
- React Native + Expo + TypeScript.
- Authentication وSession persistence.
- Navigation وDesign tokens وRTL.
- Supabase client آمن للموبايل.
- Error handling وanalytics foundation.

### v1.3 — iOS Beta
- لوحة قرارات مخصصة للهاتف.
- مهام ومشاريع وعملاء وإشعارات.
- إضافة سريعة وتعديل الحالة.
- Push Notifications.
- Camera attachments وVoice Notes.
- Face ID / Touch ID.
- TestFlight distribution.

### v1.4 — Field & Offline
- Site Visit Mode.
- تخزين محلي للبيانات الأساسية.
- Queue للعمليات غير المتصلة.
- Sync conflict handling.
- Location metadata عند طلب المستخدم.

### v1.5 — iPad & Widgets
- iPad responsive workspace.
- Today's Focus widget.
- Critical Alerts widget.
- Next Meeting / Workspace Health widgets.

## النطاق الأول لتطبيق iOS
- تسجيل الدخول.
- Morning Brief.
- Today's Focus.
- Notifications.
- Tasks.
- Projects.
- Clients.
- Finance Snapshot للقراءة السريعة.
- Knowledge Search.

## خارج الإصدار الأول
- الإدارة المالية الكاملة.
- إعدادات مؤسسية متقدمة.
- تقارير كبيرة ومعقدة.
- Apple Watch.
- مساعد صوتي كامل.

## الهيكل المستهدف
```text
/apps
  /web
  /mobile
/packages
  /core
  /types
  /services
  /intelligence
  /design-tokens
  /config
/database
/docs
```

## بوابة الجاهزية قبل بدء تطبيق iOS
- Production build ناجح للويب.
- جميع CRUD الأساسية مستقرة.
- لا منطق أعمال حرج داخل UI components.
- Auth وRLS مختبران.
- API/service contracts موثقة.
- استراتيجية رفع الملفات والإشعارات معتمدة.
