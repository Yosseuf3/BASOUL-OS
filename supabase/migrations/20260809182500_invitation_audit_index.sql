-- Cover the invitation actor foreign key used by administration audit queries.
create index organization_invitations_invited_by_idx
  on public.organization_invitations(invited_by);
