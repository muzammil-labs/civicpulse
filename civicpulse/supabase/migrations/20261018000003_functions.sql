-- API functions (RPC) for flows that span several tables or need elevated checks.
-- Each one validates the caller itself before doing anything.

-- Default issue categories, labelled in English, Telugu and Hindi.
create or replace function private.seed_default_categories(p_org uuid)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.issue_categories (org_id, key, label, icon, default_sla_hours, sort)
  values
    (p_org, 'lift',         '{"en":"Lift / Elevator","te":"లిఫ్ట్","hi":"लिफ्ट"}',                                   '🛗', 4,   10),
    (p_org, 'water_supply', '{"en":"Water supply","te":"నీటి సరఫరా","hi":"पानी की आपूर्ति"}',                          '💧', 8,   20),
    (p_org, 'plumbing',     '{"en":"Plumbing / Leak","te":"ప్లంబింగ్ / లీక్","hi":"प्लंबिंग / रिसाव"}',               '🚰', 24,  30),
    (p_org, 'electrical',   '{"en":"Electrical / Lights","te":"విద్యుత్ / లైట్లు","hi":"बिजली / लाइट"}',              '💡', 24,  40),
    (p_org, 'security',     '{"en":"Security / Gate","te":"భద్రత / గేట్","hi":"सुरक्षा / गेट"}',                      '🛡️', 4,   50),
    (p_org, 'housekeeping', '{"en":"Housekeeping / Garbage","te":"హౌస్‌కీపింగ్ / చెత్త","hi":"सफ़ाई / कचरा"}',         '🧹', 24,  60),
    (p_org, 'parking',      '{"en":"Parking","te":"పార్కింగ్","hi":"पार्किंग"}',                                      '🚗', 48,  70),
    (p_org, 'common_area',  '{"en":"Common area / Amenities","te":"సాధారణ ప్రాంతం / సౌకర్యాలు","hi":"सामान्य क्षेत्र / सुविधाएँ"}', '🏊', 72, 80),
    (p_org, 'pest_control', '{"en":"Pest control","te":"పెస్ట్ కంట్రోల్","hi":"कीट नियंत्रण"}',                         '🐜', 72,  90),
    (p_org, 'civil',        '{"en":"Civil / Seepage / Cracks","te":"సివిల్ / లీకేజీ / పగుళ్లు","hi":"सिविल / सीलन / दरारें"}', '🧱', 120, 100),
    (p_org, 'noise',        '{"en":"Noise / Neighbours","te":"శబ్దం / పొరుగువారు","hi":"शोर / पड़ोसी"}',              '🔊', 48,  110),
    (p_org, 'other',        '{"en":"Other","te":"ఇతర","hi":"अन्य"}',                                                 '📌', 72,  999)
  on conflict (org_id, key) do nothing;
$$;

-- A signed-in user creates a new society and becomes its first admin.
create or replace function public.create_society(
  p_name text,
  p_city text default 'Hyderabad',
  p_blocks text[] default '{}'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_slug text;
  v_block text;
  v_i integer := 0;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Society name is too short' using errcode = '22023';
  end if;
  if (select count(*) from public.memberships m
      where m.profile_id = v_uid and m.role = 'org_admin') >= 5 then
    raise exception 'You already administer the maximum number of societies' using errcode = '54000';
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g')));
  v_slug := left(coalesce(nullif(v_slug, ''), 'society'), 60) || '-'
            || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.orgs (name, slug, city, created_by)
  values (trim(p_name), v_slug, coalesce(nullif(trim(p_city), ''), 'Hyderabad'), v_uid)
  returning id into v_org;

  insert into public.memberships (org_id, profile_id, role, status, approved_by)
  values (v_org, v_uid, 'org_admin', 'active', v_uid);

  foreach v_block in array coalesce(p_blocks, '{}') loop
    if char_length(trim(v_block)) > 0 then
      v_i := v_i + 1;
      insert into public.blocks (org_id, name, sort) values (v_org, trim(v_block), v_i)
      on conflict do nothing;
    end if;
  end loop;

  perform private.seed_default_categories(v_org);

  insert into public.org_invites (org_id, role, created_by) values (v_org, 'resident_owner', v_uid);

  return v_org;
end;
$$;

-- A resident joins with an invite code and claims their flat. The committee approves
-- unless the invite was created with auto_approve (e.g. after a CSV import).
create or replace function public.join_society(
  p_code text,
  p_block text default null,
  p_unit text default null,
  p_relation public.occupancy_relation default 'owner'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.org_invites;
  v_unit uuid;
  v_status public.member_status;
  v_membership uuid;
  v_role public.member_role;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;

  select * into v_inv from public.org_invites
    where code = upper(trim(p_code))
    for update;
  if not found
     or (v_inv.expires_at is not null and v_inv.expires_at < now())
     or (v_inv.max_uses is not null and v_inv.uses >= v_inv.max_uses) then
    raise exception 'This invite code is not valid' using errcode = '22023';
  end if;

  if not exists (select 1 from public.orgs o where o.id = v_inv.org_id and o.status = 'active') then
    raise exception 'This society is not accepting new members' using errcode = '42501';
  end if;

  v_role := v_inv.role;
  if v_role in ('resident_owner', 'resident_tenant') then
    v_role := case when p_relation = 'tenant' then 'resident_tenant' else 'resident_owner' end;
  end if;

  if p_unit is not null and char_length(trim(p_unit)) > 0 then
    select u.id into v_unit
      from public.units u
      left join public.blocks b on b.id = u.block_id
      where u.org_id = v_inv.org_id
        and lower(u.number) = lower(trim(p_unit))
        and (p_block is null or trim(p_block) = '' or lower(b.name) = lower(trim(p_block)))
      limit 1;
    if v_unit is null then
      raise exception 'We could not find that flat. Check the tower and flat number.' using errcode = '22023';
    end if;
  end if;

  v_status := case when v_inv.auto_approve then 'active' else 'pending' end;

  insert into public.memberships (org_id, profile_id, role, status, invited_by)
  values (v_inv.org_id, v_uid, v_role, v_status, v_inv.created_by)
  on conflict (org_id, profile_id, role) do update
    set status = case when public.memberships.status = 'revoked' then excluded.status
                      else public.memberships.status end
  returning id into v_membership;

  if v_unit is not null then
    insert into public.unit_occupancies (org_id, unit_id, profile_id, relation, status)
    values (v_inv.org_id, v_unit, v_uid, p_relation, v_status)
    on conflict (unit_id, profile_id) where status <> 'revoked' do nothing;
  end if;

  update public.org_invites set uses = uses + 1 where id = v_inv.id;
  return v_membership;
end;
$$;

-- Committee approves or rejects a pending member (and their flat claim).
create or replace function public.review_member(p_membership uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_m public.memberships;
  v_new public.member_status := case when p_approve then 'active' else 'revoked' end;
begin
  select * into v_m from public.memberships where id = p_membership;
  if not found or not private.is_manager(v_m.org_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  -- Only org admins may grant committee-level roles.
  if v_m.role in ('org_admin', 'committee', 'finance', 'facility_manager')
     and not private.is_org_admin(v_m.org_id) then
    raise exception 'Only a society admin can approve committee roles' using errcode = '42501';
  end if;

  update public.memberships
    set status = v_new, approved_by = auth.uid()
    where id = p_membership;
  update public.unit_occupancies
    set status = v_new
    where org_id = v_m.org_id and profile_id = v_m.profile_id and status = 'pending';
end;
$$;

-- Merge a duplicate into the original: followers move over and the duplicate closes.
create or replace function public.merge_issue(p_duplicate uuid, p_into uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_dup public.issues;
  v_target public.issues;
begin
  select * into v_dup from public.issues where id = p_duplicate for update;
  select * into v_target from public.issues where id = p_into;
  if v_dup.id is null or v_target.id is null or v_dup.org_id <> v_target.org_id
     or v_dup.id = v_target.id then
    raise exception 'Both issues must exist in the same society' using errcode = '22023';
  end if;
  if not private.is_manager(v_dup.org_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if v_target.duplicate_of is not null then
    raise exception 'Merge into the original issue, not another duplicate' using errcode = '22023';
  end if;

  insert into public.issue_followers (issue_id, profile_id)
    select p_into, f.profile_id from public.issue_followers f where f.issue_id = p_duplicate
    on conflict do nothing;

  update public.issues
    set duplicate_of = p_into,
        status = 'closed',
        resolution_note = 'Merged into #' || v_target.ref_no
    where id = p_duplicate;

  insert into public.issue_events (issue_id, org_id, actor_id, type, payload)
  values
    (p_duplicate, v_dup.org_id, auth.uid(), 'merged', jsonb_build_object('into', p_into, 'into_ref', v_target.ref_no)),
    (p_into, v_dup.org_id, auth.uid(), 'merged', jsonb_build_object('from', p_duplicate, 'from_ref', v_dup.ref_no));
end;
$$;

-- Open issues that look like the one being reported: same category, same tower,
-- recent, or a similar title. Runs with the caller's permissions.
create or replace function public.find_similar_issues(
  p_org uuid,
  p_category uuid default null,
  p_block uuid default null,
  p_text text default null
)
returns table (
  id uuid, ref_no integer, title text, status public.issue_status,
  created_at timestamptz, followers bigint, score real
)
language sql stable security invoker set search_path = ''
as $$
  select i.id, i.ref_no, i.title, i.status, i.created_at,
         (select count(*) from public.issue_followers f where f.issue_id = i.id) as followers,
         (case when p_category is not null and i.category_id = p_category then 0.4 else 0 end
          + case when p_block is not null and i.block_id = p_block then 0.2 else 0 end
          + case when p_text is not null then private.text_similarity(i.title, p_text) * 0.6 else 0 end
         )::real as score
  from public.issues i
  where i.org_id = p_org
    and i.status in ('open', 'assigned', 'in_progress', 'on_hold')
    and i.visibility = 'community'
    and i.duplicate_of is null
    and i.created_at > now() - interval '14 days'
    and (
      (p_category is not null and i.category_id = p_category
        and (p_block is null or i.block_id is null or i.block_id = p_block))
      or (p_text is not null and private.text_similarity(i.title, p_text) > 0.3)
    )
  order by score desc, i.created_at desc
  limit 5;
$$;

-- Dashboard numbers for the committee. Runs with the caller's permissions.
create or replace function public.issue_stats(p_org uuid)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'open', count(*) filter (where status in ('open', 'assigned', 'in_progress', 'on_hold')),
    'unassigned', count(*) filter (where status = 'open'),
    'overdue', count(*) filter (where status in ('open', 'assigned', 'in_progress', 'on_hold')
                                  and sla_due_at < now()),
    'resolved_30d', count(*) filter (where resolved_at > now() - interval '30 days'),
    'within_sla_30d', count(*) filter (where resolved_at > now() - interval '30 days'
                                         and resolved_at <= sla_due_at),
    'median_hours_30d', round(coalesce((
      percentile_cont(0.5) within group (
        order by extract(epoch from (resolved_at - created_at)) / 3600
      ) filter (where resolved_at > now() - interval '30 days')
    )::numeric, 0), 1),
    'avg_rating', round(avg(rating)::numeric, 2)
  )
  from public.issues
  where org_id = p_org and duplicate_of is null;
$$;

-- Lock function execution down: only signed-in users may call the API functions.
revoke execute on function public.create_society(text, text, text[]) from public, anon;
revoke execute on function public.join_society(text, text, text, public.occupancy_relation) from public, anon;
revoke execute on function public.review_member(uuid, boolean) from public, anon;
revoke execute on function public.merge_issue(uuid, uuid) from public, anon;
revoke execute on function public.find_similar_issues(uuid, uuid, uuid, text) from public, anon;
revoke execute on function public.issue_stats(uuid) from public, anon;
grant execute on function public.create_society(text, text, text[]) to authenticated;
grant execute on function public.join_society(text, text, text, public.occupancy_relation) to authenticated;
grant execute on function public.review_member(uuid, boolean) to authenticated;
grant execute on function public.merge_issue(uuid, uuid) to authenticated;
grant execute on function public.find_similar_issues(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.issue_stats(uuid) to authenticated;
revoke execute on function private.seed_default_categories(uuid) from public, anon, authenticated;
