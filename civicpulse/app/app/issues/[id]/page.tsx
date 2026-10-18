import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock, MapPin } from 'lucide-react'
import { requireMember } from '@/lib/session'
import { getT } from '@/lib/i18n/server'
import { getBlocks, getCategories, getPeople } from '@/lib/queries'
import { getIssueDetail } from '@/lib/issue-detail'
import { StatusBadge, UrgencyLabel } from '@/components/app/badges'
import { categoryLabel } from '@/components/app/issue-row'
import { PhotoStrip } from '@/components/app/photo-strip'
import { Timeline } from '@/components/app/timeline'
import { CommentBox, FollowButton, RateAndReopen, WorkControls } from '@/components/app/issue-actions'
import { dueLabel, formatDateTime, isWithinDays } from '@/lib/format'
import { OPEN_STATUSES } from '@/lib/types'

export const metadata: Metadata = { title: 'Issue' }

export default async function IssuePage({ params, searchParams }: PageProps<'/app/issues/[id]'>) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, org, user, profile, isManager } = await requireMember()
  const { locale, t } = await getT(profile?.locale)

  const detail = await getIssueDetail(supabase, id, user.id)
  if (!detail || detail.issue.org_id !== org.id) notFound()
  const { issue, events, photos, hasAfterPhoto, followerCount, isFollowing } = detail

  const [categories, blocks, people] = await Promise.all([
    getCategories(supabase, org.id),
    getBlocks(supabase, org.id),
    getPeople(supabase, org.id),
  ])
  const category = categories.find((c) => c.id === issue.category_id)
  const block = blocks.find((b) => b.id === issue.block_id)
  const isReporter = issue.created_by === user.id
  const isAssignee = issue.assignee_id === user.id
  const due = OPEN_STATUSES.includes(issue.status) ? dueLabel(issue.sla_due_at) : null
  const recentlyResolved = issue.status === 'resolved' && isWithinDays(issue.resolved_at, 7)

  return (
    <div className="space-y-6">
      <Link href={isManager ? `/admin/issues/${issue.id}` : '/app'} className="inline-flex items-center gap-1 text-sm text-subtle hover:text-text">
        <ArrowLeft className="size-4" /> {isManager ? 'Open in committee view' : t('nav.home')}
      </Link>

      {sp.new === '1' && (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">✅ {t('report.done')}</p>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={issue.status} t={t} />
          <UrgencyLabel urgency={issue.urgency} t={t} />
          {issue.visibility === 'private' && <span className="inline-flex items-center gap-1 text-xs text-subtle"><Lock className="size-3" /> Private</span>}
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">
          <span className="mr-2" aria-hidden>{category?.icon ?? '📌'}</span>
          {issue.title}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-subtle">
          <span>#{issue.ref_no}</span>
          <span>·</span>
          <span>{categoryLabel(category, locale)}</span>
          {(block || issue.location_text) && (
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{[block?.name, issue.location_text].filter(Boolean).join(' · ')}</span>
          )}
          <span>·</span>
          <span>{formatDateTime(issue.created_at)}</span>
          {due && <span className={due.overdue ? 'font-medium text-red-700' : ''}>· {t('issue.due')}: {due.text}</span>}
        </p>
        {issue.description && <p className="whitespace-pre-wrap leading-relaxed">{issue.description}</p>}
        {issue.duplicate_of && (
          <p className="rounded-xl bg-stone-100 p-3 text-sm">This was merged into another report. <Link className="font-medium text-brand underline" href={`/app/issues/${issue.duplicate_of}`}>Follow the original</Link>.</p>
        )}
      </header>

      <PhotoStrip photos={photos} beforeLabel={t('issue.before')} afterLabel={t('issue.after')} />

      {issue.resolution_note && ['resolved', 'closed', 'rejected'].includes(issue.status) && (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950 ring-1 ring-emerald-200"><b>Resolution:</b> {issue.resolution_note}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!isReporter && issue.visibility === 'community' && (
          <FollowButton issueId={issue.id} following={isFollowing} count={followerCount} label={t('issue.followers')} />
        )}
        {isReporter && followerCount > 1 && (
          <span className="rounded-full bg-white px-3.5 py-2 text-sm ring-1 ring-line">{followerCount} {t('issue.followers')}</span>
        )}
      </div>

      {(isAssignee || isManager) && (
        <WorkControls
          issueId={issue.id}
          orgId={org.id}
          status={issue.status}
          hasAfterPhoto={hasAfterPhoto}
          requireAfterPhoto={org.settings?.require_after_photo !== false}
        />
      )}

      {isReporter && (
        <RateAndReopen
          issueId={issue.id}
          canRate={['resolved', 'closed'].includes(issue.status) && issue.rating == null}
          canReopen={Boolean(recentlyResolved)}
          rateLabel={t('issue.rate')}
          reopenLabel={t('issue.reopen')}
        />
      )}

      <section>
        <h2 className="mb-4 font-semibold">{t('issue.timeline')}</h2>
        <Timeline events={events} people={people} currentUserId={user.id} t={t} />
        <div className="mt-6">
          <CommentBox issueId={issue.id} allowInternal={isManager} placeholder={t('issue.addComment')} sendLabel={t('issue.send')} />
        </div>
      </section>
    </div>
  )
}
