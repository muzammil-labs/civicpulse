import type { Metadata } from 'next'
import Link from 'next/link'
import { requireManager } from '@/lib/session'
import { getBlocks, getCategories, getPeople, ISSUE_LIST_COLUMNS, type IssueListRow } from '@/lib/queries'
import { IssueRow } from '@/components/app/issue-row'
import { OPEN_STATUSES } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Committee queue' }

const TABS = [
  { key: 'action', label: 'Needs action' },
  { key: 'progress', label: 'In progress' },
  { key: 'done', label: 'Resolved' },
  { key: 'all', label: 'All' },
] as const

type Stats = { open: number; unassigned: number; overdue: number; resolved_30d: number; within_sla_30d: number; median_hours_30d: number; avg_rating: number | null }

export default async function AdminQueue({ searchParams }: PageProps<'/admin'>) {
  const sp = await searchParams
  const tab = (TABS.find((t) => t.key === sp.tab)?.key ?? 'action') as (typeof TABS)[number]['key']
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : ''
  const block = typeof sp.block === 'string' ? sp.block : ''
  const { supabase, org } = await requireManager()

  let query = supabase.from('issues').select(ISSUE_LIST_COLUMNS).eq('org_id', org.id).is('duplicate_of', null)
  if (tab === 'action') query = query.in('status', ['open', 'assigned'])
  if (tab === 'progress') query = query.in('status', ['in_progress', 'on_hold'])
  if (tab === 'done') query = query.in('status', ['resolved', 'closed', 'rejected'])
  if (q) query = query.ilike('title', `%${q.replace(/[%_]/g, '')}%`)
  if (block) query = query.eq('block_id', block)
  query = tab === 'done' ? query.order('updated_at', { ascending: false }) : query.order('sla_due_at', { ascending: true, nullsFirst: false })

  const [{ data: issues }, statsRes, categories, blocks, people] = await Promise.all([
    query.limit(200),
    supabase.rpc('issue_stats', { p_org: org.id }),
    getCategories(supabase, org.id),
    getBlocks(supabase, org.id),
    getPeople(supabase, org.id),
  ])
  const stats = (statsRes.data ?? {}) as Stats
  const rows = (issues ?? []) as IssueListRow[]
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const blockMap = new Map(blocks.map((b) => [b.id, b]))
  const slaPct = stats.resolved_30d ? Math.round((stats.within_sla_30d / stats.resolved_30d) * 100) : null

  const cards = [
    { label: 'Open', value: stats.open ?? 0, tone: '' },
    { label: 'Unassigned', value: stats.unassigned ?? 0, tone: stats.unassigned ? 'text-sky-700' : '' },
    { label: 'Overdue', value: stats.overdue ?? 0, tone: stats.overdue ? 'text-red-700' : '' },
    { label: 'Resolved (30 days)', value: stats.resolved_30d ?? 0, tone: '' },
    { label: 'On time (30 days)', value: slaPct == null ? '—' : `${slaPct}%`, tone: '' },
    { label: 'Median fix time', value: stats.resolved_30d ? `${stats.median_hours_30d} h` : '—', tone: '' },
  ]

  const href = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({ ...(tab !== 'action' ? { tab } : {}), ...(q ? { q } : {}), ...(block ? { block } : {}), ...overrides })
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k)
    const s = p.toString()
    return s ? `/admin?${s}` : '/admin'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s queue</h1>
          <p className="text-sm text-subtle">{org.name}</p>
        </div>
        <Link href="/app/report" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">+ Log an issue</Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="text-xs text-subtle">{c.label}</p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums', c.tone)}>{c.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Filter" className="flex gap-1 rounded-xl bg-stone-100 p-1 text-sm">
            {TABS.map((t) => (
              <Link key={t.key} href={href({ tab: t.key === 'action' ? '' : t.key })} className={cn('rounded-lg px-3 py-1.5', tab === t.key ? 'bg-white font-medium shadow-sm' : 'text-subtle hover:text-text')}>
                {t.label}
              </Link>
            ))}
          </nav>
          <form className="flex gap-2" action="/admin">
            {tab !== 'action' && <input type="hidden" name="tab" value={tab} />}
            {blocks.length > 0 && (
              <select name="block" defaultValue={block} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
                <option value="">All towers</option>
                {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <input name="q" defaultValue={q} placeholder="Search issues" className="w-40 rounded-xl border border-line bg-white px-3 py-2 text-sm sm:w-56" />
            <button className="rounded-xl bg-text px-3 py-2 text-sm font-medium text-white">Filter</button>
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-line">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-medium">Nothing here.</p>
            <p className="text-sm text-subtle">{tab === 'action' ? 'Every new issue is assigned. Nice work.' : 'Try another filter.'}</p>
          </div>
        ) : (
          <div className="grid gap-2 xl:grid-cols-2">
            {rows.map((i) => (
              <IssueRow
                key={i.id}
                issue={i}
                href={`/admin/issues/${i.id}`}
                categories={catMap}
                blocks={blockMap}
                showDue={OPEN_STATUSES.includes(i.status)}
                assigneeName={i.assignee_id ? people.get(i.assignee_id)?.display_name : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
