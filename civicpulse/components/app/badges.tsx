import type { IssueStatus, IssueUrgency } from '@/lib/types'
import type { Translator } from '@/lib/i18n/messages'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<IssueStatus, string> = {
  open: 'bg-sky-50 text-sky-800 ring-sky-200',
  assigned: 'bg-violet-50 text-violet-800 ring-violet-200',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  on_hold: 'bg-slate-100 text-slate-700 ring-slate-200',
  resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  closed: 'bg-stone-100 text-stone-600 ring-stone-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const STATUS_DOTS: Record<IssueStatus, string> = {
  open: 'bg-sky-500',
  assigned: 'bg-violet-500',
  in_progress: 'bg-amber-500',
  on_hold: 'bg-slate-400',
  resolved: 'bg-emerald-500',
  closed: 'bg-stone-400',
  rejected: 'bg-rose-500',
}

export const STATUS_LABELS_EN: Record<IssueStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In progress',
  on_hold: 'On hold',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Not actionable',
}

export function StatusBadge({ status, t, className }: { status: IssueStatus; t?: Translator; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_DOTS[status])} />
      {t ? t(`status.${status}`) : STATUS_LABELS_EN[status]}
    </span>
  )
}

const URGENCY_STYLES: Record<IssueUrgency, string> = {
  low: 'text-stone-500',
  medium: 'text-stone-600',
  high: 'text-orange-700',
  critical: 'text-red-700 font-semibold',
}

export const URGENCY_LABELS_EN: Record<IssueUrgency, string> = {
  low: 'Low',
  medium: 'Normal',
  high: 'High',
  critical: 'Emergency',
}

export function UrgencyLabel({ urgency, t }: { urgency: IssueUrgency; t?: Translator }) {
  if (urgency === 'medium' || urgency === 'low') return null
  return (
    <span className={cn('text-xs', URGENCY_STYLES[urgency])}>
      {urgency === 'critical' ? '⚠ ' : '▲ '}
      {t ? t(`urgency.${urgency}`) : URGENCY_LABELS_EN[urgency]}
    </span>
  )
}
