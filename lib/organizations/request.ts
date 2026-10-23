import {requireOrganizationLease} from './active-context';
import {assertOrganizationLease,OrganizationScopeError,type OrganizationLease} from '../../packages/shared-types/src/organization-scope';

export async function organizationFetch(input:RequestInfo|URL,init:RequestInit={},expectedOrganization?:string,expectedUser?:string,lease:OrganizationLease=requireOrganizationLease(expectedOrganization)) {
  assertOrganizationLease(lease);
  if((expectedOrganization&&expectedOrganization!==lease.organizationId)||(expectedUser&&expectedUser!==lease.userId))throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
  const headers=new Headers(init.headers);headers.set('x-yosseuf-organization',lease.organizationId);
  headers.set('x-basoul-task-create-contract','atomic-source-v1');
  const response=await fetch(input,{...init,headers});
  // A request already accepted by the server may commit. Never replay it or
  // project its result into a different selection; reload that org to confirm.
  assertOrganizationLease(lease);
  // Body decoding can finish after a switch even when headers arrived earlier.
  return new Proxy(response,{get(target,key){
    const value=Reflect.get(target,key,target);
    if(['json','text','blob','arrayBuffer','formData','bytes'].includes(String(key))&&typeof value==='function')return async()=>{
      assertOrganizationLease(lease);const body=await Reflect.apply(value,target,[]);assertOrganizationLease(lease);return body;
    };
    return typeof value==='function'?value.bind(target):value;
  }});
}
