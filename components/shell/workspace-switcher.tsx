"use client";
import { Building2, Check, ChevronDown, Languages, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { WORKSPACES } from "@/packages/core/src";
import type { WorkspaceId } from "@/packages/types/src";
import { useLanguage } from "@/components/i18n/language-provider";

const workspaceEnglish: Record<WorkspaceId, { label: string; shortLabel: string; description: string }> = {
  executive: { label: "Executive Workspace", shortLabel: "Executive", description: "Decisions, health and KPIs" },
  operations: { label: "Operations Workspace", shortLabel: "Operations", description: "Projects, tasks and clients" },
  engineering: { label: "Engineering Workspace", shortLabel: "Engineering", description: "Plans, reviews and design intelligence" },
  knowledge: { label: "Knowledge Workspace", shortLabel: "Knowledge", description: "References, templates and expertise" },
};

export function WorkspaceSwitcher({ value, onChange }: { value: WorkspaceId; onChange: (value: WorkspaceId) => void }) {
  const [open, setOpen] = useState(false);
  const { locale, toggleLocale, text } = useLanguage();
  const active = WORKSPACES.find((workspace) => workspace.id === value) ?? WORKSPACES[0];
  const activeEnglish = workspaceEnglish[active.id];
  return <div className="workspace-switcher">
    <button className="workspace-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
      <span><Building2 size={16}/></span><div><small>{text("مساحة العمل", "Workspace")}</small><b>{locale === "ar" ? active.shortLabel : activeEnglish.shortLabel}</b></div><ChevronDown size={15}/>
    </button>
    {open && <div className="workspace-menu">
      {WORKSPACES.map((workspace) => {
        const en = workspaceEnglish[workspace.id];
        return <button key={workspace.id} disabled={!workspace.enabled} onClick={() => { if (workspace.enabled) { onChange(workspace.id); setOpen(false); } }}>
          <span>{workspace.id === value ? <Check size={15}/> : !workspace.enabled ? <LockKeyhole size={14}/> : null}</span><div><b>{locale === "ar" ? workspace.label : en.label}</b><small>{locale === "ar" ? workspace.description : en.description}</small></div>
        </button>;
      })}
      <button onClick={() => window.location.assign("/administration")}>
        <span><ShieldCheck size={15}/></span><div><b>{text("إدارة المؤسسة", "Organization Administration")}</b><small>{text("الأعضاء والصلاحيات والدعوات", "Members, permissions and invitations")}</small></div>
      </button>
      <button onClick={() => { toggleLocale(); setOpen(false); }} aria-label={text("Switch to English", "التبديل إلى العربية")}>
        <span><Languages size={15}/></span><div><b>{locale === "ar" ? "English" : "العربية"}</b><small>{text("تغيير لغة و اتجاه الواجهة", "Change interface language and direction")}</small></div>
      </button>
    </div>}
  </div>;
}
