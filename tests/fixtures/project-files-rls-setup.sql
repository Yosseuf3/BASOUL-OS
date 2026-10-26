-- Synthetic minimal host catalog, not a production dump.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin nobypassrls; end if;
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin nobypassrls; end if;
end $$;
create schema auth;
create schema private;
create schema storage;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table auth.users(id uuid primary key,email text);
create table public.organizations(id uuid primary key);
create table public.organization_memberships(organization_id uuid,user_id uuid,role text,status text,primary key(organization_id,user_id));
create table public.projects(id uuid primary key,organization_id uuid not null,name text);
create table public.organization_invitations(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,email text,role text,
 status text default 'pending',target_user_id uuid,invited_by uuid,
 expires_at timestamptz default now()+interval '7 days',accepted_at timestamptz,revoked_at timestamptz,
 created_at timestamptz default now(),updated_at timestamptz default now()
);
create table public.activity_events(organization_id uuid,user_id uuid,module text,action text,entity_id uuid,title text,description text,metadata jsonb);
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
grant usage on schema public,auth,private,storage to authenticated,anon;
grant select,insert,update,delete on public.projects,storage.objects to authenticated;
alter table public.projects enable row level security;
alter table storage.objects enable row level security;
