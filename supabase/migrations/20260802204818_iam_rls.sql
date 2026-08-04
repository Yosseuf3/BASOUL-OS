-- YOSSEUF OS v3.1.0: deny-by-default organization RLS.
begin;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

drop policy if exists organizations_select_member on public.organizations;
drop policy if exists organizations_update_admin on public.organizations;
drop policy if exists organizations_delete_owner on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated
  using (private.has_permission(id,'read'));
create policy organizations_update_admin on public.organizations for update to authenticated
  using (private.has_permission(id,'manage_members')) with check (private.has_permission(id,'manage_members'));
create policy organizations_delete_owner on public.organizations for delete to authenticated
  using (private.has_permission(id,'manage_organization'));

drop policy if exists memberships_select_member on public.organization_memberships;
create policy memberships_select_member on public.organization_memberships for select to authenticated
  using (private.has_permission(organization_id,'read'));

do $$
declare table_name text; policy record;
begin
  foreach table_name in array array[
    'projects','tasks','clients','content_items','knowledge_items','finance_transactions',
    'activity_events','notifications','architectural_drawings','architectural_reviews',
    'architectural_review_findings','architectural_analysis_runs','architectural_plan_elements',
    'architectural_review_comments','project_files','project_notes'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('alter table public.%I force row level security', table_name);
      for policy in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
        execute format('drop policy %I on public.%I', policy.policyname, table_name);
      end loop;
      execute format('create policy %I on public.%I for select to authenticated using (private.has_permission(organization_id,''read''))', table_name || '_org_select', table_name);
      execute format('create policy %I on public.%I for insert to authenticated with check (private.has_permission(organization_id,''create'') and user_id=(select auth.uid()))', table_name || '_org_insert', table_name);
      execute format('create policy %I on public.%I for update to authenticated using (private.has_permission(organization_id,''update'')) with check (private.has_permission(organization_id,''update'') and user_id=(select auth.uid()))', table_name || '_org_update', table_name);
      execute format('create policy %I on public.%I for delete to authenticated using (private.has_permission(organization_id,''delete''))', table_name || '_org_delete', table_name);
      execute format('grant select,insert,update,delete on public.%I to authenticated', table_name);
      execute format('revoke all on public.%I from anon', table_name);
    end if;
  end loop;
end $$;

grant select on public.organizations, public.organization_memberships to authenticated;
revoke all on public.organizations, public.organization_memberships from anon;

-- Storage remains user-folder isolated and therefore cannot cross organizations.
drop policy if exists architectural_storage_update_own on storage.objects;
create policy architectural_storage_update_own on storage.objects for update to authenticated
using (bucket_id='architectural-drawings' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='architectural-drawings' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists project_file_storage_update_own on storage.objects;
create policy project_file_storage_update_own on storage.objects for update to authenticated
using (bucket_id='project-files' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='project-files' and (storage.foldername(name))[1]=(select auth.uid())::text);

commit;
