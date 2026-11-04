-- ISOLATED SYNTHETIC REHEARSAL ONLY. Not a migration or production deletion script.
\set ON_ERROR_STOP on
begin;
create schema rehearsal;
create role privacy_rehearsal_member nologin nobypassrls;
create table rehearsal.accounts(id int primary key,email text not null);
create table rehearsal.organizations(id int primary key,created_by int not null references rehearsal.accounts on delete restrict);
create table rehearsal.memberships(org_id int references rehearsal.organizations,user_id int references rehearsal.accounts on delete cascade);
create table rehearsal.projects(id int primary key,org_id int references rehearsal.organizations,user_id int not null references rehearsal.accounts on delete cascade);
create table rehearsal.storage_objects(id int primary key,user_id int references rehearsal.accounts);
insert into rehearsal.accounts values(1,'owner@example.invalid'),(2,'personal@example.invalid'),(3,'shared-author@example.invalid');
insert into rehearsal.organizations values(10,1),(20,1);
insert into rehearsal.memberships values(10,1),(10,2),(10,3);
insert into rehearsal.projects values(100,10,1),(101,10,3),(200,20,1);
insert into rehearsal.storage_objects values(1,2);
alter table rehearsal.projects enable row level security;
create policy member_read on rehearsal.projects for select to privacy_rehearsal_member using
 (exists(select 1 from rehearsal.memberships m where m.org_id=projects.org_id and m.user_id=nullif(current_setting('rehearsal.user_id',true),'')::int));
grant usage on schema rehearsal to privacy_rehearsal_member;
grant select on rehearsal.projects,rehearsal.memberships to privacy_rehearsal_member;
set local role privacy_rehearsal_member;
set local rehearsal.user_id='2';
do $$ begin
 if (select count(*) from rehearsal.projects)<>2 then raise exception 'same-org access failed'; end if;
 if exists(select 1 from rehearsal.projects where org_id=20) then raise exception 'cross-org visible'; end if;
end $$;
reset role;
-- Reproduce why blindly deleting an author is unsafe, then undo only this subtransaction.
do $$ begin
 begin
  delete from rehearsal.accounts where id=3;
  if exists(select 1 from rehearsal.projects where id=101) then raise exception 'expected cascade was not reproduced'; end if;
  raise exception using errcode='P0002',message='rollback intentional cascade reproduction';
 exception when no_data_found then null;
 end;
 if not exists(select 1 from rehearsal.projects where id=101) then raise exception 'shared project not restored'; end if;
 begin
  delete from rehearsal.accounts where id=1;
  raise exception 'owner restriction missing';
 exception when foreign_key_violation then null;
 end;
end $$;
-- Verified operator must stop a shared-author request, not cascade it or invent transfer authority.
do $$ begin
 if not exists(select 1 from rehearsal.projects where user_id=3) then raise exception 'shared preflight blocker missed'; end if;
end $$;
-- Personal-only synthetic fixture: remove access and object separately before removing account.
delete from rehearsal.memberships where user_id=2;
set local role privacy_rehearsal_member;
set local rehearsal.user_id='2';
do $$ begin
 if exists(select 1 from rehearsal.projects) then raise exception 'revoked account still has access'; end if;
end $$;
reset role;
delete from rehearsal.storage_objects where user_id=2;
delete from rehearsal.accounts where id=2;
do $$ begin
 if exists(select 1 from rehearsal.accounts where id=2) or exists(select 1 from rehearsal.memberships where user_id=2) or exists(select 1 from rehearsal.storage_objects where user_id=2) then raise exception 'personal deletion incomplete'; end if;
 if (select count(*) from rehearsal.projects)<>3 or (select count(*) from rehearsal.organizations)<>2 then raise exception 'shared records changed'; end if;
end $$;
select 'PASS: synthetic same-org/cross-org/revocation/personal erasure/shared-history guard' as result;
rollback;
-- Scope: PostgreSQL FK/RLS rehearsal, not real GoTrue, real Storage or delivered-email evidence.
