'use client';
import {createContext,useCallback,useContext,useEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../../lib/supabase';
import {beginOrganizationSelection,finishOrganizationSelection,organizationState,subscribeOrganization} from '../../lib/organizations/active-context';
import {rememberOrganization,selectedOrganization} from '../../lib/organizations/workspace-selection';
import type {OrganizationRole} from '../../lib/organizations/rbac';

type Choice={id:string;name:string;role:OrganizationRole};
const Selection=createContext<{select:(id:string)=>void;choices:Choice[]}>({select:()=>undefined,choices:[]});
export function useActiveOrganization(){return {...useContext(Selection),...useSyncExternalStore(subscribeOrganization,organizationState,organizationState)};}
const publicPaths=new Set(['/login','/signup','/forgot-password','/reset-password','/set-password','/basoul-review','/yvl-review']);
export function OrganizationProvider({children}:{children:ReactNode}) {
  const path=usePathname();const [choices,setChoices]=useState<Choice[]>([]);
  const state=useSyncExternalStore(subscribeOrganization,organizationState,organizationState);
  const resolve=useCallback(async(userId:string|null,requested?:string)=>{
    const previous=organizationState();
    const target=userId?(requested??(previous.userId===userId?previous.organizationId:undefined)??selectedOrganization(userId)):undefined;
    const revision=beginOrganizationSelection(userId,target??null);setChoices([]);
    if(!userId){finishOrganizationSelection(revision,null,'empty');return;}
    try{
      const result=await supabase.from('organization_memberships').select('organization_id,role,organizations(id,name)')
        .eq('user_id',userId).eq('status','active').order('created_at');
      if(organizationState().revision!==revision)return;
      if(result.error)throw result.error;
      const rows=(result.data??[]).map(row=>{const org=Array.isArray(row.organizations)?row.organizations[0]:row.organizations;return {id:row.organization_id,name:org?.name??row.organization_id,role:row.role as OrganizationRole};});
      setChoices(rows);
      if(!rows.length){finishOrganizationSelection(revision,null,'empty');return;}
      const selected=target?rows.find(row=>row.id===target):rows[0];
      if(target&&!selected)throw new Error('Membership unavailable');
      if(!selected){finishOrganizationSelection(revision,null,'empty');return;}
      // Publish the chosen identity in a new generation before protected UI mounts.
      const readyRevision=beginOrganizationSelection(userId,selected.id);
      rememberOrganization(userId,selected.id);setChoices(rows);finishOrganizationSelection(readyRevision,selected.role);
    }catch{finishOrganizationSelection(revision,null,'error');}
  },[]);
  useEffect(()=>{
    let active=true,authEvent=false;
    void supabase.auth.getSession().then(({data})=>{if(active&&!authEvent)void resolve(data.session?.user.id??null);});
    const {data}=supabase.auth.onAuthStateChange((event,session)=>{
      authEvent=true;
      if(active && (event==='INITIAL_SESSION'||organizationState().userId!==(session?.user.id??null)))void resolve(session?.user.id??null);
    });
    return()=>{active=false;data.subscription.unsubscribe();};
  },[path,resolve]);
  const select=(id:string)=>{if(id!==state.organizationId && state.userId)void resolve(state.userId,id);};
  if(publicPaths.has(path)||(!state.userId&&state.phase==='empty')||(path==='/onboarding'&&state.phase==='empty'))return children;
  return <Selection.Provider value={{select,choices}}>
    {state.phase==='ready'?<div key={`${state.userId}:${state.revision}`} style={{display:'contents'}}>
      {choices.length>1&&path!=='/'&&<label className="field" style={{maxWidth:360,margin:'12px auto'}}>المؤسسة / Organization <select aria-label="المؤسسة النشطة / Active organization" value={state.organizationId??''} onChange={event=>select(event.target.value)}>{choices.map(choice=><option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></label>}
      {children}
    </div>:<main role={state.phase==='loading'?'status':'alert'} aria-live="polite" style={{padding:24}}>
      <p>{state.phase==='loading'?'جارٍ التحقق من المؤسسة… / Verifying organization…':state.phase==='empty'?'لا توجد مؤسسة نشطة. / No active organization.':'تعذر التحقق من المؤسسة. الكتابة متوقفة. / Organization verification failed. Writes are blocked.'}</p>
      {state.phase==='empty'?<a href="/onboarding">إعداد المؤسسة / Organization setup</a>:state.phase==='error'?<button onClick={()=>void resolve(state.userId,state.organizationId??undefined)}>إعادة التحقق / Verify again</button>:null}
      {state.phase==='error'&&choices.length>0&&<select aria-label="اختر مؤسسة نشطة / Choose active organization" value="" onChange={event=>select(event.target.value)}><option value="" disabled>اختر مؤسسة / Choose organization</option>{choices.map(choice=><option key={choice.id} value={choice.id}>{choice.name}</option>)}</select>}
    </main>}
  </Selection.Provider>;
}
