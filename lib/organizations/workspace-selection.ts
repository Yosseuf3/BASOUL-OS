/** A UI preference only. Every server request revalidates membership. */
export function selectedOrganization(userId:string) {
  try { return typeof window==='undefined' ? undefined : window.sessionStorage.getItem(`basoul:organization:${userId}`) ?? undefined; }
  catch { return undefined; }
}
export function rememberOrganization(userId:string,organizationId:string) {
  try { window.sessionStorage.setItem(`basoul:organization:${userId}`,organizationId); } catch { /* private browsing */ }
}
