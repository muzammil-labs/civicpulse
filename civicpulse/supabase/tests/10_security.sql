-- Security and workflow tests. Each block raises an exception on failure.
-- Users act through the `authenticated` role with a JWT `sub` claim, exactly as
-- requests from the app do.

-- Fixed test identities
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'demo-resident@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'demo-committee@example.com'),
  ('33333333-3333-4333-8333-333333333333', 'demo-staff@example.com'),
  ('44444444-4444-4444-8444-444444444444', 'outsider@example.com'),
  ('55555555-5555-4555-8555-555555555555', 'newcomer@example.com'),
  ('66666666-6666-4666-8666-666666666666', 'neighbour@example.com');

create schema tests;
create function tests.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, false);
  set role authenticated;
end $$;
create function tests.logout() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;
grant usage on schema tests to authenticated, anon;
grant execute on all functions in schema tests to authenticated, anon;

create function tests.expect_error(p_sql text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    -- A typo in the test itself must not count as the expected refusal.
    if sqlstate in ('42601', '42703', '42P01', '42883', '42804') then
      raise exception 'FAIL: test is broken (%: %): %', sqlstate, sqlerrm, p_label;
    end if;
    raise notice 'ok - % (refused: %)', p_label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: expected an error: %', p_label;
end $$;
grant execute on function tests.expect_error(text, text) to authenticated, anon;

create function tests.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if p_ok is not true then
    raise exception 'FAIL: %', p_label;
  end if;
  raise notice 'ok - %', p_label;
end $$;
grant execute on function tests.check(boolean, text) to authenticated, anon;

\set ON_ERROR_STOP 1
\o /dev/null
set client_min_messages = notice;

-- ── Demo seed ──────────────────────────────────────────────
select public.reset_demo();
select tests.check((select count(*) from public.units where org_id = '00000000-0000-4000-8000-000000000001') = 240, 'demo has 240 units');
select tests.check((select count(*) from public.issues where org_id = '00000000-0000-4000-8000-000000000001') = 12, 'demo has 12 issues');
select public.reset_demo();
select tests.check((select count(*) from public.issues where org_id = '00000000-0000-4000-8000-000000000001') = 12, 'demo reset is repeatable');

-- ── Anonymous visitors ─────────────────────────────────────
set role anon;
select tests.check((select count(*) from public.issues) = 0, 'anon sees no issues');
select tests.check((select count(*) from public.orgs) = 0, 'anon sees no societies');
insert into public.demo_requests (name, community, homes, email) values ('Test', 'Test Towers', '51-300', 't@example.com');
select tests.check(true, 'anon can request a demo');
select tests.expect_error($$select public.create_society('Hack')$$, 'anon cannot create a society');
reset role;

-- ── Resident of the demo society ───────────────────────────
select tests.login('11111111-1111-4111-8111-111111111111');
select tests.check((select count(*) from public.orgs) = 1, 'resident sees only their society');
select tests.check((select count(*) from public.issues) = 12, 'resident sees community issues');
select tests.check((select count(*) from public.audit_log) = 0, 'resident cannot read the audit log');
select tests.check((select count(*) from public.profiles) = 1, 'resident sees only their own profile');
select tests.check((select count(*) from public.memberships) = 1, 'resident sees only their own membership');

insert into public.issues (org_id, category_id, title, description, urgency)
select '00000000-0000-4000-8000-000000000001', id, 'Lift making grinding noise in Tower B', 'Loud noise between floors 3 and 4', 'high'
from public.issue_categories where key = 'lift';
select tests.check(
  (select ref_no = 13 and status = 'open' and sla_due_at is not null from public.issues where title like 'Lift making grinding%'),
  'new issue gets #13, open status and an SLA deadline');
select tests.check(
  (select count(*) = 1 from public.issue_events e join public.issues i on i.id = e.issue_id
   where i.title like 'Lift making grinding%' and e.type = 'created'),
  'creation is recorded in the timeline');
select tests.check(
  (select count(*) = 1 from public.issue_followers f join public.issues i on i.id = f.issue_id
   where i.title like 'Lift making grinding%'),
  'reporter automatically follows their issue');

select tests.expect_error(
  $$update public.issues set urgency = 'critical' where title like 'Lift making grinding%'$$,
  'resident cannot change urgency');
select tests.expect_error(
  $$update public.issues set status = 'resolved' where title like 'Lift making grinding%'$$,
  'resident cannot resolve an issue');
select tests.expect_error(
  $$insert into public.issues (org_id, title, created_by) values ('00000000-0000-4000-8000-000000000001', 'Spoofed reporter', '22222222-2222-4222-8222-222222222222')$$,
  'resident cannot file an issue as someone else');
select tests.expect_error(
  $$insert into public.issue_events (issue_id, org_id, actor_id, type, body, internal)
    select id, org_id, '11111111-1111-4111-8111-111111111111', 'comment', 'sneaky', true from public.issues limit 1$$,
  'resident cannot post internal notes');
select tests.expect_error(
  $$insert into public.issue_events (issue_id, org_id, actor_id, type)
    select id, org_id, '11111111-1111-4111-8111-111111111111', 'status_changed' from public.issues limit 1$$,
  'resident cannot forge timeline events');
select tests.expect_error(
  $$insert into public.audit_log (action, target_type) values ('x', 'y')$$,
  'resident cannot write the audit log');
select tests.expect_error(
  $$select public.merge_issue((select id from public.issues where ref_no = 13), (select id from public.issues where ref_no = 1))$$,
  'resident cannot merge issues');

update public.orgs set name = 'Hijacked' where id = '00000000-0000-4000-8000-000000000001';
select tests.check((select name from public.orgs) = 'Sunrise Enclave (Demo)', 'resident cannot rename the society');

insert into public.issue_events (issue_id, org_id, actor_id, type, body)
select id, org_id, '11111111-1111-4111-8111-111111111111', 'comment', 'Still happening tonight'
from public.issues where title like 'Lift making grinding%';
select tests.check(true, 'resident can comment on a visible issue');

insert into public.issues (org_id, title, description, visibility)
values ('00000000-0000-4000-8000-000000000001', 'Private: dispute with neighbour', 'Only the committee should see this', 'private');
select tests.check(
  (select array_agg(i.title) && array['Lift stuck between 4th and 5th floor again']
   from public.find_similar_issues('00000000-0000-4000-8000-000000000001', null, null, 'Lift stuck on 4th floor') i),
  'similar open issues are suggested');
select tests.check((public.issue_stats('00000000-0000-4000-8000-000000000001') ? 'overdue'), 'issue stats are available');
select tests.logout();

-- ── Committee ──────────────────────────────────────────────
select tests.login('22222222-2222-4222-8222-222222222222');
select tests.check((select count(*) from public.issues where visibility = 'private') = 1, 'committee sees private issues');
select tests.check((select count(*) from public.profiles) >= 3, 'committee sees member profiles');
select tests.check((select count(*) from public.audit_log) > 0, 'society admin can read the audit log');

update public.issues set assignee_id = '33333333-3333-4333-8333-333333333333' where ref_no = 13;
select tests.check((select status = 'assigned' from public.issues where ref_no = 13), 'assigning moves the issue to assigned');
select tests.check(
  (select count(*) = 1 from public.issue_events e join public.issues i on i.id = e.issue_id
   where i.ref_no = 13 and e.type = 'assigned'),
  'assignment is recorded in the timeline');

insert into public.issue_events (issue_id, org_id, actor_id, type, body, internal)
select id, org_id, '22222222-2222-4222-8222-222222222222', 'comment', 'Vendor quote is ₹18,000', true
from public.issues where ref_no = 13;
select tests.check(true, 'committee can post an internal note');

insert into public.notices (org_id, title, body) values
  ('00000000-0000-4000-8000-000000000001', 'Test notice', 'Hello residents');
select tests.check(true, 'committee can publish a notice');
select tests.logout();

-- ── Staff (assignee) ───────────────────────────────────────
select tests.login('33333333-3333-4333-8333-333333333333');
select tests.check((select count(*) from public.issues where visibility = 'private') = 0, 'staff do not see private issues');
update public.issues set status = 'in_progress' where ref_no = 13;
select tests.check((select status = 'in_progress' from public.issues where ref_no = 13), 'assignee can start work');
select tests.expect_error(
  $$update public.issues set status = 'resolved' where ref_no = 13$$,
  'cannot resolve without an after photo');
select tests.expect_error(
  $$update public.issues set urgency = 'low' where ref_no = 13$$,
  'assignee cannot change urgency');
select tests.expect_error(
  $$update public.issues set status = 'closed' where ref_no = 13$$,
  'assignee cannot close an issue');
insert into public.issue_media (issue_id, org_id, kind, storage_path, mime, size_bytes)
select id, org_id, 'after', org_id || '/' || id || '/after.jpg', 'image/jpeg', 120000
from public.issues where ref_no = 13;
update public.issues set status = 'resolved', resolution_note = 'Rollers greased' where ref_no = 13;
select tests.check((select status = 'resolved' and resolved_at is not null from public.issues where ref_no = 13),
  'assignee can resolve once an after photo exists');
select tests.logout();

-- ── Resident follows up ────────────────────────────────────
select tests.login('11111111-1111-4111-8111-111111111111');
select tests.check(
  (select count(*) = 0 from public.issue_events e join public.issues i on i.id = e.issue_id
   where i.ref_no = 13 and e.internal),
  'resident cannot see internal notes');
update public.issues set rating = 5, rating_comment = 'Quick fix' where ref_no = 13;
select tests.check((select rating = 5 from public.issues where ref_no = 13), 'resident can rate a resolved issue');
update public.issues set status = 'open' where ref_no = 13;
select tests.check((select status = 'open' and resolved_at is null from public.issues where ref_no = 13),
  'resident can reopen a recently resolved issue');
select tests.logout();

-- ── Outsider creates their own society ─────────────────────
select tests.login('44444444-4444-4444-8444-444444444444');
select tests.check((select count(*) from public.issues) = 0, 'outsider sees no issues');
select public.create_society('Lakeview Residency', 'Hyderabad', array['Block 1', 'Block 2']);
select tests.check((select count(*) from public.orgs) = 1, 'creator sees only their new society');
select tests.check((select count(*) from public.issue_categories) = 12, 'new society gets default categories');
select tests.check((select count(*) from public.org_invites) = 1, 'new society gets a resident invite code');
select tests.check((select count(*) from public.issues) = 0, 'other society admin still sees no demo issues');
select tests.expect_error(
  $$insert into public.issues (org_id, title) values ('00000000-0000-4000-8000-000000000001', 'Cross-tenant write')$$,
  'cannot file issues in another society');
select tests.expect_error(
  $$insert into public.blocks (org_id, name) values ('00000000-0000-4000-8000-000000000001', 'Tower Z')$$,
  'cannot add blocks to another society');
select tests.logout();

-- ── Newcomer joins with an invite code ─────────────────────
select tests.login('55555555-5555-4555-8555-555555555555');
select tests.expect_error($$select public.join_society('NOPE1234', 'Tower B', 'B-101')$$, 'invalid invite code is rejected');
select tests.expect_error($$select public.join_society('DEMO2026', 'Tower B', 'B-9999')$$, 'unknown flat is rejected');
select public.join_society('demo2026', 'Tower B', 'B-101', 'tenant');
select tests.check((select status = 'pending' and role = 'resident_tenant' from public.memberships), 'join creates a pending tenant membership');
select tests.check((select count(*) from public.issues) = 0, 'pending members cannot see issues yet');
select tests.logout();

select tests.login('22222222-2222-4222-8222-222222222222');
select public.review_member(
  (select id from public.memberships where profile_id = '55555555-5555-4555-8555-555555555555'), true);
select tests.logout();

select tests.login('55555555-5555-4555-8555-555555555555');
select tests.check((select count(*) from public.issues) = 13, 'approved member sees community issues (not private ones)');
select tests.check((select status = 'active' from public.unit_occupancies), 'flat claim is approved too');
select tests.logout();

-- ── Merge duplicates ───────────────────────────────────────
select tests.login('22222222-2222-4222-8222-222222222222');
select public.merge_issue(
  (select id from public.issues where ref_no = 13),
  (select id from public.issues where title = 'Lift stuck between 4th and 5th floor again'));
select tests.check(
  (select status = 'closed' and duplicate_of is not null from public.issues where ref_no = 13),
  'merged duplicate is closed and linked');
select tests.check(
  (select count(*) from public.issue_followers f join public.issues i on i.id = f.issue_id
   where i.title = 'Lift stuck between 4th and 5th floor again') >= 3,
  'followers move to the original issue');
select tests.logout();

-- ── A different society's committee cannot act on the demo ─
select set_config('tests.demo_membership',
  (select id::text from public.memberships where profile_id = '11111111-1111-4111-8111-111111111111'), false);
select tests.login('44444444-4444-4444-8444-444444444444');
select tests.expect_error(
  $$select public.review_member(current_setting('tests.demo_membership')::uuid, false)$$,
  'cannot approve or revoke members of another society');
update public.issues set status = 'closed' where org_id = '00000000-0000-4000-8000-000000000001';
select tests.logout();
select tests.check(
  (select count(*) = 0 from public.issues
   where org_id = '00000000-0000-4000-8000-000000000001' and status = 'closed' and duplicate_of is null
     and title not like 'Car parked%'),
  'another society cannot close demo issues');
