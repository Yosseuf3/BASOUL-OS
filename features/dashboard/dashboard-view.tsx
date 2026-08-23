"use client";

import {
  Activity, BookOpen, ChevronLeft, ClipboardList, Film, FolderKanban, Plus, Sparkles, Target, Users, Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ActivityEvent, Client, FinanceTransaction, Notification, Project, Task } from "@/lib/types";
import { buildExecutiveInsight, buildExecutiveTimeline, getExecutiveDecision, type DecisionSignal, type DecisionTarget } from "@yosseuf/decision-engine";
import { useLanguage } from "@/components/i18n/language-provider";
import { supabase } from "@/lib/supabase";
import { resolveUserIdentity } from "@/lib/auth/user-identity";
import "./dashboard-visual-truth.css";

type QuickAction = "project" | "task" | "client" | "finance" | "knowledge" | "content";
type Props = { projects: Project[]; tasks: Task[]; clients: Client[]; financeItems: FinanceTransaction[]; activityEvents: ActivityEvent[]; notifications: Notification[]; userName?: string; onNavigate: (target: DecisionTarget) => void; onQuickAction: (action: QuickAction) => void };

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/BASOUL-OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;

export function DashboardView(props: Props) {
  const { locale, text } = useLanguage();
  const { projects, tasks, clients, financeItems, activityEvents, notifications, onNavigate, onQuickAction } = props;
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setUserName(resolveUserIdentity(data.session.user).displayName);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserName(session ? resolveUserIdentity(session.user).displayName : "User");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const decisionInput = { projects, tasks, clients, financeItems, activityEvents, notifications };
  const state = getExecutiveDecision(decisionInput, userName, locale);
  const s = state.stats;
  const health = state.health;
  const insight = buildExecutiveInsight(decisionInput, state, locale);
  const timeline = buildExecutiveTimeline(decisionInput, locale).slice(0, 4);
  const priorities = state.priorities.slice(0, 3);
  const netValue = financeItems.length ? `${money.format(s.net)} ${s.currency}` : "—";
  const healthAngle = `${Math.max(0, Math.min(100, health.score)) * 3.6}deg`;

  return (
    <div className="basoul-executive" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="bx-hero">
        <div>
          <span className="bx-kicker">BASOUL · EXECUTIVE PULSE</span>
          <h2>{state.brief.headline}</h2>
          <p>{state.brief.message}</p>
          <div className="bx-hero-tags">
            <span className="bx-chip">{String(s.activeProjects).padStart(2, "0")} {text("مشاريع نشطة", "active projects")}</span>
            <span className="bx-chip">{String(state.alerts.length).padStart(2, "0")} {text("إشارات تحتاج متابعة", "signals need attention")}</span>
            <span className="bx-chip">{health.score}% {text("صحة مساحة العمل", "workspace health")}</span>
          </div>
        </div>
        <div className="bx-health" style={{ "--health-angle": healthAngle } as React.CSSProperties}><div><strong>{health.score}%</strong><span>WORKSPACE HEALTH</span></div></div>
      </section>

      <section className="bx-grid-3">
        <MetricCard tone="blue" icon={<Target size={20} />} kicker="FOCUS" value={state.priorities.length || 0} title={text("أولويات اليوم", "Today's priorities")} text={state.priorities.length ? state.brief.priorityLine : text("لا توجد أولويات حرجة الآن.", "No critical priorities right now.")} />
        <MetricCard tone="cyan" icon={<FolderKanban size={20} />} kicker="PROJECTS" value={s.activeProjects} title={text("مشاريع نشطة", "Active projects")} text={s.stalledProjects ? text(`${s.stalledProjects} مشروع يحتاج استعادة الإيقاع.`, `${s.stalledProjects} project(s) need momentum restored.`) : text("المشاريع النشطة تسير دون توقف حرج.", "Active projects are moving without critical stoppages.")} />
        <MetricCard tone="violet" icon={<Wallet size={20} />} kicker="FINANCE" value={netValue} title={text("صافي التدفق", "Net flow")} text={s.pendingPayments ? text(`${s.pendingPayments} معاملات معلقة تحتاج مراجعة.`, `${s.pendingPayments} pending transaction(s) need review.`) : text("جميع المعاملات المالية محدثة.", "All financial transactions are up to date.")} />
      </section>

      <section className="bx-grid-2">
        <article className="bx-panel">
          <PanelHead kicker="EXECUTION" title={text("ما يحتاج انتباهك الآن", "What needs your attention now")} action={text("كل المهام", "All tasks")} onClick={() => onNavigate("tasks")} />
          {priorities.length ? <div className="bx-list">{priorities.map((item, index) => <PriorityRow key={item.id} item={item} index={index + 1} onClick={() => onNavigate(item.action.target)} />)}</div> : <EmptyState text={text("مساحة العمل مستقرة. يمكنك إضافة عنصر جديد وسيقوم محرك القرار بترتيبه تلقائيًا.", "The workspace is stable. Add a new item and the decision engine will prioritize it automatically.")} actions={[{ label: text("مهمة", "Task"), onClick: () => onQuickAction("task") }, { label: text("مشروع", "Project"), onClick: () => onQuickAction("project") }]} />}
        </article>
        <article className="bx-panel bx-signal">
          <PanelHead kicker="AI SIGNAL" title={text("إشارة BASOUL", "BASOUL Signal")} />
          <div className="bx-signal-visual"><span className="bx-ring r1" /><span className="bx-ring r2" /><span className="bx-ring r3" /><img src={BASOUL_SYMBOL} width="58" height="70" alt="BASOUL" /></div>
          <p>{insight.summary}</p>
        </article>
      </section>

      <section className="bx-grid-2">
        <article className="bx-panel">
          <PanelHead kicker="EXECUTIVE TIMELINE" title={text("ما حدث وما يستحق المتابعة", "What happened and what needs follow-up")} action={text("كل النشاط", "All activity")} onClick={() => onNavigate("activity")} />
          {timeline.length ? <div className="bx-timeline">{timeline.map((item) => <button key={item.id} onClick={() => onNavigate(item.target)}><span className="bx-timeline-icon"><Activity size={14} /></span><span><b>{item.title}</b><small>{item.detail} · {relativeTime(item.at, locale)}</small></span><ChevronLeft size={15} /></button>)}</div> : <EmptyState text={text("سيظهر هنا أثر العمليات الحية بمجرد بدء العمل داخل BASOUL.", "Live operational activity will appear here as soon as work begins in BASOUL.")} />}
        </article>
        <article className="bx-panel">
          <PanelHead kicker="FINANCE" title={text("الموقف المالي الحالي", "Current financial position")} action={text("فتح المالية", "Open finance")} onClick={() => onNavigate("finance")} />
          <p>{s.pendingPayments ? text(`${s.pendingPayments} معاملات معلقة تحتاج مراجعة.`, `${s.pendingPayments} pending transaction(s) need review.`) : text("لا توجد معاملات معلقة حاليًا.", "There are no pending transactions right now.")}</p>
          <div className="bx-finance"><div><small>{text("الدخل", "Income")}</small><b>{financeItems.length ? money.format(s.income) : "—"}</b></div><div><small>{text("المصروف", "Expense")}</small><b>{financeItems.length ? money.format(s.expense) : "—"}</b></div><div><small>{text("الصافي", "Net")}</small><b>{netValue}</b></div></div>
        </article>
      </section>

      <section className="bx-panel">
        <PanelHead kicker="QUICK ACTIONS" title={text("ابدأ الإجراء مباشرة", "Start an action directly")} />
        <div className="bx-quick">
          <QuickActionButton icon={<FolderKanban size={17} />} label={text("مشروع", "Project")} onClick={() => onQuickAction("project")} />
          <QuickActionButton icon={<ClipboardList size={17} />} label={text("مهمة", "Task")} onClick={() => onQuickAction("task")} />
          <QuickActionButton icon={<Users size={17} />} label={text("عميل", "Client")} onClick={() => onQuickAction("client")} />
          <QuickActionButton icon={<Wallet size={17} />} label={text("معاملة", "Transaction")} onClick={() => onQuickAction("finance")} />
          <QuickActionButton icon={<BookOpen size={17} />} label={text("معرفة", "Knowledge")} onClick={() => onQuickAction("knowledge")} />
          <QuickActionButton icon={<Film size={17} />} label={text("محتوى", "Content")} onClick={() => onQuickAction("content")} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ tone, icon, kicker, value, title, text }: { tone: "blue" | "cyan" | "violet"; icon: React.ReactNode; kicker: string; value: React.ReactNode; title: string; text: string }) { return <article className={`bx-card ${tone}`}><div className="bx-icon">{icon}</div><span className="bx-kicker">{kicker}</span><strong>{value}</strong><h3>{title}</h3><p>{text}</p></article>; }
function PanelHead({ kicker, title, action, onClick }: { kicker: string; title: string; action?: string; onClick?: () => void }) { return <header className="bx-panel-head"><div><span className="bx-kicker">{kicker}</span><h3>{title}</h3></div>{action && onClick ? <button onClick={onClick}>{action}</button> : <Sparkles size={18} color="#38B2F6" />}</header>; }
function PriorityRow({ item, index, onClick }: { item: DecisionSignal; index: number; onClick: () => void }) { const tone = item.severity === "critical" ? "danger" : item.severity === "warning" ? "warn" : "good"; return <button className="bx-row" onClick={onClick}><span className="bx-rank">{String(index).padStart(2, "0")}</span><span><b>{item.title}</b><small>{item.detail}</small></span><span className={`bx-dot ${tone}`} /></button>; }
function EmptyState({ text, actions = [] }: { text: string; actions?: Array<{ label: string; onClick: () => void }> }) { return <div className="bx-empty"><p>{text}</p>{actions.length > 0 && <div className="bx-actions">{actions.map((action) => <button key={action.label} onClick={action.onClick}><Plus size={14} /> {action.label}</button>)}</div>}</div>; }
function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick}>{icon}<b>{label}</b></button>; }
function relativeTime(value: string, locale: "ar" | "en") { const diff = Date.now() - new Date(value).getTime(); const min = Math.floor(diff / 60000); if (min < 1) return locale === "ar" ? "الآن" : "now"; if (min < 60) return locale === "ar" ? `منذ ${min} د` : `${min}m ago`; const hours = Math.floor(min / 60); if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`; return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { day: "numeric", month: "short" }).format(new Date(value)); }
