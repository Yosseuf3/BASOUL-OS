import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type User } from "npm:@supabase/supabase-js@2.111.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const roleRank = { viewer: 10, member: 20, admin: 30, owner: 40 } as const;
type ManagedRole = "viewer" | "member" | "admin";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function isManagedRole(value: unknown): value is ManagedRole {
  return value === "viewer" || value === "member" || value === "admin";
}
function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function publicError(error: { code?: string; message?: string } | null, fallback: string) {
  if (!error) return fallback;
  if (error.code === "42501") return "This administrative action is not permitted.";
  if (error.code === "23505") return "An active membership or pending invitation already exists.";
  return fallback;
}

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string): Promise<User | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  return null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond({ error: "Authentication is required." }, 401);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration is incomplete." }, 503);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: identity, error: identityError } = await userClient.auth.getUser(authorization.slice(7));
  if (identityError || !identity.user) return respond({ error: "Invalid session." }, 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return respond({ error: "Invalid JSON body." }, 400); }
  const action = body.action;
  const organizationId = body.organizationId;

  if (action === "accept") {
    const { data, error } = await userClient.rpc("accept_organization_invitations");
    return error ? respond({ error: publicError(error, "Unable to accept invitations.") }, 403) : respond({ accepted: data ?? 0 });
  }

  if (!isUuid(organizationId)) return respond({ error: "A valid organization is required." }, 400);
  const { data: membership, error: membershipError } = await userClient.from("organization_memberships")
    .select("role,status").eq("organization_id", organizationId).eq("user_id", identity.user.id).eq("status", "active").maybeSingle();
  if (membershipError || !membership || roleRank[membership.role as keyof typeof roleRank] < roleRank.admin) {
    return respond({ error: "Administrative membership is required." }, 403);
  }

  if (action === "list") {
    const [{ data: invitations, error: invitationsError }, { data: members, error: membersError }] = await Promise.all([
      admin.from("organization_invitations").select("id,email,target_user_id,role,status,expires_at,created_at,updated_at")
        .eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
      admin.from("organization_memberships").select("organization_id,user_id,role,status,created_at,updated_at")
        .eq("organization_id", organizationId).order("created_at"),
    ]);
    if (invitationsError || membersError) return respond({ error: "Unable to load administration state." }, 500);
    return respond({ invitations: invitations ?? [], members: members ?? [] });
  }

  if (action === "invite") {
    const email = normalizeEmail(body.email);
    const role = body.role;
    if (!email || !isManagedRole(role)) return respond({ error: "A valid email and non-owner role are required." }, 400);
    const { data: invitation, error: invitationError } = await userClient.rpc("create_organization_invitation", {
      target_organization: organizationId, target_email: email, target_role: role,
    });
    if (invitationError || !invitation) return respond({ error: publicError(invitationError, "Unable to create invitation.") }, 403);
    let target = await findUserByEmail(admin, email);
    let delivery: "existing_user" | "email_sent" = "existing_user";
    if (!target) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { basoul_invitation_id: invitation.id, basoul_organization_id: organizationId },
      });
      if (error || !data.user) {
        await userClient.rpc("revoke_organization_invitation", { target_invitation: invitation.id });
        return respond({ error: "The Auth invitation could not be delivered." }, 502);
      }
      target = data.user;
      delivery = "email_sent";
    }
    const { error: attachError } = await userClient.rpc("attach_organization_invitation", {
      target_invitation: invitation.id, target_user: target.id,
    });
    if (attachError) {
      await userClient.rpc("revoke_organization_invitation", { target_invitation: invitation.id });
      return respond({ error: publicError(attachError, "Unable to attach invitation identity.") }, 403);
    }
    return respond({ invitation: { id: invitation.id, email, role, status: "pending", expires_at: invitation.expires_at }, delivery }, 201);
  }

  if (action === "change_role") {
    if (!isUuid(body.userId) || !isManagedRole(body.role)) return respond({ error: "A valid user and non-owner role are required." }, 400);
    const { error } = await userClient.rpc("change_organization_member_role", {
      target_organization: organizationId, target_user: body.userId, target_role: body.role,
    });
    return error ? respond({ error: publicError(error, "Unable to change member role.") }, 403) : respond({ ok: true });
  }

  if (action === "deactivate") {
    if (!isUuid(body.userId)) return respond({ error: "A valid user is required." }, 400);
    const { error } = await userClient.rpc("deactivate_organization_member", {
      target_organization: organizationId, target_user: body.userId,
    });
    return error ? respond({ error: publicError(error, "Unable to deactivate member.") }, 403) : respond({ ok: true });
  }

  if (action === "remove") {
    if (!isUuid(body.userId)) return respond({ error: "A valid user is required." }, 400);
    const { error } = await userClient.rpc("remove_organization_membership", {
      target_organization: organizationId, target_user: body.userId,
    });
    return error ? respond({ error: publicError(error, "Unable to remove member.") }, 403) : respond({ ok: true });
  }

  if (action === "revoke") {
    if (!isUuid(body.invitationId)) return respond({ error: "A valid invitation is required." }, 400);
    const { error } = await userClient.rpc("revoke_organization_invitation", { target_invitation: body.invitationId });
    return error ? respond({ error: publicError(error, "Unable to revoke invitation.") }, 403) : respond({ ok: true });
  }

  return respond({ error: "Unsupported administration action." }, 400);
});
