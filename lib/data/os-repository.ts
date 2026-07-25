import { supabase } from "@/lib/supabase";

export type OsTable = "projects" | "tasks" | "clients" | "content_items" | "knowledge_items" | "finance_transactions" | "activity_events" | "notifications";

export async function listRows<T>(table: OsTable): Promise<{ data: T[]; error: string | null }> {
  const orderColumn = table === "activity_events" || table === "notifications" ? "created_at" : "updated_at";
  const result = await supabase.from(table).select("*").order(orderColumn, { ascending: false });
  return { data: (result.data ?? []) as T[], error: result.error?.message ?? null };
}

export async function saveRow<T extends { id: string }>(table: OsTable, userId: string, input: object, current?: T) {
  const payload = { ...input, user_id: userId };
  const result = current
    ? await supabase.from(table).update(payload).eq("id", current.id)
    : await supabase.from(table).insert(payload);
  return result.error?.message ?? null;
}

export async function deleteRow(table: OsTable, id: string) {
  const result = await supabase.from(table).delete().eq("id", id);
  return result.error?.message ?? null;
}
