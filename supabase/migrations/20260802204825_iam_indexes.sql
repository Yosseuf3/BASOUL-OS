-- Foreign-key indexes required by the IAM-era schema review.
create index if not exists organizations_created_by_idx on public.organizations(created_by);
create index if not exists organization_memberships_invited_by_idx on public.organization_memberships(invited_by) where invited_by is not null;
create index if not exists architectural_review_comments_project_idx on public.architectural_review_comments(project_id);
create index if not exists notifications_activity_event_idx on public.notifications(activity_event_id) where activity_event_id is not null;
