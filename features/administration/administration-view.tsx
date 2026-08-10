"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Button, Dialog, EmptyState, ErrorState, Input, LoadingState, Panel, Select, Status, TableContainer,
} from "@/components/ui/yvl-primitives";
import { canAssignRole, canInviteRole, canManageMember, hasOrganizationPermission, ORGANIZATION_ROLES, type OrganizationRole } from "@/lib/organizations/rbac";
import {
  deactivateMembership, inviteMember, loadAdministration, loadInvitations, removeMembership,
  revokeInvitation, setMembership, type OrganizationInvitation, type OrganizationMembership,
} from "@/lib/organizations/administration";

const statusTone = (status: string) => status === "active" || status === "accepted" ? "success" : status === "pending" || status === "invited" ? "warning" : "neutral";
const roleLabels: Record<OrganizationRole, string> = { owner: "مالك", admin: "مسؤول", member: "عضو", viewer: "مشاهد" };
const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  pending: "قيد الانتظار",
  invited: "تمت الدعوة",
  accepted: "مقبولة",
  expired: "منتهية",
  revoked: "ملغاة",
};
const displayStatus = (status: string) => statusLabels[status] ?? status;

export function AdministrationView({ session }: { session: Session }) {
  const [state, setState] = useState<Awaited<ReturnType<typeof loadAdministration>>>(null);
  const [loaded, setLoaded] = useState(false);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<OrganizationRole, "owner">>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const next = await loadAdministration(session);
      setState(next); setError(null);
      if (next && hasOrganizationPermission(next.current.role as OrganizationRole, "membership.manage")) {
        const secure = await loadInvitations(next.current.organization_id);
        setInvitations(secure.invitations);
      } else setInvitations([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل الإدارة");
    } finally {
      setLoaded(true);
    }
  }, [session]);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!loaded) return <Panel><LoadingState title="جارٍ تحميل الإدارة" /></Panel>;
  if (error && !state) return <Panel><ErrorState title="تعذر تحميل الإدارة" detail={error} /></Panel>;
  if (!state) return <Panel><EmptyState title="لا توجد عضوية نشطة" detail="سجّل الدخول بعضوية مؤسسة لعرض الإدارة." /></Panel>;

  const role = state.current.role as OrganizationRole;
  const organization = state.current.organizations as unknown as { id: string; name: string; slug: string };
  const manage = hasOrganizationPermission(role, "membership.manage");
  const run = async <Result,>(operation: () => Promise<Result>, success: string | ((result: Result) => string)) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const result = await operation();
      setNotice(typeof success === "function" ? success(result) : success);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };
  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const result = await inviteMember(organization.id, email, inviteRole);
      setEmail(""); setInviteOpen(false);
      return result;
    }, (result) => result.delivery === "email_sent"
      ? "أُرسلت الدعوة بأمان."
      : "رُبطت الدعوة بالهوية الموجودة وستُقبل عند تسجيل الدخول التالي.");
  };

  return <Panel aria-labelledby="administration-title">
    <span className="section-kicker">BASOUL · ADMINISTRATION</span>
    <h2 id="administration-title">إدارة المؤسسة</h2>
    <p><strong>BASOUL</strong></p>
    <p className="muted">معرّف المؤسسة التقني: <code>{organization.slug}</code></p>
    <p>دورك: <Status tone={role === "owner" ? "accent" : "success"}>{roleLabels[role]}</Status>{hasOrganizationPermission(role, "organization.update") ? " · إدارة إعدادات المؤسسة متاحة" : " · إعدادات المؤسسة للمالك فقط"}</p>
    {error ? <p role="alert" className="form-error">{error}</p> : null}
    {notice ? <p role="status" className="auth-message success">{notice}</p> : null}
    {manage ? <Button type="button" className="primary" disabled={busy} onClick={() => setInviteOpen(true)}>دعوة عضو</Button> : null}

    <Dialog open={inviteOpen} title="دعوة عضو إلى المؤسسة" onClose={() => setInviteOpen(false)}>
      <form onSubmit={submitInvite} className="admin-invite-form">
        <label>البريد الإلكتروني<Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>الدور<Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<OrganizationRole, "owner">)}>
          {ORGANIZATION_ROLES.filter((candidate): candidate is Exclude<OrganizationRole, "owner"> => candidate !== "owner" && canInviteRole(role, candidate)).map((candidate) => <option key={candidate} value={candidate}>{roleLabels[candidate]}</option>)}
        </Select></label>
        <div className="form-actions"><Button type="button" className="ghost" onClick={() => setInviteOpen(false)}>إلغاء</Button><Button type="submit" className="primary" aria-busy={busy}>إرسال الدعوة</Button></div>
      </form>
    </Dialog>

    {manage && invitations.length > 0 ? <><h3>الدعوات</h3><TableContainer><table><thead><tr><th>البريد</th><th>الدور</th><th>الحالة</th><th>الانتهاء</th><th>الإجراء</th></tr></thead><tbody>
      {invitations.map((invitation) => <tr key={invitation.id}><td>{invitation.email}</td><td>{roleLabels[invitation.role]}</td><td><Status tone={statusTone(invitation.status)}>{displayStatus(invitation.status)}</Status></td><td>{new Intl.DateTimeFormat("ar-SA").format(new Date(invitation.expires_at))}</td><td>{invitation.status === "pending" ? <Button type="button" className="ghost" disabled={busy} onClick={() => void run(() => revokeInvitation(organization.id, invitation.id), "أُلغيت الدعوة.")}>إلغاء</Button> : "—"}</td></tr>)}
    </tbody></table></TableContainer></> : null}

    <h3>الأعضاء</h3>
    <TableContainer><table><thead><tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>
      {state.members.map((member: OrganizationMembership) => <tr key={member.user_id}><td><code>{member.user_id}</code></td><td>
        {manage && canManageMember(role, member.role) ? <Select disabled={busy} aria-label={`دور ${member.user_id}`} value={member.role} onChange={(event) => void run(() => setMembership(member.organization_id, member.user_id, event.target.value as OrganizationRole, "active"), "تغيّر الدور.")}>
          {ORGANIZATION_ROLES.filter((candidate) => candidate !== "owner" && canAssignRole(role, candidate, member.user_id === session.user.id)).map((candidate) => <option key={candidate} value={candidate}>{roleLabels[candidate]}</option>)}
        </Select> : roleLabels[member.role]}
      </td><td><Status tone={statusTone(member.status)}>{displayStatus(member.status)}</Status></td><td>{manage && canManageMember(role, member.role) && member.user_id !== session.user.id ? <div className="admin-actions"><Button type="button" className="ghost" disabled={busy} onClick={() => void run(() => deactivateMembership(member.organization_id, member.user_id), "عُطّل العضو.")}>تعطيل</Button><Button type="button" className="danger" disabled={busy} onClick={() => void run(() => removeMembership(member.organization_id, member.user_id), "أُزيل العضو.")}>إزالة</Button></div> : <span aria-label="غير مسموح">—</span>}</td></tr>)}
    </tbody></table></TableContainer>
    {!manage ? <p>هذه الواجهة للقراءة فقط وفقًا لدورك.</p> : null}
  </Panel>;
}
