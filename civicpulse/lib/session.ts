import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { MANAGER_ROLES, type MemberRole, type Membership, type Profile } from '@/lib/types'

export const ACTIVE_ORG_COOKIE = 'active_org'

// Everything a page needs to know about the signed-in user, fetched once per request.
export const getSession = cache(async () => {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, email, locale').eq('id', user.id).single(),
    supabase
      .from('memberships')
      .select('id, org_id, role, status, title, orgs(id, name, slug, city, plan, status, is_demo, settings)')
      .eq('profile_id', user.id)
      .neq('status', 'revoked')
      .order('created_at'),
  ])

  return {
    supabase,
    user,
    profile: profile as Profile | null,
    memberships: (memberships ?? []) as unknown as Membership[],
  }
})

// The society the user is currently working in, plus their roles there.
export const getActiveOrg = cache(async () => {
  const session = await getSession()
  if (!session) return null
  const active = session.memberships.filter((m) => m.status === 'active' && m.orgs)
  if (active.length === 0) return { ...session, org: null, roles: [] as MemberRole[], isManager: false, pending: session.memberships.some((m) => m.status === 'pending') }

  const preferred = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value
  const org = (active.find((m) => m.org_id === preferred) ?? active[0]).orgs
  const roles = active.filter((m) => m.org_id === org.id).map((m) => m.role)
  return {
    ...session,
    org,
    roles,
    isManager: roles.some((r) => MANAGER_ROLES.includes(r)),
    pending: false,
  }
})

export async function requireMember() {
  if (!isSupabaseConfigured()) redirect('/setup')
  const ctx = await getActiveOrg()
  if (!ctx) redirect('/login')
  if (!ctx.org) redirect('/onboarding')
  return { ...ctx, org: ctx.org }
}

export async function requireManager() {
  const ctx = await requireMember()
  if (!ctx.isManager) redirect('/app')
  return ctx
}
