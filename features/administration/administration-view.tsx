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
import { useLanguage } from "@/components/i18n/language-provider";

const statusTone = (status: string) => status === "active" || status === "accepted" ? "success" : status === "pending" || status === "invited" ? "warning" : "neutral";
const roleLabels = {
  ar: { owner: "مالك", admin: "مسؤول", member: "عضو", viewer: "مشاهد" },
  en: { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" },
} satisfies Record<"ar" | "en", Record<OrganizationRole, string>>;
const statusLabels: Record<"ar" | "en", Record<string, string>> = {
  ar: { active: "نشط", inactive: "غير نشط", pending: "قيد الانتظار", invited: "تمت الدعوة", accepted: "مقبولة", expired: "منتهية", revoked: "ملغاة" },
  en: { active: "Active", inactive: "Inactive", pending: "Pending", invited: "Invited", accepted: "Accepted", expired: "Expired", revoked: "Revoked" },
};

export function AdministrationView({ session }: { session: Session }) {
  const { locale, text } = useLanguage();
  const [state, setState] = useState<Awaited<ReturnType<typeof loadAdministration>>>(null);
  const [loaded, setLoaded] = useState(false);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<OrganizationRole, "owner">>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const displayStatus = (status: string) => statusLabels[locale][status] ?? status;

  const refresh = useCallback(async () => {
    try {
      const next = await loadAdministration(session);
      setState(next); setError(null);
      if (next && hasOrganizationPermission(next.current.role as OrganizationRole, "membership.manage")) {
        const secure = await loadInvitations(next.current.organization_id);
        setInvitations(secure.invitations);
      } else setInvitations([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("تعذر تحميل الإدارة", "Unable to load administration"));
    } finally {
      setLoaded(true);
    }
  }, [session, text]);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!loaded) return <Panel><LoadingState title={text("جارٍ تحميل الإدارة", "Loading administration")} /></Panel>;
  if (error && !state) return <Panel><ErrorState title={text("تعذر تحميل الإدارة", "Unable to load administration")} detail={error} /></Panel>;
  if (!state) return <Panel><EmptyState title={text("لا توجد عضوية نشطة", "No active membership")} detail={text("سجّل الدخول بعضوية مؤسسة لعرض الإدارة.", "Sign in with an organization membership to view administration.")} /></Panel>;

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
      setError(cause instanceof Error ? cause.message : text("تعذر تنفيذ العملية", "Unable to complete the operation"));
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
      ? text("أُرسلت الدعوة بأمان.", "Invitation sent securely.")
      : text("رُبطت الدعوة بالهوية الموجودة وستُقبل عند تسجيل الدخول التالي.", "The invitation was linked to the existing identity and will be accepted on the next sign-in."));
  };

  return <Panel aria-labelledby="administration-title">
    <span className="section-kicker">BASOUL · ADMINISTRATION</span>
    <h2 id="administration-title">{text("إدارة المؤسسة", "Organization Administration")}</h2>
    <p><strong>BASOUL</strong></p>
    <p className="muted">{text("معرّف المؤسسة التقني", "Technical organization identifier")}: <code>{organization.slug}</code></p>
    <p>{text("دورك", "Your role")}: <Status tone={role === "owner" ? "accent" : "success"}>{roleLabels[locale][role]}</Status>{hasOrganizationPermission(role, "organization.update") ? text(" · إدارة إعدادات المؤسسة متاحة", " · Organization settings available") : text(" · إعدادات المؤسسة للمالك فقط", " · Organization settings are owner-only")}</p>
    {error ? <p role="alert" className="form-error">{error}</p> : null}
    {notice ? <p role="status" className="auth-message success">{notice}</p> : null}
    {manage ? <Button type="button" className="primary" disabled={busy} onClick={() => setInviteOpen(true)}>{text("دعوة عضو", "Invite member")}</Button> : null}

    <Dialog open={inviteOpen} title={text("دعوة عضو إلى المؤسسة", "Invite member to organization")} onClose={() => setInviteOpen(false)}>
      <form onSubmit={submitInvite} className="admin-invite-form">
        <label>{text("البريد الإلكتروني", "Email address")}<Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>{text("الدور", "Role")}<Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<OrganizationRole, "owner">)}>
          {ORGANIZATION_ROLES.filter((candidate): candidate is Exclude<OrganizationRole, "owner"> => candidate !== "owner" && canInviteRole(role, candidate)).map((candidate) => <option key={candidate} value={candidate}>{roleLabels[locale][candidate]}</option>)}
        </Select></label>
        <div className="form-actions"><Button type="button" className="ghost" onClick={() => setInviteOpen(false)}>{text("إلغاء", "Cancel")}</Button><Button type="submit" className="primary" aria-busy={busy}>{text("إرسال الدعوة", "Send invitation")}</Button></div>
      </form>
    </Dialog>

    {manage && invitations.length > 0 ? <><h3>{text("الدعوات", "Invitations")}</h3><TableContainer><table><thead><tr><th>{text("البريد", "Email")}</th><th>{text("الدور", "Role")}</th><th>{text("الحالة", "Status")}</th><th>{text("الانتهاء", "Expires")}</th><th>{text("الإجراء", "Action")}</th></tr></thead><tbody>
      {invitations.map((invitation) => <tr key={invitation.id}><td>{invitation.email}</td><td>{roleLabels[locale][invitation.role]}</td><td><Status tone={statusTone(invitation.status)}>{displayStatus(invitation.status)}</Status></td><td>{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US").format(new Date(invitation.expires_at))}</td><td>{invitation.status === "pending" ? <Button type="button" className="ghost" disabled={busy} onClick={() => void run(() => revokeInvitation(organization.id, invitation.id), text("أُلغيت الدعوة.", "Invitation revoked."))}>{text("إلغاء", "Revoke")}</Button> : "—"}</td></tr>)}
    </tbody></table></TableContainer></> : null}

    <h3>{text("الأعضاء", "Members")}</h3>
    <TableContainer><table><thead><tr><th>{text("المستخدم", "User")}</th><th>{text("الدور", "Role")}</th><th>{text("الحالة", "Status")}</th><th>{text("الإجراءات", "Actions")}</th></tr></thead><tbody>
      {state.members.map((member: OrganizationMembership) => <tr key={member.user_id}><td><code>{member.user_id}</code></td><td>
        {manage && canManageMember(role, member.role) ? <Select disabled={busy} aria-label={`${text("دور", "Role")} ${member.user_id}`} value={member.role} onChange={(event) => void run(() => setMembership(member.organization_id, member.user_id, event.target.value as OrganizationRole, "active"), text("تغيّر الدور.", "Role updated."))}>
          {ORGANIZATION_ROLES.filter((candidate) => candidate !== "owner" && canAssignRole(role, candidate, member.user_id === session.user.id)).map((candidate) => <option key={candidate} value={candidate}>{roleLabels[locale][candidate]}</option>)}
        </Select> : roleLabels[locale][member.role]}
      </td><td><Status tone={statusTone(member.status)}>{displayStatus(member.status)}</Status></td><td>{manage && canManageMember(role, member.role) && member.user_id !== session.user.id ? <div className="admin-actions"><Button type="button" className="ghost" disabled={busy} onClick={() => void run(() => deactivateMembership(member.organization_id, member.user_id), text("عُطّل العضو.", "Member deactivated."))}>{text("تعطيل", "Deactivate")}</Button><Button type="button" className="danger" disabled={busy} onClick={() => void run(() => removeMembership(member.organization_id, member.user_id), text("أُزيل العضو.", "Member removed."))}>{text("إزالة", "Remove")}</Button></div> : <span aria-label={text("غير مسموح", "Not allowed")}>—</span>}</td></tr>)}
    </tbody></table></TableContainer>
    {!manage ? <p>{text("هذه الواجهة للقراءة فقط وفقًا لدورك.", "This view is read-only for your current role.")}</p> : null}
  </Panel>;
}
