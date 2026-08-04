import type { Session } from "@supabase/supabase-js";
import type { AuthorizedResource } from "@/lib/auth/authorized-workspace";

export async function authorizedWorkspaceWrite(resource: AuthorizedResource, session: Session, input: object, id?: string) {
  const response = await fetch(`/api/workspace/${resource}`, {
    method: id ? "PATCH" : "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(id ? { ...input, id } : input),
  });
  const result = await response.json() as { error?: string };
  return response.ok ? null : result.error ?? "Request denied";
}

export async function authorizedWorkspaceDelete(resource: AuthorizedResource, session: Session, id: string) {
  const response = await fetch(`/api/workspace/${resource}?id=${encodeURIComponent(id)}`, {
    method: "DELETE", headers: { authorization: `Bearer ${session.access_token}` },
  });
  const result = await response.json() as { error?: string };
  return response.ok ? null : result.error ?? "Request denied";
}
