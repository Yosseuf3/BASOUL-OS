"use client";

import { BookOpen, BriefcaseBusiness, ChevronLeft, CircleDollarSign, Film, Search, Users, X, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Client, ContentItem, FinanceTransaction, KnowledgeItem, Project, Task } from "@/lib/types";

export type SearchTarget = "projects" | "tasks" | "clients" | "content" | "knowledge" | "finance";

type SearchResult = {
  id: string;
  target: SearchTarget;
  title: string;
  subtitle: string;
  searchable: string;
};

type Props = {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  contentItems: ContentItem[];
  knowledgeItems: KnowledgeItem[];
  financeItems: FinanceTransaction[];
  onNavigate: (target: SearchTarget) => void;
};

const targetLabels: Record<SearchTarget, string> = {
  projects: "المشاريع",
  tasks: "المهام",
  clients: "العملاء",
  content: "المحتوى",
  knowledge: "المعرفة",
  finance: "المالية",
};

export function GlobalSearch(props: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 40);
    else setQuery("");
  }, [open]);

  const allResults = useMemo<SearchResult[]>(() => [
    ...props.projects.map((item) => ({ id: item.id, target: "projects" as const, title: item.name, subtitle: `${item.status} · ${item.client_name ?? "دون عميل"}`, searchable: `${item.name} ${item.client_name ?? ""} ${item.area ?? ""} ${item.notes ?? ""}` })),
    ...props.tasks.map((item) => ({ id: item.id, target: "tasks" as const, title: item.title, subtitle: `${item.status} · ${projectName(props.projects, item.project_id)}`, searchable: `${item.title} ${item.description ?? ""} ${projectName(props.projects, item.project_id)}` })),
    ...props.clients.map((item) => ({ id: item.id, target: "clients" as const, title: item.name, subtitle: `${item.company ?? "عميل فردي"} · ${item.status}`, searchable: `${item.name} ${item.company ?? ""} ${item.email ?? ""} ${item.phone ?? ""} ${item.notes ?? ""}` })),
    ...props.contentItems.map((item) => ({ id: item.id, target: "content" as const, title: item.title, subtitle: `${item.platform} · ${item.status}`, searchable: `${item.title} ${item.hook ?? ""} ${item.script ?? ""} ${item.hashtags ?? ""}` })),
    ...props.knowledgeItems.map((item) => ({ id: item.id, target: "knowledge" as const, title: item.title, subtitle: `${item.type}${item.is_favorite ? " · مفضلة" : ""}`, searchable: `${item.title} ${item.content ?? ""} ${item.tags ?? ""}` })),
    ...props.financeItems.map((item) => ({ id: item.id, target: "finance" as const, title: item.description, subtitle: `${item.category} · ${formatAmount(item)}`, searchable: `${item.description} ${item.category} ${item.notes ?? ""} ${item.amount} ${item.currency}` })),
  ], [props.projects, props.tasks, props.clients, props.contentItems, props.knowledgeItems, props.financeItems]);

  const normalized = query.trim().toLocaleLowerCase("ar");
  const results = normalized
    ? allResults.filter((item) => item.searchable.toLocaleLowerCase("ar").includes(normalized)).slice(0, 18)
    : allResults.slice(0, 8);

  const selectResult = (target: SearchTarget) => {
    props.onNavigate(target);
    setOpen(false);
  };

  return <>
    <button className="global-search-trigger" onClick={() => setOpen(true)} aria-label="فتح البحث الشامل">
      <Search size={17} /><span>بحث شامل…</span><kbd>Ctrl K</kbd>
    </button>
    {open && <div className="global-search-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="global-search-dialog" role="dialog" aria-modal="true" aria-label="البحث الشامل">
        <header className="global-search-input-wrap">
          <Search size={20} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في المشاريع والمهام والعملاء والمعرفة والمالية…" />
          <button onClick={() => setOpen(false)} aria-label="إغلاق"><X size={18} /></button>
        </header>
        <div className="global-search-meta"><span>{query ? `${results.length} نتيجة` : "أحدث العناصر"}</span><small>Enter للفتح · Esc للإغلاق</small></div>
        <div className="global-search-results">
          {results.length ? results.map((result) => <button key={`${result.target}-${result.id}`} onClick={() => selectResult(result.target)}>
            <span className="global-search-icon">{targetIcon(result.target)}</span>
            <span><b>{result.title}</b><small>{result.subtitle}</small></span>
            <em>{targetLabels[result.target]}</em><ChevronLeft size={16} />
          </button>) : <div className="global-search-empty"><Search size={24} /><b>لم نجد نتيجة مطابقة</b><small>جرّب كلمة أقصر أو ابحث باسم العميل أو المشروع.</small></div>}
        </div>
      </section>
    </div>}
  </>;
}

function targetIcon(target: SearchTarget) {
  if (target === "projects") return <BriefcaseBusiness size={17} />;
  if (target === "tasks") return <ClipboardList size={17} />;
  if (target === "clients") return <Users size={17} />;
  if (target === "content") return <Film size={17} />;
  if (target === "knowledge") return <BookOpen size={17} />;
  return <CircleDollarSign size={17} />;
}
function projectName(projects: Project[], id: string) { return projects.find((item) => item.id === id)?.name ?? "مشروع غير محدد"; }
function formatAmount(item: FinanceTransaction) { return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(item.amount))} ${item.currency}`; }
