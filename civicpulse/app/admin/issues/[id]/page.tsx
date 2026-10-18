import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock, MapPin, Phone } from 'lucide-react'
import { requireManager } from '@/lib/session'
import { getBlocks, getCategories, getPeople } from '@/lib/queries'
import { getIssueDetail } from '@/lib/issue-detail'
import { StatusBadge, UrgencyLabel } from '@/components/app/badges'
import { PhotoStrip } from '@/components/app/photo-strip'
import { Timeline } from '@/components/app/timeline'
import { CommentBox, WorkControls } from '@/components/app/issue-actions'
import { dueLabel, formatDateTime } from '@/lib/format'
import { OPEN_STATUSES } from '@/lib/types'
import { ManagePanel } from './manage-panel'

export const metadata: Metadata = { title: 'Manage issue' }

const ASSIGNABLE = new Set(['org_admin', 'committee', 'facility_manager', 'staff', 'vendor'])

export default async function AdminIssuePage({ params }: PageProps<'/admin/issues/[id]'>) {
  const { id } = await params
  const { supabase, org, user } = await requireManager()
  const detail = await getIssueDetail(supabase, id, user.id)
  if (!detail || detail.issue.org_id !== org.id) notFound()
  const { issue, events, photos, hasAfterPhoto, followerCount } = detail

  const [categories, blocks, people, reporter, similar] = await Promise.all([
    getCategories(supabase, org.id),
    getBlocks(supabase, org.id),
    getPeople(supabase, org.id),
    supabase.from('profiles').select('full_name, phone, email').eq('id', issue.created_by).maybeSingle(),
    supabase.rpc('find_similar_issues', { p_org: org.id, p_category: issue.category_id, p_block: issue.block_id, p_text: issue.title }),
  ])
  const category = categories.find((c) => c.id === issue.category_id)
  const block = blocks.find((b) => b.id === issue.block_id)
  const due = OPEN_STATUSES.includes(issue.status) ? dueLabel(issue.sla_due_at) : null
  const assignees = [...people.values()]
    .filter((p) => ASSIGNABLE.has(p.role))
    .map((p) => ({ id: p.profile_id, label: `${p.display_name}${p.title ? ` (${p.title})` : ` · ${p.role.replace('_', ' ')}`}` }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const similarIssues = ((similar.data ?? []) as { id: string; ref_no: number; title: string }[]).filter((s) => s.id !== issue.id)

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-subtle hover:text-text"><ArrowLeft className="size-4" /> Queue</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={issue.status} />
              <UrgencyLabel urgency={issue.urgency} />
              {issue.visibility === 'private' && <span className="inline-flex items-center gap-1 text-xs text-subtle"><Lock className="size-3" /> Private</span>}
              {due && <span className={`text-xs font-medium ${due.overdue ? 'text-red-700' : 'text-subtle'}`}>{due.text}</span>}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="mr-2" aria-hidden>{category?.icon ?? '📌'}</span>#{issue.ref_no} {issue.title}
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-subtle">
              <span>{category?.label.en ?? 'Uncategorised'}</span>
              {(block || issue.location_text) && (
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{[block?.name, issue.location_text].filter(Boolean).join(' · ')}</span>
              )}
              <span>· {formatDateTime(issue.created_at)}</span>
              <span>· {followerCount} affected</span>
            </p>
            {issue.description && <p className="whitespace-pre-wrap leading-relaxed">{issue.description}</p>}
          </header>

          <PhotoStrip photos={photos} />

          <WorkControls issueId={issue.id} orgId={org.id} status={issue.status} hasAfterPhoto={hasAfterPhoto} requireAfterPhoto={org.settings?.require_after_photo !== false} />

          <section>
            <h2 className="mb-4 font-semibold">Timeline</h2>
            <Timeline events={events} people={people} currentUserId={user.id} />
            <div className="mt-6">
              <CommentBox issueId={issue.id} allowInternal placeholder="Reply to residents, or tick “internal” for a committee-only note" />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <ManagePanel
            issueId={issue.id}
            status={issue.status}
            urgency={issue.urgency}
            categoryId={issue.category_id}
            assigneeId={issue.assignee_id}
            assignees={assignees}
            categories={categories}
            similar={similarIssues}
            isDuplicate={Boolean(issue.duplicate_of)}
          />
          <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-line">
            <h2 className="font-semibold">Reported by</h2>
            <p className="mt-2">{reporter.data?.full_name ?? 'Resident'}</p>
            {reporter.data?.phone && (
              <a href={`tel:${reporter.data.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-brand"><Phone className="size-3.5" />{reporter.data.phone}</a>
            )}
            {reporter.data?.email && <p className="mt-1 text-subtle">{reporter.data.email}</p>}
            {issue.ai_meta?.source && (
              <p className="mt-3 text-xs text-subtle">Category suggested by {issue.ai_meta.source === 'ai' ? 'AI from the photo' : 'keyword rules'}; confirmed by the resident.</p>
            )}
          </div>
          {issue.rating && (
            <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-line">
              <h2 className="font-semibold">Resident rating</h2>
              <p className="mt-1 text-lg text-amber-500">{'★'.repeat(issue.rating)}<span className="text-stone-300">{'★'.repeat(5 - issue.rating)}</span></p>
              {issue.rating_comment && <p className="mt-1 text-subtle">“{issue.rating_comment}”</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
