import type { Metadata } from 'next'
import { requireMember } from '@/lib/session'
import { getT } from '@/lib/i18n/server'
import { formatDateTime } from '@/lib/format'
import type { Notice } from '@/lib/types'
import { MarkRead } from './mark-read'

export const metadata: Metadata = { title: 'Notices' }

export default async function NoticesPage() {
  const { supabase, org, profile } = await requireMember()
  const { t } = await getT(profile?.locale)
  const { data } = await supabase
    .from('notices')
    .select('id, title, body, priority, published_at')
    .eq('org_id', org.id)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50)
  const notices = (data ?? []) as Notice[]

  return (
    <div>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">{t('notices.title')}</h1>
      <MarkRead ids={notices.map((n) => n.id)} />
      {notices.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-subtle ring-1 ring-line">{t('notices.empty')}</p>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <article key={n.id} className={`rounded-2xl bg-white p-5 ring-1 ${n.priority === 'urgent' ? 'ring-red-200' : 'ring-line'}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{n.title}</h2>
                {n.priority === 'urgent' && <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">{t('notices.urgent')}</span>}
              </div>
              <p className="mt-1 text-xs text-subtle">{formatDateTime(n.published_at)}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
