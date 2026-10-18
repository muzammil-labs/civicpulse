import { Camera, CheckCircle2, GitMerge, MessageSquare, Star, UserCheck, Flag, ArrowRight } from 'lucide-react'
import type { IssueEvent } from '@/lib/types'
import type { Person } from '@/lib/queries'
import type { Translator } from '@/lib/i18n/messages'
import { STATUS_LABELS_EN } from '@/components/app/badges'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export function Timeline({
  events,
  people,
  currentUserId,
  t,
}: {
  events: IssueEvent[]
  people: Map<string, Person>
  currentUserId: string
  t?: Translator
}) {
  const name = (id: string | null | undefined) =>
    !id ? 'System' : id === currentUserId ? 'You' : (people.get(id)?.display_name ?? 'Someone')
  const status = (s: string | null) => (s ? (t ? t(`status.${s}` as Parameters<Translator>[0]) : STATUS_LABELS_EN[s as keyof typeof STATUS_LABELS_EN]) : '')

  return (
    <ol className="relative space-y-4 border-l border-line pl-6">
      {events.map((e) => {
        const p = e.payload ?? {}
        let icon = <Flag className="size-3.5" />
        let text: React.ReactNode = null
        switch (e.type) {
          case 'created':
            text = <><b>{name(e.actor_id)}</b> reported this</>
            break
          case 'status_changed':
            icon = e.to_status === 'resolved' ? <CheckCircle2 className="size-3.5" /> : <ArrowRight className="size-3.5" />
            text = <><b>{name(e.actor_id)}</b> changed status to <b>{status(e.to_status)}</b></>
            break
          case 'assigned':
            icon = <UserCheck className="size-3.5" />
            text = p.to ? <><b>{name(e.actor_id)}</b> assigned this to <b>{name(p.to as string)}</b></> : <><b>{name(e.actor_id)}</b> removed the assignee</>
            break
          case 'comment':
            icon = <MessageSquare className="size-3.5" />
            text = <b>{name(e.actor_id)}</b>
            break
          case 'merged':
            icon = <GitMerge className="size-3.5" />
            text = p.into_ref ? <>Merged into <b>#{String(p.into_ref)}</b></> : <><b>#{String(p.from_ref)}</b> was merged into this issue</>
            break
          case 'media_added':
            icon = <Camera className="size-3.5" />
            text = <><b>{name(e.actor_id)}</b> added {p.kind === 'after' ? 'an “after” photo' : 'a photo'}</>
            break
          case 'rated':
            icon = <Star className="size-3.5" />
            text = <><b>{name(e.actor_id)}</b> rated the fix {'★'.repeat(Number(p.rating ?? 0))}</>
            break
          default:
            text = e.type
        }
        return (
          <li key={e.id} className="relative">
            <span className={cn('absolute -left-[2.05rem] grid size-6 place-items-center rounded-full ring-4 ring-canvas', e.internal ? 'bg-amber-100 text-amber-800' : 'bg-white text-subtle ring-1')}>
              {icon}
            </span>
            <p className="text-sm">{text}</p>
            {e.body && (
              <p className={cn('mt-1.5 whitespace-pre-wrap rounded-xl px-3 py-2 text-sm', e.internal ? 'bg-amber-50 text-amber-950 ring-1 ring-amber-200' : 'bg-white ring-1 ring-line')}>
                {e.internal && <span className="mr-1 text-xs font-semibold uppercase text-amber-700">Internal ·</span>}
                {e.body}
              </p>
            )}
            <p className="mt-1 text-xs text-subtle">{formatDateTime(e.created_at)}</p>
          </li>
        )
      })}
    </ol>
  )
}
