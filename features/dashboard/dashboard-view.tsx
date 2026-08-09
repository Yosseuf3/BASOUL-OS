"use client";

import {
  Activity,
  BookOpen,
  ChevronLeft,
  ClipboardList,
  Film,
  FolderKanban,
  Plus,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import type {
  ActivityEvent,
  Client,
  FinanceTransaction,
  Notification,
  Project,
  Task,
} from "@/lib/types";
import {
  buildExecutiveInsight,
  buildExecutiveTimeline,
  getExecutiveDecision,
  type DecisionSignal,
  type DecisionTarget,
} from "@yosseuf/decision-engine";
import "./dashboard-visual-truth.css";

type QuickAction = "project" | "task" | "client" | "finance" | "knowledge" | "content";

type Props = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  financeItems: FinanceTransaction[];
  activityEvents: ActivityEvent[];
  notifications: Notification[];
  userName?: string;
  onNavigate: (target: DecisionTarget) => void;
  onQuickAction: (action: QuickAction) => void;
};

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;

export function DashboardView(props: Props) {
  const {
    projects,
    tasks,
    clients,
    financeItems,
    activityEvents,
    notifications,
    userName = "Yosseuf",
    onNavigate,
    onQuickAction,
  } = props;

  const decisionInput = { projects, tasks, clients, financeItems, activityEvents, notifications };
  const state = getExecutiveDecision(decisionInput, userName);
  const s = state.stats;
  const health = state.health;
  const insight = buildExecutiveInsight(decisionInput, state);
  const timeline = buildExecutiveTimeline(decisionInput).slice(0, 4);
  const priorities = state.priorities.slice(0, 3);
  const netValue = financeItems.length ? `${money.format(s.net)} ${s.currency}` : "—";
  const healthAngle = `${Math.max(0, Math.min(100, health.score)) * 3.6}deg`;

  return (
    <div className="basoul-executive" dir="rtl">
      <section className="bx-hero">
        <div>
          <span className="bx-kicker">BASOUL · EXECUTIVE PULSE</span>
          <h2>{state.brief.headline}</h2>
          <p>{state.brief.message}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">{String(s.activeProjects).padStart(2, "0")} مشاريع نشطة</span>
            <span className="bx-chip">{String(state.alerts.length).padStart(2, "0")} إشارات تحتاج متابعة</span>
            <span className="bx-chip">{health.score}% صحة مساحة العمل</span>
          </div>
        </div>
        <div className="bx-health" style={{ "--health-angle": healthAngle } as React.CSSProperties}>
          <div>
            <strong>{health.score}%</strong>
            <span>WORKSPACE HEALTH</span>
          </div>
        </div>
      </section>

      <section className="bx-grid-3">
        <MetricCard
          tone="blue"
          icon={<Target size={20} />}
          kicker="FOCUS"
          value={state.priorities.length || 0}
          title="أولويات اليوم"
          text={state.priorities.length ? state.brief.priorityLine : "لا توجد أولويات حرجة الآن."}
        />
        <MetricCard
          tone="cyan"
          icon={<FolderKanban size={20} />}
          kicker="PROJECTS"
          value={s.activeProjects}
          title="مشاريع نشطة"
          text={s.stalledProjects ? `${s.stalledProjects} مشروع يحتاج استعادة الإيقاع.` : "المشاريع النشطة تسير دون توقف حرج."}
        />
        <MetricCard
          tone="violet"
          icon={<Wallet size={20} />}
          kicker="FINANCE"
          value={netValue}
          title="صافي التدفق"
          text={s.pendingPayments ? `${s.pendingPayments} معاملات معلقة تحتاج مراجعة.` : "جميع المعاملات المالية محدثة."}
        />
      </section>

      <section className="bx-grid-2">
        <article className="bx-panel">
          <PanelHead kicker="EXECUTION" title="ما يحتاج انتباهك الآن" action="كل المهام" onClick={() => onNavigate("tasks")} />
          {priorities.length ? (
            <div className="bx-list">
              {priorities.map((item, index) => (
                <PriorityRow key={item.id} item={item} index={index + 1} onClick={() => onNavigate(item.action.target)} />
              ))}
            </div>
          ) : (
            <EmptyState
              text="مساحة العمل مستقرة. يمكنك إضافة عنصر جديد وسيقوم محرك القرار بترتيبه تلقائيًا."
              actions={[
                { label: "مهمة", onClick: () => onQuickAction("task") },
                { label: "مشروع", onClick: () => onQuickAction("project") },
              ]}
            />
          )}
        </article>

        <article className="bx-panel bx-signal">
          <PanelHead kicker="AI SIGNAL" title="إشارة BASOUL" />
          <div className="bx-signal-visual">
            <span className="bx-ring r1" />
            <span className="bx-ring r2" />
            <span className="bx-ring r3" />
            <img src={BASOUL_SYMBOL} width="58" height="70" alt="BASOUL" />
          </div>
          <p>{insight.summary}</p>
        </article>
      </section>

      <section className="bx-grid-2">
        <article className="bx-panel">
          <PanelHead kicker="EXECUTIVE TIMELINE" title="ما حدث وما يستحق المتابعة" action="كل النشاط" onClick={() => onNavigate("activity")} />
          {timeline.length ? (
            <div className="bx-timeline">
              {timeline.map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.target)}>
                  <span className="bx-timeline-icon"><Activity size={14} /></span>
                  <span><b>{item.title}</b><small>{item.detail} · {relativeTime(item.at)}</small></span>
                  <ChevronLeft size={15} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState text="سيظهر هنا أثر العمليات الحية بمجرد بدء العمل داخل BASOUL." />
          )}
        </article>

        <article className="bx-panel">
          <PanelHead kicker="FINANCE" title="الموقف المالي الحالي" action="فتح المالية" onClick={() => onNavigate("finance")} />
          <p>{s.pendingPayments ? `${s.pendingPayments} معاملات معلقة تحتاج مراجعة.` : "لا توجد معاملات معلقة حاليًا."}</p>
          <div className="bx-finance">
            <div><small>الدخل</small><b>{financeItems.length ? money.format(s.income) : "—"}</b></div>
            <div><small>المصروف</small><b>{financeItems.length ? money.format(s.expense) : "—"}</b></div>
            <div><small>الصافي</small><b>{netValue}</b></div>
          </div>
        </article>
      </section>

      <section className="bx-panel">
        <PanelHead kicker="QUICK ACTIONS" title="ابدأ الإجراء مباشرة" />
        <div className="bx-quick">
          <QuickActionButton icon={<FolderKanban size={17} />} label="مشروع" onClick={() => onQuickAction("project")} />
          <QuickActionButton icon={<ClipboardList size={17} />} label="مهمة" onClick={() => onQuickAction("task")} />
          <QuickActionButton icon={<Users size={17} />} label="عميل" onClick={() => onQuickAction("client")} />
          <QuickActionButton icon={<Wallet size={17} />} label="معاملة" onClick={() => onQuickAction("finance")} />
          <QuickActionButton icon={<BookOpen size={17} />} label="معرفة" onClick={() => onQuickAction("knowledge")} />
          <QuickActionButton icon={<Film size={17} />} label="محتوى" onClick={() => onQuickAction("content")} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ tone, icon, kicker, value, title, text }: { tone: "blue" | "cyan" | "violet"; icon: React.ReactNode; kicker: string; value: React.ReactNode; title: string; text: string }) {
  return (
    <article className={`bx-card ${tone}`}>
      <div className="bx-icon">{icon}</div>
      <span className="bx-kicker">{kicker}</span>
      <strong>{value}</strong>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function PanelHead({ kicker, title, action, onClick }: { kicker: string; title: string; action?: string; onClick?: () => void }) {
  return (
    <header className="bx-panel-head">
      <div><span className="bx-kicker">{kicker}</span><h3>{title}</h3></div>
      {action && onClick ? <button onClick={onClick}>{action}</button> : <Sparkles size={18} color="#38B2F6" />}
    </header>
  );
}

function PriorityRow({ item, index, onClick }: { item: DecisionSignal; index: number; onClick: () => void }) {
  const tone = item.severity === "critical" ? "danger" : item.severity === "warning" ? "warn" : "good";
  return (
    <button className="bx-row" onClick={onClick}>
      <span className="bx-rank">{String(index).padStart(2, "0")}</span>
      <span><b>{item.title}</b><small>{item.detail}</small></span>
      <span className={`bx-dot ${tone}`} />
    </button>
  );
}

function EmptyState({ text, actions = [] }: { text: string; actions?: Array<{ label: string; onClick: () => void }> }) {
  return (
    <div className="bx-empty">
      <p>{text}</p>
      {actions.length > 0 && <div className="bx-actions">{actions.map((action) => <button key={action.label} onClick={action.onClick}><Plus size={14} /> {action.label}</button>)}</div>}
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick}>{icon}<b>{label}</b></button>;
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `منذ ${min} د`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(new Date(value));
}
