# BASOUL OS

الحالة الحالية: **BASOUL Beta 1 · v4.0.0-rc.1 · Platform Foundation**

![الإصدار](https://img.shields.io/badge/version-v4.0.0--rc.1-2563EB)
![القناة](https://img.shields.io/badge/channel-beta-8B5CF6)
![Node](https://img.shields.io/badge/node-22.x-43853d)
![الترخيص](https://img.shields.io/badge/license-MIT-blue)

**منصة أعمال موحّدة وواعية بالمؤسسة، أسسها YOSSEUF RADWAN.**

BASOUL هي العلامة التقنية الرئيسية. تبقى YOSSEUF RADWAN هوية المؤسس والشخصية، بينما تعود حقوق النشر للأعمال المملوكة لنا قانونيًا إلى **ELSHENAWY RADWAN**.

يجمع BASOUL OS المشاريع والمهام والعملاء والمحتوى والمعرفة والمالية والنشاط والإشعارات والإدارة ودعم القرار التنفيذي داخل مساحة عمل واحدة محكومة.

> **ماذا يجب أن أفعل الآن؟**

![لوحة القيادة في BASOUL OS](docs/assets/screenshots/executive-dashboard-v1.0.0.png)

## حالة النسخة التجريبية

- حزمة المنتج: `basoul-platform`
- إصدار المنتج: `v4.0.0-rc.1`
- قناة الإصدار: **Beta**
- الهوية: Symbol وWordmark الأصليان المعتمدان لـBASOUL
- الألوان: Navy / Electric Blue / Cyan / Violet
- تسجيل الدخول للتطوير: Email + Password
- RTL والاستجابة للشاشات: مفعّلان
- معرّفات الإنتاج وSupabase Production: بدون تغيير

سجل التحقق المعتمد للنسخة موجود في `docs/releases/BASOUL_BETA_1_RUNTIME_VERIFICATION_2026-08-10.md`.

## الإمكانات الأساسية

- لوحة القيادة التنفيذية وصحة مساحة العمل
- إدارة المشاريع وتنفيذ المهام
- إدارة العملاء
- استوديو المحتوى
- قاعدة المعرفة
- النظرة المالية
- سجل النشاط الموحد
- مركز الإشعارات
- البحث الشامل والإنشاء السريع
- الإدارة والعمليات المعتمدة على الصلاحيات
- دعوات الأعضاء الآمنة
- اختصارات لوحة المفاتيح
- بنية ذكاء مشتركة جاهزة لتكامل BASOUL AI

## البنية المعمارية

```text
YVL canonical mechanics
+ BASOUL Brand Foundation
→ BASOUL semantic adapter
→ Web / React Native primitives
→ BASOUL products
```

وعلى مستوى التطبيق:

```text
طبقة العرض
    ↓
طبقة القرار
    ↓
منطق الأعمال
    ↓
خدمات البيانات / Supabase
```

تدير YVL الميكانيكا مثل المسافات والزوايا والحركة وإمكانية الوصول وRTL وهندسة التفاعل. أما BASOUL Brand Foundation فهي مصدر الحقيقة للهوية والأصول المعتمدة والألوان والسلطة البصرية.

## التشغيل السريع

```bash
cp .env.example .env.local
npm install
npm run dev
```

ثم أضف:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

وافتح `http://localhost:3000`.

## بوابة الجودة

```bash
npm run quality
```

لا يتم تخفيف بوابات الجودة أو الأمان لتبدو النسخة التجريبية سليمة. أي تحذير اعتماد معروف يبقى موثقًا حتى يتوفر إصلاح مدعوم ومختبر.

## التوثيق

- [التثبيت](INSTALL.md)
- [النشر](DEPLOYMENT.md)
- [الأمان](SECURITY.md)
- [المساهمة](CONTRIBUTING.md)
- [BASOUL Brand Foundation](brand/basoul/README.md)
- [سجل تحقق Beta 1](docs/releases/BASOUL_BETA_1_RUNTIME_VERIFICATION_2026-08-10.md)
- [Ecosystem Pass C](docs/architecture/BASOUL_ECOSYSTEM_PASS_C_2026-08-10.md)
- [بنية مساحة العمل](docs/WORKSPACE_ARCHITECTURE.md)
- [مبادئ المنتج](docs/PRODUCT_PRINCIPLES.md)
- [خارطة طريق الذكاء الاصطناعي](docs/AI_ROADMAP.md)

تبقى ملاحظات الإصدارات التاريخية محفوظة كأدلة ولا يعاد تحريرها لتبدو كأنها الحالة الحالية.

## الترخيص

المشروع متاح وفق [ترخيص MIT](LICENSE).

---

**BASOUL OS** · تأسيس **YOSSEUF RADWAN** · Copyright © 2026 **ELSHENAWY RADWAN**