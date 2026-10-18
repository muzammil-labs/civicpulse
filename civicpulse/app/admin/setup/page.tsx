import type { Metadata } from 'next'
import { requireManager } from '@/lib/session'
import { getBlocks, getPeople } from '@/lib/queries'
import type { Category } from '@/lib/types'
import { AfterPhotoToggle, BlocksForm, CategoryRow, UnitsImport } from './forms'

export const metadata: Metadata = { title: 'Setup' }

const ASSIGNABLE = new Set(['org_admin', 'committee', 'facility_manager', 'staff', 'vendor'])

export default async function SetupPage() {
  const { supabase, org } = await requireManager()
  const [blocks, people, { data: cats }, { count: unitCount }, { data: perBlock }] = await Promise.all([
    getBlocks(supabase, org.id),
    getPeople(supabase, org.id),
    supabase.from('issue_categories').select('id, key, label, icon, default_sla_hours, default_assignee_id, sort, active').eq('org_id', org.id).order('sort'),
    supabase.from('units').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
    supabase.from('units').select('block_id').eq('org_id', org.id).limit(10000),
  ])
  const counts = new Map<string, number>()
  for (const u of perBlock ?? []) counts.set(u.block_id ?? '', (counts.get(u.block_id ?? '') ?? 0) + 1)
  const assignees = [...people.values()].filter((p) => ASSIGNABLE.has(p.role)).map((p) => ({ id: p.profile_id, label: p.title ? `${p.display_name} (${p.title})` : p.display_name }))
  const categories = (cats ?? []) as (Category & { default_assignee_id: string | null })[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Society setup</h1>
        <p className="text-sm text-subtle">{org.name} · {org.city} · {unitCount ?? 0} flats</p>
      </div>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">1. Towers and blocks</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {blocks.length === 0 && <p className="text-sm text-subtle">No towers yet.</p>}
          {blocks.map((b) => (
            <span key={b.id} className="rounded-full bg-canvas px-3 py-1 text-sm ring-1 ring-line">{b.name} <span className="text-subtle">· {counts.get(b.id) ?? 0} flats</span></span>
          ))}
        </div>
        <div className="mt-4"><BlocksForm /></div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">2. Import flats</h2>
        <p className="mt-1 text-sm text-subtle">Residents pick their flat when they join, so the committee can confirm them quickly.</p>
        <div className="mt-3"><UnitsImport /></div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">3. Categories, deadlines and default assignees</h2>
        <p className="mt-1 text-sm text-subtle">Urgent issues get half the time, emergencies a quarter. Pick a default person to route new issues to them automatically.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-subtle"><tr><th className="py-2 pr-3 font-medium">Category</th><th className="py-2 pr-3 font-medium">Target time</th><th className="py-2 pr-3 font-medium">Goes to</th><th className="py-2 font-medium">Shown</th></tr></thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => <CategoryRow key={c.id} category={c} assignees={assignees} />)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">4. Rules</h2>
        <div className="mt-3"><AfterPhotoToggle value={org.settings?.require_after_photo !== false} /></div>
      </section>
    </div>
  )
}
