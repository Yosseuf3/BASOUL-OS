-- Qualify outer columns: unqualified organization_id binds to the inner projects row.
-- No data rewrite, grant change, RLS disable, or owner/role policy expansion.
begin;

alter policy project_files_org_select on public.project_files using (
  private.has_permission(project_files.organization_id,'read') and exists (
    select 1 from public.projects p where p.id=project_files.project_id
      and p.organization_id=project_files.organization_id
  )
);
alter policy project_files_org_insert on public.project_files with check (
  project_files.user_id=(select auth.uid())
  and private.has_permission(project_files.organization_id,'create') and exists (
    select 1 from public.projects p where p.id=project_files.project_id
      and p.organization_id=project_files.organization_id
  )
);
alter policy project_files_org_update on public.project_files using (
  private.has_permission(project_files.organization_id,'update') and exists (
    select 1 from public.projects p where p.id=project_files.project_id
      and p.organization_id=project_files.organization_id
  )
) with check (
  project_files.user_id=(select auth.uid())
  and private.has_permission(project_files.organization_id,'update') and exists (
    select 1 from public.projects p where p.id=project_files.project_id
      and p.organization_id=project_files.organization_id
  )
);
alter policy project_files_org_delete on public.project_files using (
  private.has_permission(project_files.organization_id,'delete') and exists (
    select 1 from public.projects p where p.id=project_files.project_id
      and p.organization_id=project_files.organization_id
  )
);

commit;
