"use client";
import { AlertTriangle, Bell, CheckCheck, ChevronLeft, Circle, Info, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityModule, Notification, NotificationPriority } from "@/lib/types";
import { useLanguage } from "@/components/i18n/language-provider";

type View = "dashboard" | "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance" | "activity" | "notifications";
type Filter = "all" | "unread" | NotificationPriority;

export function NotificationsView({notifications,onNavigate,onToggleRead,onMarkAll,onDelete}:{notifications:Notification[];onNavigate:(v:View)=>void;onToggleRead:(n:Notification)=>void;onMarkAll:()=>void;onDelete:(n:Notification)=>void}){
 const {locale,text}=useLanguage();
 const moduleLabels:Record<ActivityModule,string>={projects:text("المشاريع","Projects"),tasks:text("المهام","Tasks"),clients:text("العملاء","Clients"),content:text("المحتوى","Content"),knowledge:text("المعرفة","Knowledge"),finance:text("المالية","Finance"),system:text("النظام","System")};
 const priorityLabels:Record<NotificationPriority,string>={high:text("عالية","High"),medium:text("متوسطة","Medium"),info:text("معلومات","Info")};
 const [query,setQuery]=useState(""); const [filter,setFilter]=useState<Filter>("all");
 const filtered=useMemo(()=>notifications.filter(n=>{const q=query.trim().toLowerCase();return(!q||[n.title,n.message,moduleLabels[n.module]].some(v=>(v??"").toLowerCase().includes(q)))&&(filter==="all"||(filter==="unread"?!n.is_read:n.priority===filter));}),[notifications,query,filter,locale]);
 const unread=notifications.filter(n=>!n.is_read).length;
 function open(n:Notification){if(!n.is_read)onToggleRead(n);if(n.module!=="system")onNavigate(n.module as View)}
 const filters:[Filter,string][]=[["all",text("الكل","All")],["unread",text("غير المقروءة","Unread")],["high",text("عالية","High")],["medium",text("متوسطة","Medium")],["info",text("معلومات","Info")]];
 return <section className="notifications-page">
  <div className="panel notification-summary"><div><span className="section-kicker">NOTIFICATION CENTER</span><h2>{unread?text(`${unread} إشعار غير مقروء`,`${unread} unread notification(s)`):text("أنت على اطلاع كامل","You're all caught up")}</h2><p>{unread?text("راجع العناصر المهمة ثم انتقل مباشرة إلى مصدرها.","Review important items, then jump directly to their source."):text("لا توجد إشعارات جديدة الآن.","There are no new notifications right now.")}</p></div><button className="secondary" onClick={onMarkAll} disabled={!unread}><CheckCheck size={17}/> {text("تعليم الكل كمقروء","Mark all as read")}</button></div>
  <div className="panel notification-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={text("ابحث في الإشعارات...","Search notifications...")}/></div><div className="notification-filters">{filters.map(([v,l])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{l}</button>)}</div></div>
  {filtered.length?<div className="notification-list">{filtered.map(n=><article key={n.id} className={`panel notification-row ${n.is_read?'read':'unread'} priority-${n.priority}`}>
   <button className="notification-main" onClick={()=>open(n)}><span className="notification-priority-icon">{n.priority==='high'?<AlertTriangle size={18}/>:n.priority==='medium'?<Bell size={18}/>:<Info size={18}/>}</span><span><small>{moduleLabels[n.module]} · {priorityLabels[n.priority]}</small><strong>{n.title}</strong>{n.message&&<p>{n.message}</p>}</span><time>{relativeTime(n.created_at,locale)}</time><ChevronLeft size={17}/></button>
   <div className="notification-actions"><button onClick={()=>onToggleRead(n)} title={n.is_read?text("تعليم كغير مقروء","Mark as unread"):text("تعليم كمقروء","Mark as read")}><Circle size={15} fill={n.is_read?'none':'currentColor'}/></button><button onClick={()=>onDelete(n)} title={text("حذف","Delete")}><Trash2 size={15}/></button></div>
  </article>)}</div>:<div className="panel notification-empty"><Bell size={30}/><h3>{text("لا توجد إشعارات مطابقة","No matching notifications")}</h3><p>{text("غيّر الفلتر أو انتظر نشاطًا جديدًا داخل النظام.","Change the filter or wait for new activity in the system.")}</p></div>}
 </section>
}
function relativeTime(value:string,locale:"ar"|"en"){const d=Math.max(0,Date.now()-new Date(value).getTime());const m=Math.floor(d/60000);if(m<1)return locale==="ar"?"الآن":"now";if(m<60)return locale==="ar"?`منذ ${m} د`:`${m}m ago`;const h=Math.floor(m/60);if(h<24)return locale==="ar"?`منذ ${h} س`:`${h}h ago`;const days=Math.floor(h/24);return locale==="ar"?`منذ ${days} ي`:`${days}d ago`;}
