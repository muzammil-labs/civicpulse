import type { Metadata } from 'next'
import { requireManager } from '@/lib/session'
import { formatDateTime } from '@/lib/format'
import { DeleteNoticeButton, NoticeComposer } from './composer'

export const metadata: Metadata = { title: 'Notices' }

export default async function AdminNotices() {
  const { supabase, org } = await requireManager()
  const [{ data: notices }, { count: members }] = await Promise.all([
    supabase.from('notices').select('id, title, body, priority, published_at, notice_reads(count)').eq('org_id', org.id).order('published_at', { ascending: false }).limit(50),
    supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('org_id', org.id).eq('status', 'active'),
  ])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Notices</h1>
        {(notices ?? []).length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-subtle ring-1 ring-line">No notices yet.</p>}
        {(notices ?? []).map((n) => {
          const reads = (n.notice_reads as { count: number }[])?.[0]?.count ?? 0
          return (
            <article key={n.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{n.priority === 'urgent' && <span className="mr-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Urgent</span>}{n.title}</h2>
                <DeleteNoticeButton id={n.id} />
              </div>
              <p className="mt-1 text-xs text-subtle">{formatDateTime(n.published_at)} · read by {reads} of {members ?? 0} members</p>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm">{n.body}</p>
            </article>
          )
        })}
      </div>
      <div className="lg:pt-12"><NoticeComposer /></div>
    </div>
  )
}
