import {organizationClient} from '../organizations/scoped-client';

export type OsTable = "projects" | "tasks" | "clients" | "content_items" | "knowledge_items" | "finance_transactions" | "activity_events" | "notifications";

export async function listRows<T>(table: OsTable, organizationId?: string, recipientId?: string): Promise<{ data: T[]; error: string | null }> {
  const supabase=organizationClient(organizationId);
  const orderColumn = table === "activity_events" || table === "notifications" ? "created_at" : "updated_at";
  let query = supabase.from(table).select("*");
  if (organizationId) query = query.eq('organization_id',organizationId);
  if (table==='notifications' && recipientId) query = query.eq('user_id',recipientId);
  const result = await query.order(orderColumn, { ascending: false });
  return { data: (result.data ?? []) as T[], error: result.error?.message ?? null };
}

export async function saveRow<T extends { id: string }>(table: OsTable, userId: string, input: object, current?: T) {
  const supabase=organizationClient();
  const payload = { ...input, user_id: userId };
  const result = current
    ? await supabase.from(table).update(payload).eq("id", current.id)
    : await supabase.from(table).insert(payload);
  return result.error?.message ?? null;
}

export async function deleteRow(table: OsTable, id: string) {
  const supabase=organizationClient();
  const result = await supabase.from(table).delete().eq("id", id);
  return result.error?.message ?? null;
}
