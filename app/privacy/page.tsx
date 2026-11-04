import type { Metadata } from "next";

export const metadata: Metadata = { title: "BASOUL OS — Privacy policy / سياسة الخصوصية" };
const contact = "yosseuf.radwan@gmail.com";

export default function PrivacyPage() {
  return <main style={{ maxWidth: 900, margin: "40px auto", padding: 24, lineHeight: 1.9 }}>
    <section lang="ar" dir="rtl" aria-labelledby="privacy-ar">
      <h1 id="privacy-ar">سياسة خصوصية BASOUL OS</h1>
      <p>آخر تحديث: 3 نوفمبر 2026. تشمل هذه السياسة تطبيق Android وتطبيق الويب وخدمات API والخدمات الخلفية المرتبطة بمنظومة BASOUL OS. المسؤول: ELSHENAWY RAFIK ELSHENAWY RADWAN. التواصل: <a href={`mailto:${contact}`}>{contact}</a>. الخدمة مخصصة للبالغين 18 عامًا فأكثر.</p>
      <h2>البيانات وأغراض استخدامها</h2>
      <p>نعالج البريد وبيانات الدخول ومعرّف المستخدم وعضوية المؤسسة وصلاحياتها للمصادقة وإدارة الحساب والوصول. تُرسل بيانات الدخول إلى Supabase، ويُحفظ سياق الجلسة محليًا لاستمرار الدخول. تسجيل الخروج لا يحذف الحساب.</p>
      <p>نعالج المشاريع والمهام والإشعارات وحالة قراءتها والملاحظات والتعليقات والملفات والصور والمخططات ونتائج التحليل التي تقدمها أو يتيحها فريقك وفق الصلاحيات. تتضمن الملفات محتواها واسمها ونوعها وحجمها ومعرّفات ربطها. لا ترفع معلومات لا تملك صلاحية معالجتها.</p>
      <p>تعالج خدمات البوابة والمصادقة معلومات الشبكة والعميل والجلسة والأخطاء وتوقيت الاستجابة وبصمة الاتصال التقنية، بما فيها المدينة والبلد المستنتجان من عنوان الشبكة، لتشغيل الخدمة وحمايتها ومراقبة الأداء. هذه ليست مطالبة بجمع GPS أو معرّف إعلاني. لا يتضمن تنفيذ التطبيق المفحوص وظائف إعلانية.</p>
      <h2>المزودون ومعالجة الملفات</h2>
      <p>نستخدم Supabase للمصادقة وقواعد البيانات وتخزين الملفات، وVercel لاستضافة الويب وخدماته. منطقة مشروع قاعدة البيانات الحالية اليابان، وقد تجري معالجة أخرى خارجها أو خارج بلدك بواسطة المزودين ومقاوليهم الفرعيين.</p>
      <p>عند استخدام تحليل المخططات، تُرسل محتويات PDF أو الصور المختارة واسم الملف إلى OpenAI لإنتاج التحليل، وتُحفظ النتائج في مساحة العمل. يحدد مسار التحليل الحالي store:false، لكنه لا يلغي جميع احتفاظ المزود أو سجلات مكافحة الإساءة. لم نثبت إعداد المشاركة الاختيارية لتحسين النماذج للحساب المرتبط بمفتاح الخدمة الحالي، لذلك لا نضمن استثناء الملفات المرسلة من هذه المشاركة. لا نقدم ضمان Zero Data Retention. راجع <a href="https://developers.openai.com/api/docs/guides/your-data">ضوابط بيانات OpenAI</a> لمعرفة الاحتفاظ والاستثناءات المعمول بها.</p>
      <p>قد تتضمن وحدات الويب سجلات عملاء ومحتوى ومعرفة ودخل ومصروفات يدخلها المستخدم. محادثات الويب المتكاملة تُرسل النص والسياق المصرح به إلى BASOUL AI الذي يستخدم OpenAI في المسار المنشور المفحوص، وقد تُحفظ الجلسات والنتائج بحسب نوع الجلسة. لا يحدد مسار المحادثة المفحوص store:false صراحةً. لا يعني ذلك أن إصدار Android يوفر جميع وظائف الويب أو خدمات دفع أو مصرفية.</p>
      <h2>الوصول والأمان</h2>
      <p>تتاح بيانات مساحة العمل للأعضاء المصرح لهم وفق العضوية والصلاحيات، وتعالج لدى المزودين اللازمين للوظائف المستخدمة. تستخدم المسارات المفحوصة HTTPS وضوابط مرتبطة بالمؤسسة والحساب. لا ندعي تشفيرًا من طرف إلى طرف أو انعدام المخاطر. نقل البيانات إلى مزود خارجي لا يعني أنها لا تُجمع.</p>
      <h2>الاحتفاظ والحذف</h2>
      <p>نحتفظ ببيانات الحساب ومساحة العمل بحسب الحاجة إلى تقديم الخدمة وإدارة الوصول ومعالجة الطلبات. لا توجد مدة عامة مثبتة للحذف الآلي لجميع الفئات. توجد نسخ استعادة يدوية مشفرة ومقيدة الوصول، منفصلة عن النسخ التي يديرها المزودون؛ تُراجع الحاجة إليها وصلاحيتها قبل أي قرار حذف. لا نعد بمحو فوري من النسخ الاحتياطية أو سجلات المزودين، ولا نعمم الهدف التشغيلي الداخلي على مدة حذف جميع البيانات.</p>
      <p>لطلب مراجعة بياناتك أو تصحيحها أو حذف حسابك وبياناته، استخدم <a href="/account-deletion">صفحة طلب حذف الحساب</a> أو بريد التواصل. الطلب يُعالج يدويًا بعد التحقق من ملكية الحساب والصلاحية على السجلات. لا ترسل كلمة مرور أو رمز دخول. تسجيل الطلب لا يعني اكتمال الحذف؛ وقد تتطلب البيانات المشتركة إزالة الارتباط الشخصي أو مراجعة حقوق الآخرين بدل حذف سجل المؤسسة كاملًا. نوضح في الرد نطاق التنفيذ وأي بيانات متبقية وأسبابها، ولا نفترض استثناءً قانونيًا دائمًا دون أساس محدد.</p>
      <p>تُتابع الطلبات عند وصولها وتوثق مراحل الاستلام والتحقق والتنفيذ والإغلاق. تُراجع سجلات الطلبات كل 90 يومًا كرقابة إضافية، وليست هذه مهلة للمعالجة أو وعدًا بمحو البيانات. تحدد الحاجة التشغيلية والمتطلبات الفعلية مدة بقاء السجل. تُنشر تحديثات السياسة المعتمدة هنا مع تاريخها.</p>
    </section>
    <hr />
    <section lang="en" dir="ltr" aria-labelledby="privacy-en">
      <h1 id="privacy-en">BASOUL OS Privacy Policy</h1>
      <p>Last updated: November 3, 2026. This policy covers BASOUL OS Android, Web, APIs and connected backend services. Operator: ELSHENAWY RAFIK ELSHENAWY RADWAN. Contact: <a href={`mailto:${contact}`}>{contact}</a>. The service is intended for adults aged 18 and over.</p>
      <h2>Data and purposes</h2>
      <p>We process email addresses, sign-in information, user identifiers, organization membership and permissions for authentication, account administration and access. Credentials are sent to Supabase, and session context is persisted locally to maintain sign-in. Signing out does not delete an account.</p>
      <p>We process projects, tasks, notifications and read state, notes, comments, files, images, drawings and analysis results supplied by you or made available by your team according to permissions. Files include content, name, type, size and linking identifiers. Submit only information you are authorized to process.</p>
      <p>Gateway and authentication services process network addresses, client/session information, errors, response timings and technical connection fingerprints, including network-inferred city and country, for operation, security and performance monitoring. This does not establish GPS or advertising-ID collection. No advertising functionality was identified in the inspected app implementation.</p>
      <h2>Providers and file processing</h2>
      <p>We use Supabase for authentication, database and file storage, and Vercel for Web hosting and services. The current database project region is Japan; other processing by providers and subprocessors may occur elsewhere and outside your country.</p>
      <p>Drawing analysis sends selected PDF/image content and filenames to OpenAI and saves results in the workspace. Current analysis requests use store:false; this does not eliminate all provider retention or abuse-monitoring logs. We have not verified the optional model-improvement sharing setting associated with the current service credential, so we cannot guarantee that submitted files are excluded from that sharing. We make no Zero Data Retention claim. See <a href="https://developers.openai.com/api/docs/guides/your-data">OpenAI data controls</a> for retention and applicable exceptions.</p>
      <p>Web modules may hold user-entered client, content, knowledge and income/expense records. Integrated Web conversation sends messages and authorized context to BASOUL AI, whose inspected deployed path uses OpenAI; sessions and results may be saved according to session type. The inspected conversation path does not explicitly set store:false. Android does not necessarily provide all Web features, payment or banking services.</p>
      <h2>Access and security</h2>
      <p>Authorized workspace members can access records according to membership and permissions. Providers process data required for the functions used. Inspected service paths use HTTPS and account/organization access controls. We do not claim end-to-end encryption or freedom from risk. External processing still involves data collection.</p>
      <h2>Retention and deletion</h2>
      <p>Account and workspace data are retained according to the need to provide services, administer access and handle requests. No universal automatic-deletion period has been established. Restricted, encrypted manual recovery copies exist separately from provider-managed copies; their need and restore suitability are reviewed before deletion decisions. We do not promise immediate erasure from backups or provider logs, or represent an internal operating target as a deadline for all data.</p>
      <p>To request review, correction, or deletion of your account and associated data, use the <a href="/account-deletion">account-deletion request page</a> or contact email. Requests are handled manually after account-ownership and record-authority verification. Do not send passwords or sign-in codes. A request is not completed erasure. Shared records may require removal of personal links or review of others’ rights rather than erasing an entire organization record. The response explains the scope fulfilled and any retained categories and reasons; no indefinite legal exception is assumed without a specific basis.</p>
      <p>Requests are followed up on receipt, with receipt, verification, fulfillment and closure recorded. A 90-day review of the request register is an additional operational control, not a processing deadline or erasure promise. Actual operational and legal needs govern register retention. Approved policy changes are published here with their date.</p>
    </section>
  </main>;
}
