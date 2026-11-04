import type { Metadata } from "next";
import { DeletionRequestForm } from "./DeletionRequestForm";
export const metadata: Metadata = { title: "BASOUL OS — Account deletion request / طلب حذف الحساب" };
const support = "mailto:yosseuf.radwan@gmail.com?subject=BASOUL%20OS%20account%20deletion%20request";
export default function AccountDeletionPage() {
  return <main style={{ maxWidth: 900, margin: "40px auto", padding: 24, lineHeight: 1.9 }}>
    <section lang="ar" dir="rtl">
      <h1>BASOUL OS — طلب حذف الحساب والبيانات</h1>
      <p>المسؤول: ELSHENAWY RAFIK ELSHENAWY RADWAN. يمكنك تقديم الطلب دون تسجيل الدخول. نستخدم مسارًا يدويًا للتحقق ومراجعة البيانات المرتبطة؛ لا ينفذ هذا النموذج حذفًا تلقائيًا.</p>
      <ol><li>جهّز الطلب بالنموذج أدناه، ثم أرسله من البريد المرتبط بحسابك إلى <a href={support}>yosseuf.radwan@gmail.com</a>. إذا لم يفتح تطبيق البريد، أرسل رسالة مباشرة بالعنوان BASOUL OS account deletion request.</li><li>حدد حذف الحساب والبيانات المرتبطة أو البيانات المحددة، ومؤسسة العمل عند الحاجة لتحديد النطاق. لا ترسل كلمة مرور أو رمز دخول أو مستندات عملاء.</li><li>يتحقق المسؤول من ملكية البريد والحساب قبل التنفيذ، ثم يراجع الصلاحيات والسجلات والملفات المرتبطة ويبلغك بنطاق المعالجة والنتيجة.</li></ol>
      <p>بيانات الحساب الشخصية وصلاحيات الوصول والملفات تدخل في مراجعة النطاق. قد تبقى سجلات المؤسسة المشتركة التي لا يملك المستخدم حق حذفها، مع مراجعة إزالة ارتباطه الشخصي وصلاحياته. تُوضح أي فئة محتفظ بها وأسبابها في الرد. لا يمثل إرسال الطلب اكتمال الحذف، ولا نعد بحذف فوري من النسخ الاحتياطية أو مزودي الخدمة. لا توجد مدة عامة مثبتة للمحو الآلي. يُتابع الطلب عند وروده؛ تواصل عبر البريد نفسه لمتابعته.</p>
      <p><a href="/privacy">سياسة الخصوصية والاحتفاظ</a></p>
    </section>
    <hr />
    <section lang="en" dir="ltr">
      <h1>BASOUL OS — Account and associated-data deletion request</h1>
      <p>Operator: ELSHENAWY RAFIK ELSHENAWY RADWAN. No sign-in is required to request deletion. Requests use manual ownership verification and associated-data review; this form does not automatically erase data.</p>
      <ol><li>Prepare the request below, then send it from your registered account email to <a href={support}>yosseuf.radwan@gmail.com</a>. If no email app opens, email directly with subject BASOUL OS account deletion request.</li><li>Specify account and associated-data deletion or particular data, identifying the workspace only where needed. Do not include passwords, sign-in codes or customer documents.</li><li>The operator verifies email/account ownership before action, reviews linked permissions, records and files, and replies with the processing scope and outcome.</li></ol>
      <p>Personal account data, access permissions and files are included in scope review. Shared organization records outside your deletion authority may remain, with review of removal of personal links and access. Any retained categories and reasons are explained in the response. Sending a request is not completed deletion. We do not promise immediate erasure from backups or providers, and no universal automatic-erasure period has been established. Requests are followed up on receipt; use the same email for follow-up.</p>
      <p><a href="/privacy">Privacy and retention policy</a></p>
    </section>
    <DeletionRequestForm />
  </main>;
}
