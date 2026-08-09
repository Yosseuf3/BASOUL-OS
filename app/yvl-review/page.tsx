import { Badge, Button, Card, Input, Panel, Status, TableContainer } from "@/components/ui/yvl-primitives";

const metrics = [
  ["المشاريع النشطة", "12", "success"],
  ["المهام الحرجة", "4", "danger"],
  ["صحة التشغيل", "92%", "accent"],
] as const;

export default function YvlReviewPage() {
  return <main className="yvl-review-page" aria-labelledby="yvl-review-title">
    <header className="yvl-review-header">
      <div><span className="section-kicker">BASOUL · YVL PRODUCT REVIEW</span><h1 id="yvl-review-title">تكامل المنتج المرئي</h1><p>واجهة تحقق معزولة للسطوح والحالات والطباعة العربية واتجاه RTL.</p></div>
      <Badge tone="accent">Preview fixture</Badge>
    </header>

    <section aria-labelledby="executive-fixture-title">
      <h2 id="executive-fixture-title">Executive / Dashboard</h2>
      <div className="yvl-review-metrics">
        {metrics.map(([label, value, tone]) => <Card key={label}><Status tone={tone}>{label}</Status><strong>{value}</strong><small>آخر تحديث الآن</small></Card>)}
      </div>
      <div className="yvl-review-grid">
        <Panel><span className="section-kicker">EXECUTIVE BRIEF</span><h3>الأولوية التشغيلية اليوم</h3><p>إغلاق المخاطر الحرجة في المشاريع النشطة قبل توسيع نطاق التسليم.</p><Button className="primary">فتح مركز القيادة</Button></Panel>
        <Panel><h3>بحث موحد</h3><label>ابحث في BASOUL<Input placeholder="مشروع، مهمة، مستند…" /></label><p><Status tone="success">الخدمات متصلة</Status></p></Panel>
      </div>
    </section>

    <section aria-labelledby="administration-fixture-title">
      <h2 id="administration-fixture-title">Administration</h2>
      <Panel><div className="panel-head"><div><span className="section-kicker">ORGANIZATION</span><h3>أعضاء المؤسسة</h3></div><Button className="primary">دعوة عضو</Button></div>
        <TableContainer><table><thead><tr><th>العضو</th><th>الدور</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>
          <tr><td>YOSSEUF RADWAN</td><td><Badge tone="accent">owner</Badge></td><td><Status tone="success">active</Status></td><td>—</td></tr>
          <tr><td>عضو تجريبي</td><td><Badge>member</Badge></td><td><Status tone="warning">invited</Status></td><td><Button className="ghost">إلغاء</Button></td></tr>
        </tbody></table></TableContainer>
      </Panel>
    </section>
  </main>;
}
