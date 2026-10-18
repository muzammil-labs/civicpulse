import Link from 'next/link'
import { Camera, ChevronRight } from 'lucide-react'
import { requireMember } from '@/lib/session'
import { getT } from '@/lib/i18n/server'
import { getBlocks, getCategories, ISSUE_LIST_COLUMNS, type IssueListRow } from '@/lib/queries'
import { IssueRow } from '@/components/app/issue-row'
import { OPEN_STATUSES, type Notice } from '@/lib/types'
import { timeAgo } from '@/lib/format'

export default async function ResidentHome() {
  const { supabase, org, user, profile, roles } = await requireMember()
  const { locale, t } = await getT(profile?.locale)
  const isStaff = roles.some((r) => r === 'staff' || r === 'vendor')

  const [categories, blocks, mine, followed, jobs, community, notices] = await Promise.all([
    getCategories(supabase, org.id),
    getBlocks(supabase, org.id),
    supabase.from('issues').select(ISSUE_LIST_COLUMNS).eq('org_id', org.id).eq('created_by', user.id)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('issue_followers').select('issue_id').eq('profile_id', user.id).limit(50),
    isStaff
      ? supabase.from('issues').select(ISSUE_LIST_COLUMNS).eq('org_id', org.id).eq('assignee_id', user.id)
          .in('status', OPEN_STATUSES).order('sla_due_at', { ascending: true }).limit(30)
      : Promise.resolve({ data: [] }),
    supabase.from('issues').select(ISSUE_LIST_COLUMNS).eq('org_id', org.id).eq('visibility', 'community')
      .is('duplicate_of', null).in('status', OPEN_STATUSES).neq('created_by', user.id)
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('notices').select('id, title, body, priority, published_at').eq('org_id', org.id)
      .lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(2),
  ])

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const blockMap = new Map(blocks.map((b) => [b.id, b]))
  const myIssues = (mine.data ?? []) as IssueListRow[]
  const followedIds = new Set((followed.data ?? []).map((f) => f.issue_id as string))
  const myJobs = (jobs.data ?? []) as IssueListRow[]
  const nearby = ((community.data ?? []) as IssueListRow[])
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('home.greeting')}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <Link
          href="/app/report"
          className="mt-4 flex items-center gap-4 rounded-3xl bg-brand p-5 text-white shadow-lg shadow-brand/20 transition hover:bg-brand-strong"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Camera className="size-6" /></span>
          <span className="flex-1">
            <span className="block text-lg font-semibold">{t('home.reportCta')}</span>
            <span className="block text-sm text-white/80">{t('home.reportHint')}</span>
          </span>
          <ChevronRight className="size-5" />
        </Link>
      </section>

      {isStaff && (
        <section>
          <h2 className="mb-3 font-semibold">My jobs ({myJobs.length})</h2>
          {myJobs.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-subtle ring-1 ring-line">No open jobs assigned to you. 🎉</p>
          ) : (
            <div className="space-y-2">
              {myJobs.map((i) => (
                <IssueRow key={i.id} issue={i} href={`/app/issues/${i.id}`} categories={catMap} blocks={blockMap} locale={locale} t={t} showDue />
              ))}
            </div>
          )}
        </section>
      )}

      {notices.data && notices.data.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t('home.latestNotices')}</h2>
            <Link href="/app/notices" className="text-sm text-brand">{t('home.seeAll')}</Link>
          </div>
          <div className="space-y-2">
            {(notices.data as Notice[]).map((n) => (
              <Link key={n.id} href="/app/notices" className="block rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-brand/50">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {n.priority === 'urgent' && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{t('notices.urgent')}</span>}
                  {n.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-subtle">{timeAgo(n.published_at)} · {n.body}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">{t('home.myIssues')}</h2>
        {myIssues.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-subtle ring-1 ring-line">{t('home.noIssues')}</p>
        ) : (
          <div className="space-y-2">
            {myIssues.map((i) => (
              <IssueRow key={i.id} issue={i} href={`/app/issues/${i.id}`} categories={catMap} blocks={blockMap} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      {nearby.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{t('home.community')}</h2>
          <div className="space-y-2">
            {nearby.map((i) => (
              <div key={i.id} className="relative">
                <IssueRow issue={i} href={`/app/issues/${i.id}`} categories={catMap} blocks={blockMap} locale={locale} t={t} />
                {followedIds.has(i.id) && (
                  <span className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-medium text-brand">✓ {t('report.followed')}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
