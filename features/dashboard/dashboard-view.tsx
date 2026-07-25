"use client";
import { Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ClipboardList, Clock3, Film, FolderKanban, Plus, Sparkles, Users, Wallet } from "lucide-react";
import type { ActivityEvent, Client, FinanceTransaction, Notification, Project, Task } from "@/lib/types";
import { buildDashboardDecision, type DecisionItem, type DecisionTarget } from "@/core/intelligence";
import { calculateWorkspaceHealth } from "@/packages/intelligence/src";

type QuickAction = "project"|"task"|"client"|"finance"|"knowledge"|"content";
type Props={projects:Project[];tasks:Task[];clients:Client[];financeItems:FinanceTransaction[];activityEvents:ActivityEvent[];notifications:Notification[];userName?:string;onNavigate:(target:DecisionTarget)=>void;onQuickAction:(action:QuickAction)=>void};
const money=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});

export function DashboardView(props:Props){
 const {projects,tasks,clients,financeItems,activityEvents,notifications,userName="Yosseuf",onNavigate,onQuickAction}=props;
 const state=buildDashboardDecision({projects,tasks,clients,financeItems,activityEvents,notifications},userName); const s=state.stats;
 const health=calculateWorkspaceHealth({projects,tasks,clients,financeItems,notifications});
 const recent=activityEvents.slice(0,5);
 const focus=state.focus.slice(0,3);
 const healthNotes=[
  s.overdueTasks?`${s.overdueTasks} مهام متأخرة تحتاج معالجة`:"لا توجد مهام متأخرة",
  s.stalledProjects?`${s.stalledProjects} مشاريع متوقفة`:"المشاريع تسير دون توقف",
  s.pendingPayments?`${s.pendingPayments} معاملات مالية معلقة`:"المعاملات المالية محدثة"
 ];
 return <div className="dashboard-v2 executive-dashboard">
  <section className="executive-hero panel">
   <div className="executive-greeting"><span className="section-kicker"><Sparkles size={14}/> الملخص التنفيذي</span><h2>{state.brief.headline}</h2><p>{state.brief.message}</p><strong>{state.brief.priorityLine}</strong></div>
   <div className="hero-focus"><span className="hero-label">تركيز اليوم</span>{focus.length?<ol>{focus.map(item=><li key={item.id}><button onClick={()=>onNavigate(item.target)}><span>{item.title}</span><ChevronLeft size={14}/></button></li>)}</ol>:<div className="hero-empty"><CheckCircle2 size={17}/><span>لا توجد أولويات حرجة</span><button onClick={()=>onQuickAction("task")}>إضافة مهمة</button></div>}</div>
   <div className="hero-meta"><span><CalendarDays size={17}/>{new Intl.DateTimeFormat("ar-SA",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</span><button className="hero-health-link" onClick={()=>onNavigate("dashboard")}><small>صحة مساحة العمل</small><b>{health.score}%</b><em>{health.label}</em></button></div>
  </section>

  <section className="dashboard-v2-grid executive-primary">
   <article className="panel focus-panel"><PanelHead kicker="أولويات اليوم" title="ما الذي يحتاج انتباهك الآن؟" action="كل المهام" onClick={()=>onNavigate("tasks")}/><div className="decision-list">{state.focus.length?state.focus.map((i,n)=><DecisionRow key={i.id} item={i} index={n+1} onClick={()=>onNavigate(i.target)}/>):<SmartEmpty icon={<CheckCircle2/>} title="لا توجد أولويات حرجة" text="ابدأ بإضافة عنصر عمل، وسيرتبه محرك القرار تلقائيًا." actions={[{label:"مهمة",onClick:()=>onQuickAction("task")},{label:"مشروع",onClick:()=>onQuickAction("project")},{label:"عميل",onClick:()=>onQuickAction("client")}]} />}</div></article>
   <article className="panel health-card"><div className="health-card-head"><div><span className="section-kicker">Workspace Health 2.0</span><h2>حالة مساحة العمل</h2></div><span className={`health-status health-${health.score>=90?"excellent":health.score>=70?"good":"attention"}`}>{health.label}</span></div><div className="health-main"><div className="health-ring" style={{"--health-score":`${health.score*3.6}deg`} as React.CSSProperties}><div><strong>{health.score}%</strong><small>الصحة العامة</small></div></div><div className="health-insights">{healthNotes.map((note,index)=><span key={note} className={index<health.issues?"issue":"ok"}>{index<health.issues?<AlertTriangle size={14}/>:<CheckCircle2 size={14}/>} {note}</span>)}</div></div><button className="health-action" onClick={()=>onNavigate(health.issues?"notifications":"dashboard")}>{health.issues?"راجع نقاط التحسين":"كل الأنظمة مستقرة"}<ChevronLeft size={15}/></button></article>
  </section>

  <section className="decision-kpis executive-kpis">
   <Kpi icon={<FolderKanban/>} label="المشاريع" value={`${s.activeProjects} نشط`} context={s.stalledProjects?`${s.stalledProjects} متوقف`:`${projects.length} إجمالي`} tone={s.stalledProjects?"warning":"positive"} onClick={()=>onNavigate("projects")}/>
   <Kpi icon={<ClipboardList/>} label="التنفيذ" value={`${s.completion}%`} context={s.overdueTasks?`${s.overdueTasks} متأخرة`:`${s.doneTasks} مكتملة`} tone={s.overdueTasks?"critical":"positive"} onClick={()=>onNavigate("tasks")}/>
   <Kpi icon={<Users/>} label="العملاء" value={`${s.activeClients} نشط`} context={s.followUps?`${s.followUps} متابعة مطلوبة`:`${clients.length} إجمالي`} tone={s.followUps?"warning":"neutral"} onClick={()=>onNavigate("clients")}/>
   <Kpi icon={<Wallet/>} label="التدفق المالي" value={financeItems.length?`${money.format(s.net)} ${s.currency}`:"—"} context={s.pendingPayments?`${s.pendingPayments} معلقة`:"محدث"} tone={s.net<0?"critical":"positive"} onClick={()=>onNavigate("finance")}/>
  </section>

  <section className="dashboard-v2-grid lower">
   <article className="panel finance-v2"><PanelHead kicker="الملخص المالي" title="الموقف المالي الحالي" action="فتح المالية" onClick={()=>onNavigate("finance")}/><div className="finance-v2-balance"><small>صافي التدفق</small><strong className={s.net<0?"negative":""}>{financeItems.length?`${money.format(s.net)} ${s.currency}`:"—"}</strong><span>{s.pendingPayments?`${s.pendingPayments} معاملات معلقة تحتاج مراجعة`:"جميع المعاملات محدثة"}</span></div><div className="finance-v2-breakdown"><span><ArrowUpRight/><small>الدخل</small><b>{financeItems.length?money.format(s.income):"—"}</b></span><span><ArrowDownLeft/><small>المصروف</small><b>{financeItems.length?money.format(s.expense):"—"}</b></span><span><Clock3/><small>المعلق</small><b>{s.pendingPayments}</b></span></div></article>
   <article className="panel activity-v2"><PanelHead kicker="آخر النشاطات" title="آخر التحديثات" action="كل النشاط" onClick={()=>onNavigate("activity")}/><div className="activity-v2-list">{recent.length?recent.map(e=><button key={e.id} onClick={()=>onNavigate("activity")}><span className="activity-dot"><Activity size={14}/></span><span><b>{e.title}</b><small>{e.module} · {relativeTime(e.created_at)}</small></span><ChevronLeft size={15}/></button>):<SmartEmpty icon={<Activity/>} title="لا يوجد نشاط بعد" text="سيظهر هنا أثر كل عملية تنفذها داخل النظام." actions={[{label:"إنشاء مشروع",onClick:()=>onQuickAction("project")}]} />}</div></article>
  </section>
  <section className="panel quick-actions-v2"><div><span className="section-kicker">إجراءات سريعة</span><h2>ابدأ الإجراء مباشرة من لوحة القيادة</h2></div><div className="quick-actions-grid"><Quick icon={<FolderKanban/>} label="مشروع" onClick={()=>onQuickAction("project")}/><Quick icon={<ClipboardList/>} label="مهمة" onClick={()=>onQuickAction("task")}/><Quick icon={<Users/>} label="عميل" onClick={()=>onQuickAction("client")}/><Quick icon={<Wallet/>} label="معاملة" onClick={()=>onQuickAction("finance")}/><Quick icon={<BookOpen/>} label="معرفة" onClick={()=>onQuickAction("knowledge")}/><Quick icon={<Film/>} label="محتوى" onClick={()=>onQuickAction("content")}/></div></section>
 </div>
}
function PanelHead({kicker,title,action,onClick}:{kicker:string;title:string;action:string;onClick:()=>void}){return <div className="panel-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div><button className="text-link" onClick={onClick}>{action}<ChevronLeft size={15}/></button></div>}
function DecisionRow({item,index,onClick}:{item:DecisionItem;index:number;onClick:()=>void}){return <button className={`decision-row ${item.tone}`} onClick={onClick}><span className="decision-rank">{index}</span><span><b>{item.title}</b><small>{item.detail}</small></span><span className="decision-score">{item.score}</span><ChevronLeft size={16}/></button>}
function Kpi({icon,label,value,context,tone,onClick}:{icon:React.ReactNode;label:string;value:string|number;context:string;tone:string;onClick:()=>void}){return <button className={`decision-kpi panel ${tone}`} onClick={onClick}><span className="kpi-icon">{icon}</span><span><small>{label}</small><strong>{value}</strong><p>{context}</p></span><ChevronLeft size={17}/></button>}
function Quick({icon,label,onClick}:{icon:React.ReactNode;label:string;onClick:()=>void}){return <button onClick={onClick}><span>{icon}</span><b>{label}</b><Plus size={15}/></button>}
function SmartEmpty({icon,title,text,actions=[]}:{icon:React.ReactNode;title:string;text:string;actions?:Array<{label:string;onClick:()=>void}>}){return <div className="smart-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{actions.length>0&&<div className="smart-empty-actions">{actions.map(action=><button key={action.label} onClick={action.onClick}><Plus size={14}/>{action.label}</button>)}</div>}</div>}
function relativeTime(value:string){const diff=Date.now()-new Date(value).getTime();const min=Math.floor(diff/60000);if(min<1)return"الآن";if(min<60)return`منذ ${min} د`;const h=Math.floor(min/60);if(h<24)return`منذ ${h} س`;return new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short"}).format(new Date(value));}
