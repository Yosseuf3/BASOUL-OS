"use client";
import { BookOpen, ClipboardList, Film, FolderKanban, Plus, Users, Wallet, X } from "lucide-react";
import type { QuickCreateTarget } from "@/packages/types/src";
const items: Array<{id:QuickCreateTarget;label:string;description:string;icon:React.ReactNode}> = [
 {id:"project",label:"مشروع جديد",description:"ابدأ مشروعًا واربطه بعميل",icon:<FolderKanban/>},
 {id:"task",label:"مهمة جديدة",description:"أضف مهمة إلى مشروع قائم",icon:<ClipboardList/>},
 {id:"client",label:"عميل جديد",description:"أضف جهة اتصال أو عميلًا",icon:<Users/>},
 {id:"finance",label:"معاملة مالية",description:"سجل دخلًا أو مصروفًا",icon:<Wallet/>},
 {id:"knowledge",label:"عنصر معرفة",description:"احفظ ملاحظة أو مرجعًا",icon:<BookOpen/>},
 {id:"content",label:"محتوى جديد",description:"ابدأ فكرة أو مسودة محتوى",icon:<Film/>},
];
export function QuickCreate({ open, onClose, onSelect }: { open:boolean; onClose:()=>void; onSelect:(target:QuickCreateTarget)=>void }) {
 if(!open) return null;
 return <div className="modal-backdrop quick-create-backdrop" onMouseDown={onClose}><section className="quick-create-modal" onMouseDown={(event)=>event.stopPropagation()}><header><div><span className="section-kicker">UNIVERSAL CREATE</span><h2>ماذا تريد أن تنشئ؟</h2><p>إجراء واحد موحد من أي مكان داخل النظام.</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="quick-create-list">{items.map((item)=><button key={item.id} onClick={()=>onSelect(item.id)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.description}</small></div><Plus size={16}/></button>)}</div><footer><kbd>N</kbd><span>فتح الإنشاء السريع</span><kbd>Esc</kbd><span>إغلاق</span></footer></section></div>;
}
