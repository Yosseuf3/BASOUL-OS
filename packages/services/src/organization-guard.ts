import {assertOrganizationLease} from '../../shared-types/src/organization-scope';

/** Keeps a captured selection attached to fluent requests and async SDK calls.
 * Membership/permission validation stays in the existing services and RLS.
 */
export function guardOrganizationClient<T extends object>(client:T,isCurrent:()=>boolean):T {
  const lease={isCurrent};
  function wrap<U extends object>(target:U):U {
    return new Proxy(target,{get(object,key){
      if(key==='then' && typeof Reflect.get(object,key)==='function')return (resolve:(value:unknown)=>unknown,reject:(cause:unknown)=>unknown)=>{
        assertOrganizationLease(lease);
        return Promise.resolve(object).then(result=>{assertOrganizationLease(lease);return result;}).then(resolve,reject);
      };
      const value=Reflect.get(object,key);
      if(value && typeof value==='object')return wrap(value);
      if(typeof value!=='function')return value;
      return (...args:unknown[])=>{
        assertOrganizationLease(lease);
        const result=Reflect.apply(value,object,args);
        return result && typeof result==='object'?wrap(result):result;
      };
    }});
  }
  return wrap(client);
}
