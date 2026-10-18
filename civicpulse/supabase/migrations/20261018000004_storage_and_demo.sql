-- Photo storage (Supabase Storage) and the self-resetting demo society.

-- ───────────────────────────── Storage ─────────────────────────────
-- Objects live at issue-media/{org_id}/{issue_id}/{file}. The bucket is private;
-- the app serves photos through short-lived signed URLs.
-- Guarded so the migration also runs on plain Postgres in CI, which has no storage schema.
do $migration$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('issue-media', 'issue-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$
      create policy issue_media_read on storage.objects for select to authenticated
      using (
        bucket_id = 'issue-media'
        and private.can_view_issue(((storage.foldername(name))[2])::uuid)
      )
    $p$;

    execute $p$
      create policy issue_media_upload on storage.objects for insert to authenticated
      with check (
        bucket_id = 'issue-media'
        and private.can_view_issue(((storage.foldername(name))[2])::uuid)
        and exists (
          select 1 from public.issues i
          where i.id = ((storage.foldername(name))[2])::uuid
            and i.org_id = ((storage.foldername(name))[1])::uuid
        )
      )
    $p$;
  end if;
end;
$migration$;

-- ───────────────────────────── Demo society ─────────────────────────────
-- Rebuilds "Sunrise Enclave (Demo)" from scratch. Run nightly so every demo starts clean.
-- Requires three demo users to exist in auth.users (created by scripts/create-demo-users.mjs).

create or replace function public.reset_demo()
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_org constant uuid := '00000000-0000-4000-8000-000000000001';
  v_resident uuid;
  v_committee uuid;
  v_staff uuid;
  v_block record;
  v_cat jsonb := '{}'::jsonb;
  v_issue uuid;
  v_seed record;
begin
  select id into v_resident from auth.users where email = 'demo-resident@example.com';
  select id into v_committee from auth.users where email = 'demo-committee@example.com';
  select id into v_staff from auth.users where email = 'demo-staff@example.com';
  if v_resident is null or v_committee is null or v_staff is null then
    raise exception 'Demo users are missing. Run scripts/create-demo-users.mjs first.';
  end if;

  delete from public.orgs where id = v_org;
  delete from public.audit_log where org_id = v_org;

  update public.profiles set full_name = 'Priya Sharma (demo)', locale = 'en' where id = v_resident;
  update public.profiles set full_name = 'Ravi Kumar (demo)', locale = 'en' where id = v_committee;
  update public.profiles set full_name = 'Suresh (demo electrician)', locale = 'te' where id = v_staff;

  insert into public.orgs (id, name, slug, city, address, plan, is_demo, created_by)
  values (v_org, 'Sunrise Enclave (Demo)', 'sunrise-enclave-demo', 'Hyderabad',
          'Demo address, Gachibowli, Hyderabad', 'finance', true, v_committee);

  insert into public.blocks (org_id, name, sort)
  values (v_org, 'Tower A', 1), (v_org, 'Tower B', 2), (v_org, 'Tower C', 3);

  -- 3 towers × 10 floors × 8 flats = 240 units
  for v_block in select id, right(name, 1) as letter from public.blocks where org_id = v_org loop
    insert into public.units (org_id, block_id, number, floor, area_sqft, unit_type)
    select v_org, v_block.id, v_block.letter || '-' || f || lpad(n::text, 2, '0'), f,
           case when n in (1, 8) then 1850 else 1420 end,
           case when n in (1, 8) then '3BHK' else '2BHK' end
    from generate_series(1, 10) f, generate_series(1, 8) n;
  end loop;

  insert into public.memberships (org_id, profile_id, role, status, title, approved_by) values
    (v_org, v_committee, 'org_admin', 'active', 'Secretary', v_committee),
    (v_org, v_resident, 'resident_owner', 'active', null, v_committee),
    (v_org, v_staff, 'staff', 'active', 'Electrician', v_committee);

  insert into public.unit_occupancies (org_id, unit_id, profile_id, relation, status)
  select v_org, u.id, v_resident, 'owner', 'active'
  from public.units u where u.org_id = v_org and u.number = 'B-405';

  perform private.seed_default_categories(v_org);
  select jsonb_object_agg(key, id) into v_cat from public.issue_categories where org_id = v_org;

  insert into public.org_invites (org_id, code, role, created_by)
  values (v_org, 'DEMO2026', 'resident_owner', v_committee);

  for v_seed in
    select * from (values
      ('lift', 'Tower B', 'Lift stuck between 4th and 5th floor again', 'Second time this week. Kids were inside for 10 minutes before security opened it.', 'critical', 'in_progress', 2, true),
      ('water_supply', 'Tower A', 'No water on floors 8–10 since morning', 'Overhead tank seems empty. Pump room door is locked.', 'high', 'assigned', 5, false),
      ('electrical', 'Tower C', 'Corridor lights flickering on 6th floor', 'Lights near C-605 to C-608 flicker all night.', 'medium', 'resolved', 50, true),
      ('housekeeping', null, 'Garbage not cleared near visitor parking', 'Bins overflowing since yesterday, smell reaching the play area.', 'medium', 'open', 20, false),
      ('plumbing', 'Tower B', 'Water seepage in B-405 bathroom ceiling', 'Leak from the flat above, ceiling paint peeling.', 'high', 'on_hold', 70, false),
      ('security', null, 'Gate 2 boom barrier not closing', 'Barrier stays up, any vehicle can enter without stopping.', 'high', 'resolved', 96, true),
      ('common_area', null, 'Swimming pool water is cloudy', 'Pool water looks green-ish near the deep end.', 'medium', 'open', 30, false),
      ('pest_control', 'Tower A', 'Cockroaches in Tower A basement lobby', 'Seen near the lift lobby and the electrical room.', 'low', 'assigned', 26, false),
      ('parking', null, 'Car parked in my allotted slot B-405', 'White hatchback has been in my slot for 3 days.', 'low', 'closed', 140, false),
      ('electrical', null, 'Streetlight near clubhouse not working', 'The pole next to the clubhouse entrance is dark.', 'medium', 'resolved', 200, true),
      ('noise', 'Tower C', 'Construction noise after 9 pm in C-1002', 'Interior work continuing late at night.', 'low', 'rejected', 120, false),
      ('civil', 'Tower A', 'Crack in Tower A parking ramp', 'Visible crack about 1 m long on the ramp to B1.', 'medium', 'open', 4, false)
    ) as t(cat, block_name, title, description, urgency, final_status, hours_ago, by_resident)
  loop
    insert into public.issues (org_id, category_id, block_id, title, description, urgency, created_by, created_at, ai_meta)
    values (
      v_org,
      (v_cat ->> v_seed.cat)::uuid,
      (select b.id from public.blocks b where b.org_id = v_org and b.name = v_seed.block_name),
      v_seed.title, v_seed.description, v_seed.urgency::public.issue_urgency,
      case when v_seed.by_resident then v_resident else v_committee end,
      now() - make_interval(hours => v_seed.hours_ago),
      jsonb_build_object('source', 'demo-seed')
    )
    returning id into v_issue;

    if v_seed.final_status <> 'open' then
      update public.issues set
        assignee_id = case when v_seed.final_status <> 'rejected' then v_staff end,
        status = v_seed.final_status::public.issue_status,
        resolution_note = case v_seed.final_status
          when 'resolved' then 'Fixed and checked with the resident.'
          when 'closed' then 'Owner of the vehicle contacted; slot cleared.'
          when 'rejected' then 'Within permitted hours per society rules; resident informed.'
        end,
        rating = case when v_seed.final_status in ('resolved', 'closed') then 4 + (v_seed.hours_ago % 2) end
      where id = v_issue;

      update public.issues set
        resolved_at = created_at + make_interval(hours => greatest(1, v_seed.hours_ago / 3)),
        closed_at = case when v_seed.final_status = 'closed' then created_at + make_interval(hours => v_seed.hours_ago / 2) end
      where id = v_issue and v_seed.final_status in ('resolved', 'closed');
    end if;

    -- Space the timeline out realistically instead of stamping everything "now".
    update public.issue_events e
      set created_at = least(now(), i.created_at + make_interval(hours => greatest(1, v_seed.hours_ago / 4)) * r.rn)
      from public.issues i,
           (select id, row_number() over (order by id) - 1 as rn from public.issue_events where issue_id = v_issue) r
      where e.issue_id = v_issue and i.id = v_issue and r.id = e.id;
  end loop;

  -- A couple of neighbours said "me too" on the lift issue.
  insert into public.issue_followers (issue_id, profile_id)
  select i.id, p.id from public.issues i, (values (v_committee), (v_staff)) p(id)
  where i.org_id = v_org and i.title like 'Lift stuck%'
  on conflict do nothing;

  insert into public.issue_events (issue_id, org_id, actor_id, type, body, created_at)
  select i.id, v_org, v_staff, 'comment', 'Technician from the lift AMC vendor arriving by 4 pm.', now() - interval '1 hour'
  from public.issues i where i.org_id = v_org and i.title like 'Lift stuck%';

  insert into public.notices (org_id, title, body, priority, published_at, created_by) values
    (v_org, 'Water supply shutdown on Sunday 7–11 am',
     'Overhead tanks of all towers will be cleaned on Sunday between 7 am and 11 am. Please store water on Saturday night.',
     'urgent', now() - interval '6 hours', v_committee),
    (v_org, 'Monthly committee meeting – Saturday 6 pm, clubhouse',
     'Agenda: lift AMC renewal, pool maintenance vendor, parking stickers. All residents are welcome.',
     'normal', now() - interval '2 days', v_committee),
    (v_org, 'Pest control schedule for Tower A',
     'Pest control for Tower A common areas is scheduled for Wednesday at 11 am.',
     'normal', now() - interval '5 days', v_committee);

  return v_org;
end;
$$;

revoke execute on function public.reset_demo() from public, anon, authenticated;
grant execute on function public.reset_demo() to service_role;

-- Nightly reset at 03:00 IST (21:30 UTC) where pg_cron is available (enable it in Supabase first).
do $migration$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('reset-demo-society', '30 21 * * *', 'select public.reset_demo()');
  end if;
end;
$migration$;
