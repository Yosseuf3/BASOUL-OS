# YOSSEUF OS Mobile — v1.5.0

تطبيق Expo متصل بنفس Supabase المستخدم في منصة الويب.

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
- تسجيل الدخول والجلسة المستمرة.
- Dashboard ببيانات حية.
- عرض المشاريع.
- عرض الإشعارات وتحديدها كمقروءة.
- تحديث البيانات وتسجيل الخروج.

## ملاحظة
تطبيق الهاتف له تثبيت npm مستقل عن تطبيق Next.js لحماية توافق React وExpo.
