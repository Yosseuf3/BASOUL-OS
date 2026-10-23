import { assertOrganizationLease, type OrganizationLease } from '../../packages/shared-types/src/organization-scope';
import type { OrganizationRole } from './rbac';

export type ActiveOrganization = {
  revision: number; userId: string | null; organizationId: string | null;
  role: OrganizationRole | null; phase: 'loading' | 'ready' | 'empty' | 'error';
};
let state: ActiveOrganization = {revision:0,userId:null,organizationId:null,role:null,phase:'loading'};
const listeners = new Set<() => void>();
export const organizationState = () => state;
export function subscribeOrganization(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function publish(next: ActiveOrganization) { state=next; for(const listener of listeners)listener(); }
export function beginOrganizationSelection(userId:string|null,organizationId:string|null) {
  publish({revision:state.revision+1,userId,organizationId,role:null,phase:'loading'});
  return state.revision;
}
export function finishOrganizationSelection(revision:number,role:OrganizationRole|null,phase:ActiveOrganization['phase']='ready') {
  if(state.revision!==revision)return false;
  publish({...state,role,phase});return true;
}
export function requireOrganizationLease(expectedOrganization?:string):OrganizationLease {
  const captured=state;
  if(captured.phase!=='ready' || !captured.userId || !captured.organizationId || (expectedOrganization && captured.organizationId!==expectedOrganization)) {
    assertOrganizationLease({isCurrent:()=>false});
  }
  return {userId:captured.userId!,organizationId:captured.organizationId!,revision:captured.revision,
    isCurrent:()=>state===captured && state.phase==='ready'};
}
