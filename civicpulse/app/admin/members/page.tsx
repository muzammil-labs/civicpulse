import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { requireManager } from '@/lib/session'
import { formatDate } from '@/lib/format'
import { InviteCode, NewInvite, ReviewButtons, RevokeButton } from './buttons'

export const metadata: Metadata = { title: 'Members' }

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Admin',
  committee: 'Committee',
  finance: 'Finance',
  facility_manager: 'Facility manager',
  staff: 'Staff',
  vendor: 'Vendor',
  guard: 'Guard',
  resident_owner: 'Owner',
  resident_tenant: 'Tenant',
}

type MemberRow = {
  id: string
  role: string
  status: string
  title: string | null
  created_at: string
  profile_id: string
  profiles: { full_name: string | null; phone: string | null; email: string | null } | null
}

export default async function MembersPage() {
  const { supabase, org, user } = await requireManager()
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`

  const [{ data: members }, { data: occupancies }, { data: invites }] = await Promise.all([
    supabase.from('memberships').select('id, role, status, title, created_at, profile_id, profiles!memberships_profile_id_fkey(full_name, phone, email)')
      .eq('org_id', org.id).neq('status', 'revoked').order('created_at', { ascending: false }),
    supabase.from('unit_occupancies').select('profile_id, relation, status, units(number, blocks(name))').eq('org_id', org.id).neq('status', 'revoked'),
    supabase.from('org_invites').select('id, code, role, auto_approve, uses, max_uses, expires_at').eq('org_id', org.id).order('created_at', { ascending: false }),
  ])

  const rows = (members ?? []) as unknown as MemberRow[]
  const flats = new Map<string, string[]>()
  for (const o of (occupancies ?? []) as unknown as { profile_id: string; units: { number: string; blocks: { name: string } | null } | null }[]) {
    if (!o.units) continue
    flats.set(o.profile_id, [...(flats.get(o.profile_id) ?? []), o.units.number])
  }
  const pending = rows.filter((m) => m.status === 'pending')
  const active = rows.filter((m) => m.status === 'active')

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Members</h1>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">Waiting for approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">No one is waiting.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {pending.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{m.profiles?.full_name ?? 'New member'} <span className="text-sm font-normal text-subtle">· {ROLE_LABELS[m.role]}</span></p>
                  <p className="text-sm text-subtle">
                    Flat {flats.get(m.profile_id)?.join(', ') ?? 'not given'} · {m.profiles?.phone ?? m.profiles?.email} · asked {formatDate(m.created_at)}
                  </p>
                </div>
                <ReviewButtons membershipId={m.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">Invite codes</h2>
        <p className="mt-1 text-sm text-subtle">Share a code or link in your society group, or print it on a QR poster. New members claim their flat and you approve them.</p>
        <ul className="mt-4 space-y-3">
          {(invites ?? []).map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5">
              <div className="text-sm">
                <span className="font-medium">{ROLE_LABELS[i.role]}</span>
                <span className="text-subtle"> · used {i.uses}{i.max_uses ? `/${i.max_uses}` : ''}{i.auto_approve ? ' · auto-approve' : ''}{i.expires_at ? ` · expires ${formatDate(i.expires_at)}` : ''}</span>
              </div>
              <InviteCode id={i.id} code={i.code} link={`${origin}/onboarding?code=${i.code}`} />
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-line pt-4"><NewInvite /></div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">Active members ({active.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-subtle">
              <tr><th className="py-2 pr-4 font-medium">Name</th><th className="py-2 pr-4 font-medium">Role</th><th className="py-2 pr-4 font-medium">Flat</th><th className="py-2 pr-4 font-medium">Contact</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {active.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 pr-4 font-medium">{m.profiles?.full_name ?? '—'}</td>
                  <td className="py-2.5 pr-4">{m.title ?? ROLE_LABELS[m.role]}</td>
                  <td className="py-2.5 pr-4 text-subtle">{flats.get(m.profile_id)?.join(', ') ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-subtle">{m.profiles?.phone ?? m.profiles?.email ?? '—'}</td>
                  <td className="py-2.5 text-right">{m.profile_id !== user.id && <RevokeButton membershipId={m.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
