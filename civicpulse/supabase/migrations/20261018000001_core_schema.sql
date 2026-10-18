-- Core multi-tenant schema: organisations (societies), units, people, memberships.
-- Every tenant-owned row carries org_id and is protected by row-level security.

create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create extension if not exists pg_trgm with schema extensions;

-- Helpers used inside RLS policies. The API only exposes the public schema, so
-- these are callable from policies but not over HTTP.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ───────────────────────────── Types ─────────────────────────────

create type public.org_type as enum ('society', 'city', 'institution', 'fm_company');
create type public.org_status as enum ('active', 'read_only', 'suspended');
create type public.member_role as enum (
  'org_admin', 'committee', 'finance', 'facility_manager',
  'staff', 'vendor', 'guard', 'resident_owner', 'resident_tenant'
);
create type public.member_status as enum ('pending', 'active', 'revoked');
create type public.occupancy_relation as enum ('owner', 'tenant', 'family');

-- ───────────────────────────── Tables ─────────────────────────────

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  type public.org_type not null default 'society',
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  city text not null default 'Hyderabad',
  address text,
  plan text not null default 'free' check (plan in ('free', 'community', 'finance', 'custom')),
  status public.org_status not null default 'active',
  is_demo boolean not null default false,
  settings jsonb not null default '{"require_after_photo": true}'::jsonb,
  issue_seq integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort integer not null default 0,
  unique (org_id, name)
);
create index blocks_org_idx on public.blocks (org_id);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  block_id uuid references public.blocks (id) on delete set null,
  number text not null check (char_length(number) between 1 and 30),
  floor integer,
  area_sqft numeric(10, 2) check (area_sqft is null or area_sqft > 0),
  unit_type text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (org_id, block_id, number)
);
create index units_org_idx on public.units (org_id);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  phone text,
  email text,
  locale text not null default 'en' check (locale in ('en', 'te', 'hi', 'ur')),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  status public.member_status not null default 'pending',
  title text check (title is null or char_length(title) <= 60),
  invited_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, profile_id, role)
);
create index memberships_profile_idx on public.memberships (profile_id, status);
create index memberships_org_idx on public.memberships (org_id, status);

create table public.unit_occupancies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  relation public.occupancy_relation not null default 'owner',
  status public.member_status not null default 'pending',
  from_date date not null default current_date,
  to_date date,
  created_at timestamptz not null default now()
);
create unique index unit_occupancies_current_idx
  on public.unit_occupancies (unit_id, profile_id) where status <> 'revoked';
create index unit_occupancies_profile_idx on public.unit_occupancies (profile_id);

create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  role public.member_role not null default 'resident_owner',
  auto_approve boolean not null default false,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0,
  expires_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index org_invites_org_idx on public.org_invites (org_id);

-- Append-only record of administrative changes.
-- No foreign keys: the log must outlive the rows it describes.
create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid,
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log (org_id, created_at desc);

-- DPDP: what each person agreed to, under which notice version.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  purpose text not null check (purpose in ('service', 'whatsapp_updates', 'email_updates', 'analytics')),
  notice_version text not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index consents_profile_idx on public.consents (profile_id);

-- Metered usage per org and month, used for fair-use quotas and cost tracking.
create table public.usage_counters (
  org_id uuid not null references public.orgs (id) on delete cascade,
  period date not null,
  ai_calls integer not null default 0,
  whatsapp_msgs integer not null default 0,
  sms_otps integer not null default 0,
  storage_bytes bigint not null default 0,
  primary key (org_id, period)
);

-- Demo requests from the public marketing site.
create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  community text not null check (char_length(community) between 1 and 160),
  homes text check (homes in ('1-50', '51-300', '300+')),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 20),
  message text check (message is null or char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

-- ───────────────────────────── Helper functions ─────────────────────────────
-- SECURITY DEFINER helpers live in the private schema so they are not exposed
-- through the API, and so policies can call them without recursive RLS checks.

create or replace function private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where profile_id = auth.uid());
$$;

create or replace function private.has_org_role(p_org uuid, p_roles public.member_role[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org
      and m.profile_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function private.is_org_member(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.profile_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function private.is_manager(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_platform_admin()
      or private.has_org_role(p_org, array['org_admin', 'committee', 'facility_manager']::public.member_role[]);
$$;

create or replace function private.is_org_admin(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_platform_admin()
      or private.has_org_role(p_org, array['org_admin']::public.member_role[]);
$$;

-- Can the current user see this person's profile? (self, or a manager of an org they belong to)
create or replace function private.can_view_profile(p_profile uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_profile = auth.uid()
      or private.is_platform_admin()
      or exists (
        select 1 from public.memberships target
        where target.profile_id = p_profile
          and private.is_manager(target.org_id)
      );
$$;

-- Trigram similarity (0–1) between two strings, used for duplicate detection.
create or replace function private.text_similarity(a text, b text)
returns real
language sql immutable parallel safe set search_path = extensions
as $$
  select extensions.similarity(a, b);
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  v_org := case when tg_table_name = 'orgs' then (v_row ->> 'id')::uuid else (v_row ->> 'org_id')::uuid end;
  insert into public.audit_log (org_id, actor_id, action, target_type, target_id, before, after)
  values (
    v_org,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_row ->> 'id',
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- Create a profile row whenever Supabase Auth creates a user.
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger orgs_touch before update on public.orgs
  for each row execute function private.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger memberships_touch before update on public.memberships
  for each row execute function private.touch_updated_at();

create trigger orgs_audit after insert or update or delete on public.orgs
  for each row execute function private.audit();
create trigger memberships_audit after insert or update or delete on public.memberships
  for each row execute function private.audit();
create trigger org_invites_audit after insert or update or delete on public.org_invites
  for each row execute function private.audit();
create trigger units_audit after insert or update or delete on public.units
  for each row execute function private.audit();

-- ───────────────────────────── Row-level security ─────────────────────────────

alter table public.orgs enable row level security;
alter table public.blocks enable row level security;
alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.memberships enable row level security;
alter table public.unit_occupancies enable row level security;
alter table public.org_invites enable row level security;
alter table public.audit_log enable row level security;
alter table public.consents enable row level security;
alter table public.usage_counters enable row level security;
alter table public.demo_requests enable row level security;

-- orgs: members read; org admins update. Creation goes through create_society().
create policy orgs_select on public.orgs for select to authenticated
  using (private.is_org_member(id) or private.is_platform_admin());
create policy orgs_update on public.orgs for update to authenticated
  using (private.is_org_admin(id)) with check (private.is_org_admin(id));

-- blocks and units: members read; managers write.
create policy blocks_select on public.blocks for select to authenticated
  using (private.is_org_member(org_id) or private.is_platform_admin());
create policy blocks_write on public.blocks for all to authenticated
  using (private.is_manager(org_id)) with check (private.is_manager(org_id));

create policy units_select on public.units for select to authenticated
  using (private.is_org_member(org_id) or private.is_platform_admin());
create policy units_write on public.units for all to authenticated
  using (private.is_manager(org_id)) with check (private.is_manager(org_id));

-- profiles: yourself, or managers of an org you belong to. Only you can edit yours.
create policy profiles_select on public.profiles for select to authenticated
  using (private.can_view_profile(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy platform_admins_select on public.platform_admins for select to authenticated
  using (profile_id = (select auth.uid()));

-- memberships: see your own; managers see their org's. Org admins manage roles.
create policy memberships_select on public.memberships for select to authenticated
  using (profile_id = (select auth.uid()) or private.is_manager(org_id));
create policy memberships_admin_write on public.memberships for all to authenticated
  using (private.is_org_admin(org_id)) with check (private.is_org_admin(org_id));

create policy occupancies_select on public.unit_occupancies for select to authenticated
  using (profile_id = (select auth.uid()) or private.is_manager(org_id));
create policy occupancies_manager_write on public.unit_occupancies for all to authenticated
  using (private.is_manager(org_id)) with check (private.is_manager(org_id));

create policy invites_manager on public.org_invites for all to authenticated
  using (private.is_manager(org_id)) with check (private.is_manager(org_id));

create policy audit_select on public.audit_log for select to authenticated
  using ((org_id is not null and private.is_org_admin(org_id)) or private.is_platform_admin());

create policy consents_own on public.consents for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy usage_select on public.usage_counters for select to authenticated
  using (private.is_org_admin(org_id));

create policy demo_requests_insert on public.demo_requests for insert to anon, authenticated
  with check (true);
create policy demo_requests_select on public.demo_requests for select to authenticated
  using (private.is_platform_admin());

-- Nobody writes the audit log or usage counters directly; triggers and server jobs do.
revoke insert, update, delete on public.audit_log from anon, authenticated;
revoke insert, update, delete on public.usage_counters from anon, authenticated;
revoke all on public.platform_admins from anon;
