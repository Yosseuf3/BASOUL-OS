import { supabase } from "@/lib/supabase";

export async function markNotificationRead(id: string, read: boolean): Promise<string | null> {
  const { error } = await supabase.from("notifications").update({
    is_read: read, read_at: read ? new Date().toISOString() : null,
  }).eq("id", id);
  return error?.message ?? null;
}

export async function markAllNotificationsRead(userId: string): Promise<string | null> {
  const { error } = await supabase.from("notifications").update({
    is_read: true, read_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("is_read", false);
  return error?.message ?? null;
}

export async function deleteNotification(id: string): Promise<string | null> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  return error?.message ?? null;
}
