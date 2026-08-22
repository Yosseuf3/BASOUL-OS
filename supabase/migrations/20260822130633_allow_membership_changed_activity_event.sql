-- BASOUL v4.0.1 staging validation repair.
-- Existing membership administration emits `membership_changed`, but the
-- activity event constraint predates that approved administration action.
alter table public.activity_events
  drop constraint if exists activity_events_action_check;

alter table public.activity_events
  add constraint activity_events_action_check check (action in (
    'created',
    'updated',
    'deleted',
    'completed',
    'paid',
    'published',
    'member_invited',
    'membership_changed',
    'role_changed',
    'member_deactivated',
    'membership_removed',
    'invitation_revoked'
  ));
