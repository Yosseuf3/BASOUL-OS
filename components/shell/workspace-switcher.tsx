"use client";
import { Building2, Check, ChevronDown, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { WORKSPACES } from "@/packages/core/src";
import type { WorkspaceId } from "@/packages/types/src";

export function WorkspaceSwitcher({ value, onChange }: { value: WorkspaceId; onChange: (value: WorkspaceId) => void }) {
  const [open, setOpen] = useState(false);
  const active = WORKSPACES.find((workspace) => workspace.id === value) ?? WORKSPACES[0];
  return <div className="workspace-switcher">
    <button className="workspace-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
      <span><Building2 size={16}/></span><div><small>مساحة العمل</small><b>{active.shortLabel}</b></div><ChevronDown size={15}/>
    </button>
    {open && <div className="workspace-menu">
      {WORKSPACES.map((workspace) => <button key={workspace.id} disabled={!workspace.enabled} onClick={() => { if (workspace.enabled) { onChange(workspace.id); setOpen(false); } }}>
        <span>{workspace.id === value ? <Check size={15}/> : !workspace.enabled ? <LockKeyhole size={14}/> : null}</span><div><b>{workspace.label}</b><small>{workspace.description}</small></div>
      </button>)}
      <button onClick={() => window.location.assign("/administration")}>
        <span><ShieldCheck size={15}/></span><div><b>إدارة المؤسسة</b><small>الأعضاء والصلاحيات والدعوات</small></div>
      </button>
    </div>}
  </div>;
}
