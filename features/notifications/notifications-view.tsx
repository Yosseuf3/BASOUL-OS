"use client";
import { AlertTriangle, Bell, CheckCheck, ChevronLeft, Circle, Info, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityModule, Notification, NotificationPriority } from "@/lib/types";

type View = "dashboard" | "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance" | "activity" | "notifications";
type Filter = "all" | "unread" | NotificationPriority;
const moduleLabels: Record<ActivityModule,string>={projects:"المشاريع",tasks:"المهام",clients:"العملاء",content:"المحتوى",knowledge:"المعرفة",finance:"المالية",system:"النظام"};
const priorityLabels: Record<NotificationPriority,string>={high:"عالية",medium:"متوسطة",info:"معلومات"};

export function NotificationsView({notifications,onNavigate,onToggleRead,onMarkAll,onDelete}:{notifications:Notification[];onNavigate:(v:View)=>void;onToggleRead:(n:Notification)=>void;onMarkAll:()=>void;onDelete:(n:Notification)=>void}){
 const [query,setQuery]=useState(""); const [filter,setFilter]=useState<Filter>("all");
 const filtered=useMemo(()=>notifications.filter(n=>{const q=query.trim().toLowerCase();return(!q||[n.title,n.message,moduleLabels[n.module]].some(v=>(v??"").toLowerCase().includes(q)))&&(filter==="all"||(filter==="unread"?!n.is_read:n.priority===filter));}),[notifications,query,filter]);
 const unread=notifications.filter(n=>!n.is_read).length;
 function open(n:Notification){if(!n.is_read)onToggleRead(n);if(n.module!=="system")onNavigate(n.module as View)}
 return <section className="notifications-page">
  <div className="panel notification-summary"><div><span className="section-kicker">NOTIFICATION CENTER</span><h2>{unread?`${unread} إشعار غير مقروء`:'أنت على اطلاع كامل'}</h2><p>{unread?'راجع العناصر المهمة ثم انتقل مباشرة إلى مصدرها.':'لا توجد إشعارات جديدة الآن.'}</p></div><button className="secondary" onClick={onMarkAll} disabled={!unread}><CheckCheck size={17}/> تعليم الكل كمقروء</button></div>
  <div className="panel notification-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث في الإشعارات..."/></div><div className="notification-filters">{([['all','الكل'],['unread','غير المقروءة'],['high','عالية'],['medium','متوسطة'],['info','معلومات']] as [Filter,string][]).map(([v,l])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{l}</button>)}</div></div>
  {filtered.length?<div className="notification-list">{filtered.map(n=><article key={n.id} className={`panel notification-row ${n.is_read?'read':'unread'} priority-${n.priority}`}>
   <button className="notification-main" onClick={()=>open(n)}><span className="notification-priority-icon">{n.priority==='high'?<AlertTriangle size={18}/>:n.priority==='medium'?<Bell size={18}/>:<Info size={18}/>}</span><span><small>{moduleLabels[n.module]} · {priorityLabels[n.priority]}</small><strong>{n.title}</strong>{n.message&&<p>{n.message}</p>}</span><time>{relativeTime(n.created_at)}</time><ChevronLeft size={17}/></button>
   <div className="notification-actions"><button onClick={()=>onToggleRead(n)} title={n.is_read?'تعليم كغير مقروء':'تعليم كمقروء'}><Circle size={15} fill={n.is_read?'none':'currentColor'}/></button><button onClick={()=>onDelete(n)} title="حذف"><Trash2 size={15}/></button></div>
  </article>)}</div>:<div className="panel notification-empty"><Bell size={30}/><h3>لا توجد إشعارات مطابقة</h3><p>غيّر الفلتر أو انتظر نشاطًا جديدًا داخل النظام.</p></div>}
 </section>
}
function relativeTime(value:string){const d=Math.max(0,Date.now()-new Date(value).getTime());const m=Math.floor(d/60000);if(m<1)return"الآن";if(m<60)return`منذ ${m} د`;const h=Math.floor(m/60);if(h<24)return`منذ ${h} س`;const days=Math.floor(h/24);return`منذ ${days} ي`;}
