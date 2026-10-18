-- Names to show next to issues and timeline entries. Residents cannot read other
-- people's profiles, so this returns only a short display name and role — never
-- phone numbers or emails.
create or replace function public.org_people(p_org uuid)
returns table (profile_id uuid, display_name text, role public.member_role, title text)
language sql stable security definer set search_path = ''
as $$
  select distinct on (m.profile_id)
    m.profile_id,
    case
      when private.is_manager(p_org) then coalesce(p.full_name, 'Member')
      when m.role in ('org_admin', 'committee', 'finance', 'facility_manager', 'staff', 'vendor', 'guard')
        then coalesce(split_part(p.full_name, ' ', 1), 'Staff')
      else coalesce(split_part(p.full_name, ' ', 1), 'Resident')
    end as display_name,
    m.role,
    m.title
  from public.memberships m
  join public.profiles p on p.id = m.profile_id
  where m.org_id = p_org
    and m.status = 'active'
    and (private.is_org_member(p_org) or private.is_platform_admin())
  order by m.profile_id,
    array_position(array['org_admin', 'committee', 'facility_manager', 'finance', 'staff', 'vendor', 'guard', 'resident_owner', 'resident_tenant']::public.member_role[], m.role);
$$;

revoke execute on function public.org_people(uuid) from public, anon;
grant execute on function public.org_people(uuid) to authenticated;
