import { Activity, Bell, BrainCircuit, BriefcaseBusiness, ChevronLeft, CircleDollarSign, FolderKanban, LayoutDashboard, Search, Sparkles, Target, Users, WalletCards } from "lucide-react";
import "./review.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

const nav = [
  [LayoutDashboard, "لوحة القيادة", true],
  [FolderKanban, "المشاريع", false],
  [BrainCircuit, "الذكاء المعماري", false],
  [Target, "المهام", false],
  [Users, "العملاء", false],
  [WalletCards, "المالية", false],
  [Activity, "النشاط", false],
  [Bell, "الإشعارات", false],
] as const;

export default function BasoulReviewPage() {
  return (
    <main className="basoul-review" dir="rtl">
      <aside className="review-sidebar">
        <div className="review-brand" aria-label="BASOUL approved brand lockup">
          <img className="review-brand-symbol" src={BASOUL_SYMBOL} width="42" height="50" alt="BASOUL symbol" />
          <div className="review-brand-copy">
            <img className="review-brand-wordmark" src={BASOUL_WORDMARK} width="116" height="30" alt="BASOUL" />
            <span>AI-NATIVE ECOSYSTEM</span>
          </div>
        </div>
        <div className="review-workspace"><BriefcaseBusiness size={18}/><div><small>مساحة العمل</small><b>الإدارة</b></div><ChevronLeft size={16}/></div>
        <nav>{nav.map(([Icon,label,active]) => <button className={active ? "active" : ""} key={label}><Icon size={19}/><span>{label}</span></button>)}</nav>
        <div className="review-profile"><span>YR</span><div><b>Yosseuf</b><small>Founder / Executive</small></div></div>
      </aside>

      <section className="review-main">
        <header className="review-topbar">
          <div><span className="review-kicker">BASOUL · EXECUTIVE</span><h1>لوحة القيادة</h1><p>رؤية تنفيذية هادئة، واضحة، ومبنية للقرار.</p></div>
          <div className="review-actions"><label><Search size={18}/><input placeholder="بحث شامل…" /></label><button><Sparkles size={18}/> إجراء سريع</button></div>
        </header>

        <section className="review-hero">
          <div className="hero-copy"><span>EXECUTIVE PULSE</span><h2>صباح الخير، Yosseuf</h2><p>الوضع مستقر. مشروعان نشطان، لا توجد إشارات حرجة، والتركيز اليوم على استكمال التنفيذ.</p><div className="hero-tags"><i>02 مشاريع نشطة</i><i>00 مخاطر حرجة</i><i>76% صحة مساحة العمل</i></div></div>
          <div className="hero-orb"><div><strong>76%</strong><span>Workspace Health</span></div></div>
        </section>

        <section className="review-grid review-grid-3">
          <article className="review-card accent-blue"><div className="card-icon"><Target/></div><span>FOCUS</span><strong>3</strong><h3>أولويات اليوم</h3><p>لا توجد عوائق، ويمكن الحفاظ على إيقاع التنفيذ الحالي.</p></article>
          <article className="review-card accent-cyan"><div className="card-icon"><FolderKanban/></div><span>PROJECTS</span><strong>2</strong><h3>مشاريع نشطة</h3><p>كلا المشروعين ضمن النطاق المخطط دون انحرافات حرجة.</p></article>
          <article className="review-card accent-violet"><div className="card-icon"><CircleDollarSign/></div><span>FINANCE</span><strong>+3K</strong><h3>آخر حركة مالية</h3><p>تم تسجيل دفعة جديدة بقيمة 3,000 SAR.</p></article>
        </section>

        <section className="review-grid review-grid-2">
          <article className="review-panel">
            <header><div><span>EXECUTION</span><h3>ما يحتاج انتباهك الآن</h3></div><button>عرض الكل</button></header>
            <div className="decision-row"><span className="decision-rank">01</span><div><b>استكمال خطة التنفيذ للمشروع الرئيسي</b><small>أولوية اليوم · لا توجد عوائق</small></div><i className="status-dot good"/></div>
            <div className="decision-row"><span className="decision-rank">02</span><div><b>مراجعة المهام المفتوحة</b><small>3 مهام · 2 ضمن الجدول</small></div><i className="status-dot info"/></div>
            <div className="decision-row"><span className="decision-rank">03</span><div><b>تحديث ملف العميل النشط</b><small>متابعة خفيفة · غير حرجة</small></div><i className="status-dot violet"/></div>
          </article>
          <article className="review-panel signal-panel">
            <header><div><span>AI SIGNAL</span><h3>إشارة BASOUL</h3></div><Sparkles size={20}/></header>
            <div className="signal-visual"><div className="signal-ring r1"/><div className="signal-ring r2"/><div className="signal-ring r3"/><img className="signal-approved-symbol" src={BASOUL_SYMBOL} width="48" height="58" alt="BASOUL symbol"/></div>
            <p>لا توجد إشارات حرجة. أفضل خطوة الآن هي الحفاظ على سرعة التنفيذ بدل فتح مسارات جديدة.</p>
          </article>
        </section>
      </section>
    </main>
  );
}
