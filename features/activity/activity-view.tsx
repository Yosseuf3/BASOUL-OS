"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, CircleDollarSign, Clock3, FileText, Film, FolderKanban, Search, Trash2, Users } from "lucide-react";
import type { ActivityEvent, ActivityModule } from "@/lib/types";

type Target = "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance";
const labels: Record<ActivityModule, string> = { projects:"المشاريع", tasks:"المهام", clients:"العملاء", content:"المحتوى", knowledge:"المعرفة", finance:"المالية", system:"النظام" };
const modules: Array<"all" | ActivityModule> = ["all","projects","tasks","clients","content","knowledge","finance","system"];
const icons = { projects:FolderKanban, tasks:CheckCircle2, clients:Users, content:Film, knowledge:BookOpen, finance:CircleDollarSign, system:FileText };

export function ActivityView({ events, onNavigate, onClear }: { events:ActivityEvent[]; onNavigate:(target:Target)=>void; onClear:()=>void }) {
  const [module,setModule]=useState<"all"|ActivityModule>("all");
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>events.filter(event=>{
    const q=query.trim().toLowerCase();
    return (module==="all"||event.module===module) && (!q||[event.title,event.description,labels[event.module]].some(v=>(v??"").toLowerCase().includes(q)));
  }),[events,module,query]);
  const grouped=useMemo(()=>groupByDay(filtered),[filtered]);
  return <section className="activity-page">
    <div className="panel activity-toolbar">
      <label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث داخل سجل النشاط…"/></label>
      <button className="secondary danger-soft" onClick={onClear} disabled={!events.length}><Trash2 size={16}/> مسح السجل</button>
    </div>
    <div className="activity-filters">{modules.map(item=><button key={item} className={module===item?"active":""} onClick={()=>setModule(item)}>{item==="all"?"الكل":labels[item]}</button>)}</div>
    <div className="activity-timeline">{grouped.length?grouped.map(group=><section key={group.key} className="activity-day"><header><span>{group.label}</span><small>{group.items.length} أحداث</small></header><div className="activity-stack">{group.items.map(event=><ActivityRow key={event.id} event={event} onNavigate={onNavigate}/>)}</div></section>):<div className="panel activity-empty"><Clock3 size={28}/><h3>لا يوجد نشاط مطابق</h3><p>ستظهر هنا العمليات التي تتم داخل وحدات النظام.</p></div>}</div>
  </section>;
}
function ActivityRow({event,onNavigate}:{event:ActivityEvent;onNavigate:(target:Target)=>void}){const Icon=icons[event.module];const canNavigate=event.module!=="system";return <button className={`panel activity-row module-${event.module}`} onClick={()=>canNavigate&&onNavigate(event.module as Target)} disabled={!canNavigate}><span className="activity-icon"><Icon size={18}/></span><span className="activity-copy"><small>{labels[event.module]} · {actionLabel(event.action)}</small><strong>{event.title}</strong>{event.description&&<p>{event.description}</p>}</span><time>{relativeTime(event.created_at)}</time>{canNavigate&&<ChevronLeft size={16}/>}</button>}
function actionLabel(action:ActivityEvent["action"]){return ({created:"إنشاء",updated:"تحديث",deleted:"حذف",completed:"اكتمال",paid:"دفع",published:"نشر"} as const)[action]}
function relativeTime(value:string){const diff=Date.now()-new Date(value).getTime();const min=Math.max(0,Math.floor(diff/60000));if(min<1)return"الآن";if(min<60)return`منذ ${min} د`;const hours=Math.floor(min/60);if(hours<24)return`منذ ${hours} س`;return new Intl.DateTimeFormat("ar-SA",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(new Date(value))}
function groupByDay(events:ActivityEvent[]){const today=new Date().toISOString().slice(0,10);const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);const map=new Map<string,ActivityEvent[]>();events.forEach(event=>{const key=event.created_at.slice(0,10);map.set(key,[...(map.get(key)??[]),event])});return [...map.entries()].map(([key,items])=>({key,label:key===today?"اليوم":key===yesterday?"أمس":new Intl.DateTimeFormat("ar-SA",{weekday:"long",day:"numeric",month:"long"}).format(new Date(`${key}T00:00:00`)),items}))}
