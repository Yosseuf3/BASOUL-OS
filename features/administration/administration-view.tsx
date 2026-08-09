"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { canAssignRole, canManageMember, hasOrganizationPermission, ORGANIZATION_ROLES, type OrganizationRole } from "@/lib/organizations/rbac";
import { loadAdministration, setMembership, type OrganizationMembership } from "@/lib/organizations/administration";

export function AdministrationView({ session }: { session: Session }) {
  const [state, setState] = useState<Awaited<ReturnType<typeof loadAdministration>>>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { try { setState(await loadAdministration(session)); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل الإدارة"); } }, [session]);
  useEffect(() => { void refresh(); }, [refresh]);
  if (error) return <section className="panel" role="alert"><h2>الإدارة</h2><p>{error}</p></section>;
  if (!state) return <section className="panel"><h2>الإدارة</h2><p>لا توجد عضوية نشطة.</p></section>;
  const role = state.current.role as OrganizationRole;
  const organization = state.current.organizations as unknown as { id: string; name: string; slug: string };
  const manage = hasOrganizationPermission(role, "membership.manage");
  const change = async (member: OrganizationMembership, nextRole: OrganizationRole) => { await setMembership(member.organization_id, member.user_id, nextRole, member.status); await refresh(); };
  const deactivate = async (member: OrganizationMembership) => { await setMembership(member.organization_id, member.user_id, member.role, "suspended"); await refresh(); };
  return <section className="panel" aria-labelledby="administration-title">
    <h2 id="administration-title">إدارة المؤسسة</h2>
    <p><strong>{organization.name}</strong> · {organization.slug}</p>
    <p>دورك: <strong>{role}</strong>{hasOrganizationPermission(role, "organization.update") ? " · إدارة إعدادات المؤسسة متاحة" : " · إعدادات المؤسسة للمالك فقط"}</p>
    <h3>الأعضاء</h3>
    <div className="table-wrap"><table><thead><tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>
      {state.members.map((member) => <tr key={member.user_id}><td><code>{member.user_id}</code></td><td>
        {manage && canManageMember(role, member.role) ? <select aria-label={`دور ${member.user_id}`} value={member.role} onChange={(event) => void change(member, event.target.value as OrganizationRole)}>
          {ORGANIZATION_ROLES.filter((candidate) => canAssignRole(role, candidate, member.user_id === session.user.id)).map((candidate) => <option key={candidate}>{candidate}</option>)}
        </select> : member.role}
      </td><td>{member.status}</td><td>{manage && canManageMember(role, member.role) && member.user_id !== session.user.id ? <button type="button" onClick={() => void deactivate(member)}>تعطيل</button> : <span aria-label="غير مسموح">—</span>}</td></tr>)}
    </tbody></table></div>
    {!manage && <p>هذه الواجهة للقراءة فقط وفقًا لدورك.</p>}
  </section>;
}
