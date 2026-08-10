"use client";
import { BookOpen, ClipboardList, Film, FolderKanban, Plus, Users, Wallet, X } from "lucide-react";
import type { QuickCreateTarget } from "@/packages/types/src";
import { useLanguage } from "@/components/i18n/language-provider";

export function QuickCreate({ open, onClose, onSelect }: { open:boolean; onClose:()=>void; onSelect:(target:QuickCreateTarget)=>void }) {
 const {text}=useLanguage();
 const items:Array<{id:QuickCreateTarget;label:string;description:string;icon:React.ReactNode}>=[
  {id:"project",label:text("مشروع جديد","New project"),description:text("ابدأ مشروعًا واربطه بعميل","Start a project and link it to a client"),icon:<FolderKanban/>},
  {id:"task",label:text("مهمة جديدة","New task"),description:text("أضف مهمة إلى مشروع قائم","Add a task to an existing project"),icon:<ClipboardList/>},
  {id:"client",label:text("عميل جديد","New client"),description:text("أضف جهة اتصال أو عميلًا","Add a contact or client"),icon:<Users/>},
  {id:"finance",label:text("معاملة مالية","Financial transaction"),description:text("سجل دخلًا أو مصروفًا","Record income or an expense"),icon:<Wallet/>},
  {id:"knowledge",label:text("عنصر معرفة","Knowledge item"),description:text("احفظ ملاحظة أو مرجعًا","Save a note or reference"),icon:<BookOpen/>},
  {id:"content",label:text("محتوى جديد","New content"),description:text("ابدأ فكرة أو مسودة محتوى","Start a content idea or draft"),icon:<Film/>},
 ];
 if(!open) return null;
 return <div className="modal-backdrop quick-create-backdrop" onMouseDown={onClose}><section className="quick-create-modal" onMouseDown={(event)=>event.stopPropagation()}><header><div><span className="section-kicker">UNIVERSAL CREATE</span><h2>{text("ماذا تريد أن تنشئ؟","What do you want to create?")}</h2><p>{text("إجراء واحد موحد من أي مكان داخل النظام.","One unified action from anywhere in BASOUL.")}</p></div><button className="icon-button" onClick={onClose} aria-label={text("إغلاق","Close")}><X size={19}/></button></header><div className="quick-create-list">{items.map((item)=><button key={item.id} onClick={()=>onSelect(item.id)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.description}</small></div><Plus size={16}/></button>)}</div><footer><kbd>N</kbd><span>{text("فتح الإنشاء السريع","Open quick create")}</span><kbd>Esc</kbd><span>{text("إغلاق","Close")}</span></footer></section></div>;
}
