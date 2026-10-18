import Link from 'next/link'
import { Lock, Users } from 'lucide-react'
import { StatusBadge, UrgencyLabel } from '@/components/app/badges'
import type { IssueListRow } from '@/lib/queries'
import type { Block, Category, Locale } from '@/lib/types'
import type { Translator } from '@/lib/i18n/messages'
import { dueLabel, timeAgo } from '@/lib/format'
import { OPEN_STATUSES } from '@/lib/types'
import { cn } from '@/lib/utils'

export function categoryLabel(c: Category | undefined, locale: Locale = 'en') {
  if (!c) return 'Other'
  return c.label[locale] ?? c.label.en
}

export function IssueRow({
  issue,
  href,
  categories,
  blocks,
  locale = 'en',
  t,
  showDue = false,
  assigneeName,
}: {
  issue: IssueListRow
  href: string
  categories: Map<string, Category>
  blocks: Map<string, Block>
  locale?: Locale
  t?: Translator
  showDue?: boolean
  assigneeName?: string
}) {
  const cat = issue.category_id ? categories.get(issue.category_id) : undefined
  const block = issue.block_id ? blocks.get(issue.block_id) : undefined
  const followers = issue.issue_followers?.[0]?.count ?? 0
  const due = showDue && OPEN_STATUSES.includes(issue.status) ? dueLabel(issue.sla_due_at) : null

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line transition hover:ring-brand/50 hover:shadow-sm"
    >
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-lg">
        {cat?.icon ?? '📌'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-brand">{issue.title}</p>
          <StatusBadge status={issue.status} t={t} className="shrink-0" />
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-subtle">
          <span>#{issue.ref_no}</span>
          <span>·</span>
          <span>{categoryLabel(cat, locale)}</span>
          {block && (<><span>·</span><span>{block.name}</span></>)}
          <span>·</span>
          <span>{timeAgo(issue.created_at)}</span>
          {followers > 1 && (
            <span className="inline-flex items-center gap-1"><Users className="size-3" />{followers}</span>
          )}
          {issue.visibility === 'private' && <Lock className="size-3" aria-label="Private" />}
          {assigneeName && <span className="text-text">→ {assigneeName}</span>}
          <UrgencyLabel urgency={issue.urgency} t={t} />
          {due && <span className={cn('font-medium', due.overdue ? 'text-red-700' : 'text-subtle')}>{due.text}</span>}
        </p>
      </div>
    </Link>
  )
}
