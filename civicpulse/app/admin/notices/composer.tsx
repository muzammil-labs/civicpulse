'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNotice, publishNotice } from '../actions'

export function NoticeComposer() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await publishNotice({ title, body, priority: urgent ? 'urgent' : 'normal' })
          if (!res.ok) return setError(res.error ?? 'Could not publish')
          setTitle(''); setBody(''); setUrgent(false); setError(null)
          router.refresh()
        })
      }}
      className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line"
    >
      <h2 className="font-semibold">New notice</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water supply shutdown on Sunday 7–11 am" maxLength={140} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={8000} placeholder="Write the details residents need to know." className="w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="accent-red-600" /> Mark as urgent
        </label>
        <button disabled={pending} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">{pending ? 'Publishing…' : 'Publish'}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  )
}

export function DeleteNoticeButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button disabled={pending} onClick={() => { if (confirm('Delete this notice?')) start(async () => { await deleteNotice(id); router.refresh() }) }} className="text-xs text-subtle hover:text-red-700">
      Delete
    </button>
  )
}
