import { supabase as raw } from '../supabase';
import { requireOrganizationLease } from './active-context';
import { assertOrganizationLease, OrganizationScopeError, type OrganizationLease } from '../../packages/shared-types/src/organization-scope';

/** Scope the existing fluent client; RLS remains the authoritative boundary.
 * Each operation captures one lease, checks it before dispatch and after every
 * await, and revalidates identity/membership before writes. Never retries writes.
 */
export function organizationClient(expectedOrganization?:string,expectedUser?:string) {
  const lease=requireOrganizationLease(expectedOrganization);
  if(expectedUser&&expectedUser!==lease.userId)throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
  return scopedClient(lease);
}
function scopedClient(lease:OrganizationLease):typeof raw {
  async function verify(write=false,remove=false) {
    assertOrganizationLease(lease);
    const {data:identity,error:identityError}=await raw.auth.getUser();
    assertOrganizationLease(lease);
    if(identityError || identity.user?.id!==lease.userId)throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
    const {data,error}=await raw.from('organization_memberships').select('role,status')
      .eq('user_id',lease.userId).eq('organization_id',lease.organizationId).eq('status','active').maybeSingle();
    assertOrganizationLease(lease);
    if(error || !data || (write && !['owner','admin','member'].includes(data.role)) || (remove && !['owner','admin'].includes(data.role)))throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
  }
  async function execute<T>(operation:()=>PromiseLike<T>,write=false,remove=false) {
    if(write)await verify(write,remove);assertOrganizationLease(lease);
    const result=await operation();assertOrganizationLease(lease);return result;
  }
  async function verifyReferences(rows:Record<string,unknown>[]) {
    const references={project_id:'projects',client_id:'clients',drawing_id:'architectural_drawings',review_id:'architectural_reviews',plan_element_id:'architectural_plan_elements',project_file_id:'project_files'};
    for(const row of rows)for(const [field,table] of Object.entries(references))if(row[field]!=null){
      assertOrganizationLease(lease);
      const result=await raw.from(table).select('id').eq('id',row[field]).eq('organization_id',lease.organizationId).single();
      assertOrganizationLease(lease);
      if(result.error||!result.data)throw new OrganizationScopeError('ORGANIZATION_RECORD_UNAVAILABLE');
    }
  }
  function query<T extends object>(target:T,table:string,write=false,remove=false,insert=false,rows:Record<string,unknown>[]=[]):T {
    return new Proxy(target,{get(object,key){
      if(key==='then')return (resolve: (value:unknown)=>unknown,reject:(cause:unknown)=>unknown)=>execute(async()=>{
        if(write)await verifyReferences(rows);assertOrganizationLease(lease);return await Promise.resolve(object);
      },write,remove).then(result=>{
        const response=result as {error?:unknown;data?:unknown};
        if(write && !insert && !response.error && Array.isArray(response.data) && response.data.length===0)throw new OrganizationScopeError('ORGANIZATION_RECORD_UNAVAILABLE');
        return result;
      }).then(resolve,reject);
      const value=Reflect.get(object,key);
      if(typeof value!=='function')return value;
      return (...args:unknown[])=>{
        assertOrganizationLease(lease);
        const mutation=['insert','upsert','update','delete'].includes(String(key));
        const creating=key==='insert'||key==='upsert';
        if(creating || key==='update') {
          const payload=(item:unknown)=>{
            const row=item as Record<string,unknown>;
            if(row.organization_id!==undefined && row.organization_id!==lease.organizationId)throw new OrganizationScopeError('ORGANIZATION_RECORD_UNAVAILABLE');
            if(row.user_id!==undefined && row.user_id!==lease.userId)throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
            return {...row,...(table==='organizations'?{}:{organization_id:lease.organizationId})};
          };
          args[0]=Array.isArray(args[0])?args[0].map(payload):payload(args[0]);
          rows=(Array.isArray(args[0])?args[0]:[args[0]]) as Record<string,unknown>[];
        }
        let next=Reflect.apply(value,object,args);
        if(['select','update','delete'].includes(String(key)) && !insert && !creating)next=next.eq(table==='organizations'?'id':'organization_id',lease.organizationId);
        // Ask for a confirmed row set on writes that otherwise return 204.
        if(key==='update'||key==='delete')next=next.select();
        return next && typeof next==='object'?query(next,table,write||mutation,remove||key==='delete',insert||creating,rows):next;
      };
    }});
  }
  function guarded<T extends object>(target:T,kind:'storage'|'functions',bucket?:string):T {
    return new Proxy(target,{get(object,key){const value=Reflect.get(object,key);if(typeof value!=='function')return value;
      return (...args:unknown[])=>{
        assertOrganizationLease(lease);
        if(key==='from')return guarded(Reflect.apply(value,object,args),kind,String(args[0]));
        const write=kind==='functions'||!['createSignedUrl','createSignedUrls','download','list','getPublicUrl'].includes(String(key));
        return execute(async()=>{
          if(kind==='storage' && ['project-files','architectural-drawings'].includes(bucket??'')) {
            const paths=Array.isArray(args[0])?args[0]:[args[0]];
            for(const path of paths){
              const projectId=typeof path==='string'?path.split('/')[1]:null;
              if(!projectId)throw new OrganizationScopeError('ORGANIZATION_RECORD_UNAVAILABLE');
              const found=await raw.from('projects').select('id').eq('id',projectId).eq('organization_id',lease.organizationId).single();
              assertOrganizationLease(lease);
              if(found.error||!found.data)throw new OrganizationScopeError('ORGANIZATION_RECORD_UNAVAILABLE');
            }
          }
          if(kind==='functions') {
            const body=(args[1] as {body?:Record<string,unknown>}|undefined)?.body;
            if(body?.organizationId && body.organizationId!==lease.organizationId)throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
            if(body?.drawingId) {
              const found=await raw.from('architectural_drawings').select('id').eq('id',body.drawingId).eq('organization_id',lease.organizationId).single();
              if(found.error || !found.data)throw new OrganizationScopeError('ORGANIZATION_RECORD_UNAVAILABLE');
            }
          }
          assertOrganizationLease(lease);return Reflect.apply(value,object,args);
        },write);
      };
    }});
  }
  return new Proxy(raw,{get(object,key){
    if(key==='auth')return new Proxy(raw.auth,{get(auth,method){
      const value=Reflect.get(auth,method);
      if(!['getUser','getSession'].includes(String(method)))return typeof value==='function'?value.bind(auth):value;
      return async(...args:unknown[])=>{
        assertOrganizationLease(lease);const result=await Reflect.apply(value,auth,args) as {data?:{user?:{id:string}|null;session?:{user:{id:string}}|null}};assertOrganizationLease(lease);
        const user=result.data?.user??result.data?.session?.user;
        if(!user||user.id!==lease.userId)throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
        return result;
      };
    }});
    if(key==='from')return (table:string)=>query(raw.from(table),table);
    if(key==='storage')return guarded(raw.storage,'storage');
    if(key==='functions')return guarded(raw.functions,'functions');
    if(key==='rpc')return (name:string,args:Record<string,unknown>={})=>execute(()=>{
      for(const field of ['p_organization_id','organizationId','target_organization'])if(args[field] && args[field]!==lease.organizationId)throw new OrganizationScopeError('ORGANIZATION_ACCESS_DENIED');
      return raw.rpc(name,args);
    },name!=='deliver_task_transition_notifications');
    const value=Reflect.get(object,key);return typeof value==='function'?value.bind(object):value;
  }});
}
