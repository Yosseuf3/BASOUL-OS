# BASOUL Mobile

تطبيق Expo / React Native ضمن منظومة BASOUL، ويستخدم نفس منطق الأعمال وخدمات البيانات المعتمدة مع الحفاظ على حدود المنصة المحمولة.

## الهوية الحالية

- الاسم المرئي: **BASOUL**
- الإصدار: `4.0.0`
- قناة المنتج: `v4.0.0-rc.1 / Beta`
- الهوية البصرية: BASOUL Brand Foundation
- YVL: للميكانيكا فقط مثل spacing وRTL وإمكانية الوصول والحركة

تظل المعرّفات التقنية الحالية مثل `slug` وscheme وiOS bundle identifier وAndroid package وEAS project ID كما هي إلى أن تتم الموافقة على migration مستقلة لها.

## الإعداد

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

أدخل في `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## الوظائف الحالية

- تسجيل الدخول والجلسة المستمرة
- Dashboard ببيانات حية
- عرض المشاريع
- عرض الإشعارات وتحديدها كمقروءة
- تحديث البيانات وتسجيل الخروج

## ملاحظة

تطبيق الهاتف له تثبيت npm مستقل عن تطبيق Next.js لحماية توافق React وExpo. لا يتم تغيير Supabase Production أو RLS/Auth أو معرّفات التوقيع ضمن أعمال التوحيد البصري.

Copyright © 2026 ELSHENAWY RADWAN. All rights reserved.