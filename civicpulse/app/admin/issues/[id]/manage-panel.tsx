'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateIssue } from '@/app/app/actions'
import { mergeIssue } from '@/app/admin/actions'
import type { Category, IssueStatus, IssueUrgency } from '@/lib/types'
import { STATUS_LABELS_EN, URGENCY_LABELS_EN } from '@/components/app/badges'

type Option = { id: string; label: string }

const select = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand'

export function ManagePanel({
  issueId,
  status,
  urgency,
  categoryId,
  assigneeId,
  assignees,
  categories,
  similar,
  isDuplicate,
}: {
  issueId: string
  status: IssueStatus
  urgency: IssueUrgency
  categoryId: string | null
  assigneeId: string | null
  assignees: Option[]
  categories: Category[]
  similar: { id: string; ref_no: number; title: string }[]
  isDuplicate: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const save = (patch: Parameters<typeof updateIssue>[1]) =>
    start(async () => {
      setError(null)
      const res = await updateIssue(issueId, patch)
      if (!res.ok) setError(res.error)
      router.refresh()
    })

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 className="font-semibold">Manage</h2>

      <label className="block text-xs font-medium text-subtle">
        Assigned to
        <select className={`${select} mt-1`} value={assigneeId ?? ''} disabled={pending} onChange={(e) => save({ assignee_id: e.target.value || null })}>
          <option value="">— Unassigned —</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-subtle">
          Status
          <select
            className={`${select} mt-1`}
            value={status}
            disabled={pending}
            onChange={(e) => save({ status: e.target.value as IssueStatus, ...(note ? { resolution_note: note } : {}) })}
          >
            {(Object.keys(STATUS_LABELS_EN) as IssueStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS_EN[s]}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-subtle">
          Urgency
          <select className={`${select} mt-1`} value={urgency} disabled={pending} onChange={(e) => save({ urgency: e.target.value as IssueUrgency })}>
            {(Object.keys(URGENCY_LABELS_EN) as IssueUrgency[]).map((u) => <option key={u} value={u}>{URGENCY_LABELS_EN[u]}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-xs font-medium text-subtle">
        Category
        <select className={`${select} mt-1`} value={categoryId ?? ''} disabled={pending} onChange={(e) => save({ category_id: e.target.value || null })}>
          <option value="">—</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label.en}</option>)}
        </select>
      </label>

      <label className="block text-xs font-medium text-subtle">
        Resolution note (shown to residents when closing or rejecting)
        <textarea className={`${select} mt-1`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} onClick={() => save({ status: 'closed', resolution_note: note || null })} className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white">Close</button>
        <button disabled={pending || !note.trim()} onClick={() => save({ status: 'rejected', resolution_note: note })} className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 ring-1 ring-rose-200 disabled:opacity-40" title="Add a note explaining why">
          Not actionable
        </button>
      </div>

      {!isDuplicate && similar.length > 0 && (
        <div className="border-t border-line pt-4">
          <p className="text-xs font-medium text-subtle">Possible duplicates — merge this issue into:</p>
          <ul className="mt-2 space-y-1.5">
            {similar.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <a href={`/admin/issues/${s.id}`} className="min-w-0 truncate hover:underline">#{s.ref_no} {s.title}</a>
                <button
                  disabled={pending}
                  onClick={() => start(async () => {
                    const res = await mergeIssue(issueId, s.id)
                    if (!res.ok) setError(res.error ?? 'Could not merge')
                    else router.push(`/admin/issues/${s.id}`)
                  })}
                  className="shrink-0 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium hover:bg-stone-200"
                >
                  Merge
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
