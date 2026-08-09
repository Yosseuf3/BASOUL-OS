"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { canAssignRole, canInviteRole, canManageMember, hasOrganizationPermission, ORGANIZATION_ROLES, type OrganizationRole } from "@/lib/organizations/rbac";
import {
  deactivateMembership, inviteMember, loadAdministration, loadInvitations, removeMembership,
  revokeInvitation, setMembership, type OrganizationInvitation, type OrganizationMembership,
} from "@/lib/organizations/administration";

export function AdministrationView({ session }: { session: Session }) {
  const [state, setState] = useState<Awaited<ReturnType<typeof loadAdministration>>>(null);
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل الإدارة"); }
  }, [session]);
  useEffect(() => { void refresh(); }, [refresh]);
  if (error && !state) return <section className="panel" role="alert"><h2>الإدارة</h2><p>{error}</p></section>;
  if (!state) return <section className="panel"><h2>الإدارة</h2><p>لا توجد عضوية نشطة.</p></section>;
  const role = state.current.role as OrganizationRole;
  const organization = state.current.organizations as unknown as { id: string; name: string; slug: string };
  const manage = hasOrganizationPermission(role, "membership.manage");
  const run = async <Result,>(operation: () => Promise<Result>, success: string | ((result: Result) => string)) => {
    setBusy(true); setError(null); setNotice(null);
    try { const result = await operation(); setNotice(typeof success === "function" ? success(result) : success); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تنفيذ العملية"); }
    finally { setBusy(false); }
  };
  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const result = await inviteMember(organization.id, email, inviteRole);
      setEmail(""); setInviteOpen(false);
      return result;
    }, (result) => result.delivery === "email_sent" ? "أُرسلت الدعوة بأمان." : "رُبطت الدعوة بالهوية الموجودة وستُقبل عند تسجيل الدخول التالي.");
  };
  return <section className="panel" aria-labelledby="administration-title">
    <h2 id="administration-title">إدارة المؤسسة</h2>
    <p><strong>{organization.name}</strong> · {organization.slug}</p>
    <p>دورك: <strong>{role}</strong>{hasOrganizationPermission(role, "organization.update") ? " · إدارة إعدادات المؤسسة متاحة" : " · إعدادات المؤسسة للمالك فقط"}</p>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {manage && <button type="button" disabled={busy} onClick={() => setInviteOpen((value) => !value)}>دعوة عضو</button>}
    {inviteOpen && <form onSubmit={submitInvite} className="admin-invite-form">
      <label>البريد الإلكتروني<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>الدور<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<OrganizationRole, "owner">)}>
        {ORGANIZATION_ROLES.filter((candidate): candidate is Exclude<OrganizationRole, "owner"> => candidate !== "owner" && canInviteRole(role, candidate)).map((candidate) => <option key={candidate}>{candidate}</option>)}
      </select></label>
      <button type="submit" disabled={busy}>إرسال الدعوة</button>
    </form>}
    {manage && invitations.length > 0 && <><h3>الدعوات</h3><div className="table-wrap"><table><thead><tr><th>البريد</th><th>الدور</th><th>الحالة</th><th>الانتهاء</th><th>الإجراء</th></tr></thead><tbody>
      {invitations.map((invitation) => <tr key={invitation.id}><td>{invitation.email}</td><td>{invitation.role}</td><td>{invitation.status}</td><td>{new Intl.DateTimeFormat("ar-SA").format(new Date(invitation.expires_at))}</td><td>{invitation.status === "pending" ? <button type="button" disabled={busy} onClick={() => void run(() => revokeInvitation(organization.id, invitation.id), "أُلغيت الدعوة.")}>إلغاء</button> : "—"}</td></tr>)}
    </tbody></table></div></>}
    <h3>الأعضاء</h3>
    <div className="table-wrap"><table><thead><tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>
      {state.members.map((member: OrganizationMembership) => <tr key={member.user_id}><td><code>{member.user_id}</code></td><td>
        {manage && canManageMember(role, member.role) ? <select disabled={busy} aria-label={`دور ${member.user_id}`} value={member.role} onChange={(event) => void run(() => setMembership(member.organization_id, member.user_id, event.target.value as OrganizationRole, "active"), "تغيّر الدور.")}>
          {ORGANIZATION_ROLES.filter((candidate) => candidate !== "owner" && canAssignRole(role, candidate, member.user_id === session.user.id)).map((candidate) => <option key={candidate}>{candidate}</option>)}
        </select> : member.role}
      </td><td>{member.status}</td><td>{manage && canManageMember(role, member.role) && member.user_id !== session.user.id ? <><button type="button" disabled={busy} onClick={() => void run(() => deactivateMembership(member.organization_id, member.user_id), "عُطّل العضو.")}>تعطيل</button><button type="button" disabled={busy} onClick={() => void run(() => removeMembership(member.organization_id, member.user_id), "أُزيل العضو.")}>إزالة</button></> : <span aria-label="غير مسموح">—</span>}</td></tr>)}
    </tbody></table></div>
    {!manage && <p>هذه الواجهة للقراءة فقط وفقًا لدورك.</p>}
  </section>;
}
