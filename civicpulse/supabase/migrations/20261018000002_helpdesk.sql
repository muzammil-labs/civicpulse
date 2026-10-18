-- Helpdesk: issues raised by residents, worked by committee and staff, closed with proof.

create type public.issue_status as enum (
  'open', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'rejected'
);
create type public.issue_urgency as enum ('low', 'medium', 'high', 'critical');
create type public.issue_source as enum ('app', 'whatsapp', 'staff', 'admin');
create type public.issue_visibility as enum ('community', 'private');
create type public.media_kind as enum ('before', 'after', 'attachment');

create table public.issue_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  key text not null check (key ~ '^[a-z_]{2,40}$'),
  label jsonb not null,
  icon text,
  default_sla_hours integer not null default 72 check (default_sla_hours between 1 and 2160),
  default_assignee_id uuid references public.profiles (id) on delete set null,
  sort integer not null default 0,
  active boolean not null default true,
  unique (org_id, key)
);
create index issue_categories_org_idx on public.issue_categories (org_id);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  ref_no integer not null default 0,
  category_id uuid references public.issue_categories (id) on delete set null,
  block_id uuid references public.blocks (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  location_text text check (location_text is null or char_length(location_text) <= 200),
  title text not null check (char_length(title) between 3 and 140),
  description text check (description is null or char_length(description) <= 4000),
  urgency public.issue_urgency not null default 'medium',
  status public.issue_status not null default 'open',
  visibility public.issue_visibility not null default 'community',
  assignee_id uuid references public.profiles (id) on delete set null,
  sla_due_at timestamptz,
  duplicate_of uuid references public.issues (id) on delete set null,
  source public.issue_source not null default 'app',
  ai_meta jsonb,
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 2000),
  rating smallint check (rating between 1 and 5),
  rating_comment text check (rating_comment is null or char_length(rating_comment) <= 1000),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  unique (org_id, ref_no)
);
create index issues_queue_idx on public.issues (org_id, status, created_at desc);
create index issues_assignee_idx on public.issues (assignee_id) where assignee_id is not null;
create index issues_creator_idx on public.issues (created_by);
create index issues_title_trgm_idx on public.issues using gin (title extensions.gin_trgm_ops);

-- Append-only timeline: status changes, assignments, comments, merges.
create table public.issue_events (
  id bigint generated always as identity primary key,
  issue_id uuid not null references public.issues (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in (
    'created', 'status_changed', 'assigned', 'comment', 'merged', 'media_added', 'rated', 'escalated'
  )),
  from_status public.issue_status,
  to_status public.issue_status,
  body text check (body is null or char_length(body) <= 4000),
  internal boolean not null default false,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index issue_events_issue_idx on public.issue_events (issue_id, created_at);

create table public.issue_media (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  kind public.media_kind not null default 'before',
  storage_path text not null check (char_length(storage_path) <= 500),
  mime text check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer check (size_bytes between 1 and 10485760),
  uploaded_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index issue_media_issue_idx on public.issue_media (issue_id);

-- "Me too": people affected by an issue, notified on every update.
create table public.issue_followers (
  issue_id uuid not null references public.issues (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, profile_id)
);
create index issue_followers_profile_idx on public.issue_followers (profile_id);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 8000),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index notices_org_idx on public.notices (org_id, published_at desc);

create table public.notice_reads (
  notice_id uuid not null references public.notices (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, profile_id)
);

-- ───────────────────────────── Visibility helper ─────────────────────────────

create or replace function private.can_view_issue(p_issue uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue
      and (
        private.is_manager(i.org_id)
        or i.created_by = auth.uid()
        or i.assignee_id = auth.uid()
        or (i.visibility = 'community' and private.is_org_member(i.org_id))
      )
  );
$$;

-- ───────────────────────────── Triggers ─────────────────────────────

-- Number issues per society (#1, #2 …), set the SLA deadline, and force a clean starting state.
create or replace function private.issues_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_sla integer;
  v_assignee uuid;
begin
  update public.orgs set issue_seq = issue_seq + 1
    where id = new.org_id
    returning issue_seq into new.ref_no;

  if new.category_id is not null then
    select c.default_sla_hours, c.default_assignee_id into v_sla, v_assignee
      from public.issue_categories c
      where c.id = new.category_id and c.org_id = new.org_id;
    if not found then
      raise exception 'Category does not belong to this society' using errcode = '23514';
    end if;
  end if;

  v_sla := coalesce(v_sla, 72);
  if new.urgency = 'critical' then
    v_sla := greatest(1, v_sla / 4);
  elsif new.urgency = 'high' then
    v_sla := greatest(1, v_sla / 2);
  end if;

  new.sla_due_at := new.created_at + make_interval(hours => v_sla);
  new.status := case when v_assignee is not null then 'assigned' else 'open' end;
  new.assignee_id := v_assignee;
  new.resolved_at := null;
  new.closed_at := null;
  new.rating := null;
  new.duplicate_of := null;
  return new;
end;
$$;

create or replace function private.issues_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.issue_events (issue_id, org_id, actor_id, type, to_status)
  values (new.id, new.org_id, new.created_by, 'created', new.status);
  insert into public.issue_followers (issue_id, profile_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

-- Enforce who may change what. Managers may change most fields; the assignee may
-- move the work along; the reporter may edit an open issue, reopen it, or rate it.
create or replace function private.issues_before_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_manager boolean;
  v_require_photo boolean;
begin
  if new.org_id <> old.org_id or new.ref_no <> old.ref_no or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception 'These fields cannot be changed' using errcode = '42501';
  end if;

  -- Server-side jobs (no signed-in user) are trusted.
  if v_uid is null then
    new.updated_at := now();
    return new;
  end if;

  v_is_manager := private.is_manager(old.org_id);

  if not v_is_manager then
    if v_uid = old.assignee_id then
      if new.assignee_id is distinct from old.assignee_id
         or new.category_id is distinct from old.category_id
         or new.urgency <> old.urgency
         or new.visibility <> old.visibility
         or new.duplicate_of is distinct from old.duplicate_of
         or new.sla_due_at is distinct from old.sla_due_at
         or new.title <> old.title
         or new.rating is distinct from old.rating then
        raise exception 'Assigned staff can only update status and the resolution note'
          using errcode = '42501';
      end if;
      if new.status <> old.status and new.status not in ('in_progress', 'on_hold', 'resolved') then
        raise exception 'Assigned staff cannot set status to %', new.status using errcode = '42501';
      end if;
    elsif v_uid = old.created_by then
      if new.assignee_id is distinct from old.assignee_id
         or new.category_id is distinct from old.category_id
         or new.urgency <> old.urgency
         or new.duplicate_of is distinct from old.duplicate_of
         or new.sla_due_at is distinct from old.sla_due_at
         or new.resolution_note is distinct from old.resolution_note then
        raise exception 'Residents cannot change assignment, category or urgency' using errcode = '42501';
      end if;
      if (new.title <> old.title or new.description is distinct from old.description
          or new.visibility <> old.visibility)
         and old.status <> 'open' then
        raise exception 'An issue can only be edited while it is open' using errcode = '42501';
      end if;
      if new.status <> old.status then
        -- The reporter may only reopen a resolved issue within 7 days.
        if not (old.status = 'resolved' and new.status = 'open'
                and old.resolved_at > now() - interval '7 days') then
          raise exception 'Residents can only reopen a recently resolved issue' using errcode = '42501';
        end if;
      end if;
      if new.rating is distinct from old.rating and old.status not in ('resolved', 'closed') then
        raise exception 'You can rate an issue once it is resolved' using errcode = '42501';
      end if;
    else
      raise exception 'Not allowed to update this issue' using errcode = '42501';
    end if;
  end if;

  -- Status bookkeeping.
  if new.status <> old.status then
    if new.status = 'resolved' then
      v_require_photo := coalesce(
        (select (o.settings ->> 'require_after_photo')::boolean from public.orgs o where o.id = old.org_id),
        true
      );
      if v_require_photo and not exists (
        select 1 from public.issue_media m where m.issue_id = old.id and m.kind = 'after'
      ) then
        raise exception 'Add an "after" photo before marking this issue resolved' using errcode = '23514';
      end if;
      new.resolved_at := now();
    elsif new.status = 'closed' then
      new.closed_at := now();
      new.resolved_at := coalesce(new.resolved_at, old.resolved_at, now());
    elsif new.status = 'open' then
      new.resolved_at := null;
      new.closed_at := null;
    end if;
  end if;

  if new.assignee_id is distinct from old.assignee_id
     and new.assignee_id is not null and new.status = 'open' then
    new.status := 'assigned';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.issues_after_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := coalesce(auth.uid(), new.created_by);
begin
  if new.status <> old.status then
    insert into public.issue_events (issue_id, org_id, actor_id, type, from_status, to_status, body)
    values (new.id, new.org_id, v_actor, 'status_changed', old.status, new.status,
            case when new.status in ('resolved', 'closed', 'rejected') then new.resolution_note end);
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.issue_events (issue_id, org_id, actor_id, type, payload)
    values (new.id, new.org_id, v_actor, 'assigned',
            jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
  end if;
  if new.rating is distinct from old.rating and new.rating is not null then
    insert into public.issue_events (issue_id, org_id, actor_id, type, payload, body)
    values (new.id, new.org_id, v_actor, 'rated', jsonb_build_object('rating', new.rating), new.rating_comment);
  end if;
  return new;
end;
$$;

create trigger issues_before_insert before insert on public.issues
  for each row execute function private.issues_before_insert();
create trigger issues_after_insert after insert on public.issues
  for each row execute function private.issues_after_insert();
create trigger issues_before_update before update on public.issues
  for each row execute function private.issues_before_update();
create trigger issues_after_update after update on public.issues
  for each row execute function private.issues_after_update();

create or replace function private.issue_media_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.issue_events (issue_id, org_id, actor_id, type, payload)
  values (new.issue_id, new.org_id, new.uploaded_by, 'media_added',
          jsonb_build_object('kind', new.kind, 'media_id', new.id));
  return new;
end;
$$;

create trigger issue_media_after_insert after insert on public.issue_media
  for each row execute function private.issue_media_after_insert();

create trigger issue_categories_audit after insert or update or delete on public.issue_categories
  for each row execute function private.audit();

-- ───────────────────────────── Row-level security ─────────────────────────────

alter table public.issue_categories enable row level security;
alter table public.issues enable row level security;
alter table public.issue_events enable row level security;
alter table public.issue_media enable row level security;
alter table public.issue_followers enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;

create policy categories_select on public.issue_categories for select to authenticated
  using (private.is_org_member(org_id) or private.is_platform_admin());
create policy categories_write on public.issue_categories for all to authenticated
  using (private.is_manager(org_id)) with check (private.is_manager(org_id));

create policy issues_select on public.issues for select to authenticated
  using (
    private.is_manager(org_id)
    or created_by = (select auth.uid())
    or assignee_id = (select auth.uid())
    or (visibility = 'community' and private.is_org_member(org_id))
  );
create policy issues_insert on public.issues for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_org_member(org_id)
    and exists (select 1 from public.orgs o where o.id = org_id and o.status = 'active')
  );
create policy issues_update on public.issues for update to authenticated
  using (
    private.is_manager(org_id)
    or created_by = (select auth.uid())
    or assignee_id = (select auth.uid())
  );

-- Comments are the only events people insert directly; everything else comes from triggers.
create policy events_select on public.issue_events for select to authenticated
  using (private.can_view_issue(issue_id) and (not internal or private.is_manager(org_id)));
create policy events_insert_comment on public.issue_events for insert to authenticated
  with check (
    type = 'comment'
    and actor_id = (select auth.uid())
    and private.can_view_issue(issue_id)
    and org_id = (select i.org_id from public.issues i where i.id = issue_id)
    and (not internal or private.is_manager(org_id))
  );

create policy media_select on public.issue_media for select to authenticated
  using (private.can_view_issue(issue_id));
create policy media_insert on public.issue_media for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and private.can_view_issue(issue_id)
    and org_id = (select i.org_id from public.issues i where i.id = issue_id)
    and (
      kind <> 'after'
      or private.is_manager(org_id)
      or exists (select 1 from public.issues i where i.id = issue_id and i.assignee_id = (select auth.uid()))
    )
  );

create policy followers_select on public.issue_followers for select to authenticated
  using (private.can_view_issue(issue_id));
create policy followers_insert on public.issue_followers for insert to authenticated
  with check (profile_id = (select auth.uid()) and private.can_view_issue(issue_id));
create policy followers_delete on public.issue_followers for delete to authenticated
  using (profile_id = (select auth.uid()));

create policy notices_select on public.notices for select to authenticated
  using (private.is_org_member(org_id) and published_at <= now() or private.is_manager(org_id));
create policy notices_write on public.notices for all to authenticated
  using (private.is_manager(org_id)) with check (private.is_manager(org_id));

create policy notice_reads_own on public.notice_reads for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (
    profile_id = (select auth.uid())
    and exists (select 1 from public.notices n where n.id = notice_id and private.is_org_member(n.org_id))
  );

revoke update, delete on public.issue_events from authenticated;
revoke update, delete on public.issue_media from authenticated;
revoke delete on public.issues from authenticated;
