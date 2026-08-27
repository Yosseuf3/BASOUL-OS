begin;

revoke all on public.architecture_scenes from anon;
revoke all on public.architecture_scenes from authenticated;
grant select, insert, update, delete on public.architecture_scenes to authenticated;

commit;
