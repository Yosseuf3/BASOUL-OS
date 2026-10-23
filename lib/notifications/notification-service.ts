import {organizationClient} from '../organizations/scoped-client';
import {requireOrganizationLease} from '../organizations/active-context';

export async function openMembershipNotification(id:string):Promise<void> {
  const lease=requireOrganizationLease();
  const {data,error}=await organizationClient().rpc('membership_notification_target',{p_organization_id:lease.organizationId,p_notification_id:id});
  if(error||data?.view!=='administration'||data.organization_id!==lease.organizationId||typeof data.member_id!=='string')throw new Error('الرابط غير متاح أو سُحبت الصلاحية. / Link unavailable or access revoked.');
}

export async function markNotificationRead(id: string, read: boolean): Promise<string | null> {
  const supabase=organizationClient();
  const { error } = await supabase.from("notifications").update({
    is_read: read, read_at: read ? new Date().toISOString() : null,
  }).eq("id", id);
  return error?.message ?? null;
}

export async function markAllNotificationsRead(userId: string): Promise<string | null> {
  const supabase=organizationClient();
  const { error } = await supabase.from("notifications").update({
    is_read: true, read_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("is_read", false);
  return error?.message ?? null;
}

export async function deleteNotification(id: string): Promise<string | null> {
  const supabase=organizationClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  return error?.message ?? null;
}
