"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { canAssignRole, canManageMember, hasOrganizationPermission, ORGANIZATION_ROLES, type OrganizationRole } from "@/lib/organizations/rbac";
import { loadAdministration, setMembership, type OrganizationMembership } from "@/lib/organizations/administration";

export function AdministrationView({ session }: { session: Session }) {
  const [state, setState] = useState<Awaited<ReturnType<typeof loadAdministration>>>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { try { setState(await loadAdministration(session)); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©"); } }, [session]);
  useEffect(() => { void refresh(); }, [refresh]);
  if (error) return <section className="panel" role="alert"><h2>Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©</h2><p>{error}</p></section>;
  if (!state) return <section className="panel"><h2>Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©</h2><p>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ø¶ÙˆÙŠØ© Ù†Ø´Ø·Ø©.</p></section>;
  const role = state.current.role as OrganizationRole;
  const organization = state.current.organizations as unknown as { id: string; name: string; slug: string };
  const manage = hasOrganizationPermission(role, "membership.manage");
  const change = async (member: OrganizationMembership, nextRole: OrganizationRole) => { await setMembership(member.organization_id, member.user_id, nextRole, member.status); await refresh(); };
  const deactivate = async (member: OrganizationMembership) => { await setMembership(member.organization_id, member.user_id, member.role, "suspended"); await refresh(); };
  return <section className="panel" aria-labelledby="administration-title">
    <h2 id="administration-title">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¤Ø³Ø³Ø©</h2>
    <p><strong>{organization.name}</strong> Â· {organization.slug}</p>
    <p>Ø¯ÙˆØ±Ùƒ: <strong>{role}</strong>{hasOrganizationPermission(role, "organization.update") ? " Â· Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³Ø© Ù…ØªØ§Ø­Ø©" : " Â· Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³Ø© Ù„Ù„Ù…Ø§Ù„Ùƒ ÙÙ‚Ø·"}</p>
    <h3>Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡</h3>
    <div className="table-wrap"><table><thead><tr><th>Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</th><th>Ø§Ù„Ø¯ÙˆØ±</th><th>Ø§Ù„Ø­Ø§Ù„Ø©</th><th>Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th></tr></thead><tbody>
      {state.members.map((member) => <tr key={member.user_id}><td><code>{member.user_id}</code></td><td>
        {manage && canManageMember(role, member.role) ? <select aria-label={`Ø¯ÙˆØ± ${member.user_id}`} value={member.role} onChange={(event) => void change(member, event.target.value as OrganizationRole)}>
          {ORGANIZATION_ROLES.filter((candidate) => canAssignRole(role, candidate, member.user_id === session.user.id)).map((candidate) => <option key={candidate}>{candidate}</option>)}
        </select> : member.role}
      </td><td>{member.status}</td><td>{manage && canManageMember(role, member.role) && member.user_id !== session.user.id ? <button type="button" onClick={() => void deactivate(member)}>ØªØ¹Ø·ÙŠÙ„</button> : <span aria-label="ØºÙŠØ± Ù…Ø³Ù…ÙˆØ­">â€”</span>}</td></tr>)}
    </tbody></table></div>
    {!manage && <p>Ù‡Ø°Ù‡ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ù„Ù„Ù‚Ø±Ø§Ø¡Ø© ÙÙ‚Ø· ÙˆÙÙ‚Ù‹Ø§ Ù„Ø¯ÙˆØ±Ùƒ.</p>}
  </section>;
}

