"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, CircleDollarSign, Clock3, FileText, Film, FolderKanban, Search, Trash2, Users } from "lucide-react";
import type { ActivityEvent, ActivityModule } from "@/lib/types";
import { useLanguage } from "@/components/i18n/language-provider";

type Target = "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance";
const modules: Array<"all" | ActivityModule> = ["all","projects","tasks","clients","content","knowledge","finance","system"];
const icons = { projects:FolderKanban, tasks:CheckCircle2, clients:Users, content:Film, knowledge:BookOpen, finance:CircleDollarSign, system:FileText };

export function ActivityView({ events, onNavigate, onClear }: { events:ActivityEvent[]; onNavigate:(target:Target)=>void; onClear:()=>void }) {
  const { locale, text } = useLanguage();
  const labels: Record<ActivityModule, string> = { projects:text("المشاريع","Projects"), tasks:text("المهام","Tasks"), clients:text("العملاء","Clients"), content:text("المحتوى","Content"), knowledge:text("المعرفة","Knowledge"), finance:text("المالية","Finance"), system:text("النظام","System") };
  const [module,setModule]=useState<"all"|ActivityModule>("all");
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>events.filter(event=>{ const q=query.trim().toLowerCase(); return (module==="all"||event.module===module) && (!q||[event.title,event.description,labels[event.module]].some(v=>(v??"").toLowerCase().includes(q))); }),[events,module,query,locale]);
  const grouped=useMemo(()=>groupByDay(filtered,locale),[filtered,locale]);
  return <section className="activity-page">
    <div className="panel activity-toolbar"><label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={text("ابحث داخل سجل النشاط…","Search activity…")}/></label><button className="secondary danger-soft" onClick={onClear} disabled={!events.length}><Trash2 size={16}/> {text("مسح السجل","Clear log")}</button></div>
    <div className="activity-filters">{modules.map(item=><button key={item} className={module===item?"active":""} onClick={()=>setModule(item)}>{item==="all"?text("الكل","All"):labels[item]}</button>)}</div>
    <div className="activity-timeline">{grouped.length?grouped.map(group=><section key={group.key} className="activity-day"><header><span>{group.label}</span><small>{text(`${group.items.length} أحداث`,`${group.items.length} event(s)`)}</small></header><div className="activity-stack">{group.items.map(event=><ActivityRow key={event.id} event={event} onNavigate={onNavigate} locale={locale} labels={labels}/>)}</div></section>):<div className="panel activity-empty"><Clock3 size={28}/><h3>{text("لا يوجد نشاط مطابق","No matching activity")}</h3><p>{text("ستظهر هنا العمليات التي تتم داخل وحدات النظام.","Operations across BASOUL modules will appear here.")}</p></div>}</div>
  </section>;
}
function ActivityRow({event,onNavigate,locale,labels}:{event:ActivityEvent;onNavigate:(target:Target)=>void;locale:"ar"|"en";labels:Record<ActivityModule,string>}){const Icon=icons[event.module];const canNavigate=event.module!=="system";return <button className={`panel activity-row module-${event.module}`} onClick={()=>canNavigate&&onNavigate(event.module as Target)} disabled={!canNavigate}><span className="activity-icon"><Icon size={18}/></span><span className="activity-copy"><small>{labels[event.module]} · {actionLabel(event.action,locale)}</small><strong>{event.title}</strong>{event.description&&<p>{event.description}</p>}</span><time>{relativeTime(event.created_at,locale)}</time>{canNavigate&&<ChevronLeft size={16}/>}</button>}
function actionLabel(action:ActivityEvent["action"],locale:"ar"|"en"){const ar={created:"إنشاء",updated:"تحديث",deleted:"حذف",completed:"اكتمال",paid:"دفع",published:"نشر"} as const;const en={created:"Created",updated:"Updated",deleted:"Deleted",completed:"Completed",paid:"Paid",published:"Published"} as const;return(locale==="ar"?ar:en)[action]}
function relativeTime(value:string,locale:"ar"|"en"){const diff=Date.now()-new Date(value).getTime();const min=Math.max(0,Math.floor(diff/60000));if(min<1)return locale==="ar"?"الآن":"now";if(min<60)return locale==="ar"?`منذ ${min} د`:`${min}m ago`;const hours=Math.floor(min/60);if(hours<24)return locale==="ar"?`منذ ${hours} س`:`${hours}h ago`;return new Intl.DateTimeFormat(locale==="ar"?"ar-SA":"en-US",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(new Date(value))}
function groupByDay(events:ActivityEvent[],locale:"ar"|"en"){const today=new Date().toISOString().slice(0,10);const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);const map=new Map<string,ActivityEvent[]>();events.forEach(event=>{const key=event.created_at.slice(0,10);map.set(key,[...(map.get(key)??[]),event])});return [...map.entries()].map(([key,items])=>({key,label:key===today?(locale==="ar"?"اليوم":"Today"):key===yesterday?(locale==="ar"?"أمس":"Yesterday"):new Intl.DateTimeFormat(locale==="ar"?"ar-SA":"en-US",{weekday:"long",day:"numeric",month:"long"}).format(new Date(`${key}T00:00:00`)),items}))}
