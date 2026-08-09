-- Allow the established administration audit writer to record Phase 7/8 actions.
begin;

alter table public.activity_events
  drop constraint activity_events_module_check;

alter table public.activity_events
  add constraint activity_events_module_check check (
    module in ('projects','tasks','clients','content','knowledge','finance','system','administration')
  );

alter table public.activity_events
  drop constraint activity_events_action_check;

alter table public.activity_events
  add constraint activity_events_action_check check (
    action in (
      'created','updated','deleted','completed','paid','published',
      'member_invited','role_changed','member_deactivated','membership_removed','invitation_revoked'
    )
  );

commit;
