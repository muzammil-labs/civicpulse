'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Camera, Loader2, Star } from 'lucide-react'
import { addComment, setFollowing, updateIssue } from '@/app/app/actions'
import { createClient } from '@/lib/supabase/client'
import { MEDIA_BUCKET } from '@/lib/supabase/config'
import { compressImage } from '@/lib/image'
import type { IssueStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

function useAction() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError(null)
      const res = await fn()
      if (!res.ok) setError(res.error ?? 'Something went wrong')
      else {
        after?.()
        router.refresh()
      }
    })
  return { pending, error, run }
}

export function CommentBox({ issueId, allowInternal = false, placeholder = 'Add a comment', sendLabel = 'Send' }: { issueId: string; allowInternal?: boolean; placeholder?: string; sendLabel?: string }) {
  const [text, setText] = useState('')
  const [internal, setInternal] = useState(false)
  const { pending, error, run } = useAction()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(() => addComment(issueId, text, internal), () => setText(''))
      }}
      className="space-y-2"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={4000}
        placeholder={placeholder}
        className={cn('w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-3', internal ? 'border-amber-300 focus:ring-amber-200' : 'border-line focus:border-brand focus:ring-brand/15')}
      />
      <div className="flex items-center justify-between gap-3">
        {allowInternal ? (
          <label className="flex items-center gap-2 text-xs text-subtle">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-amber-600" />
            Internal note (committee &amp; staff only)
          </label>
        ) : <span />}
        <button disabled={pending || !text.trim()} className="rounded-lg bg-text px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {pending ? '…' : sendLabel}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  )
}

export function FollowButton({ issueId, following, count, label = 'people affected' }: { issueId: string; following: boolean; count: number; label?: string }) {
  const { pending, run } = useAction()
  return (
    <button
      onClick={() => run(() => setFollowing(issueId, !following))}
      disabled={pending}
      className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition', following ? 'bg-brand-soft text-brand ring-brand/30' : 'bg-white ring-line hover:ring-brand/40')}
    >
      {following ? <Bell className="size-4" /> : <BellOff className="size-4" />}
      {following ? 'Following' : 'Me too'} · {count} {label}
    </button>
  )
}

export function RateAndReopen({ issueId, canRate, canReopen, rateLabel, reopenLabel }: { issueId: string; canRate: boolean; canReopen: boolean; rateLabel: string; reopenLabel: string }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const { pending, error, run } = useAction()
  if (!canRate && !canReopen) return null
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      {canRate && (
        <div>
          <p className="text-sm font-semibold">{rateLabel}</p>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label={rateLabel}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)} className="p-1">
                <Star className={cn('size-7', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300')} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="mt-2 flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything to add? (optional)" className="flex-1 rounded-xl border border-line px-3 py-2 text-sm" maxLength={1000} />
              <button disabled={pending} onClick={() => run(() => updateIssue(issueId, { rating, rating_comment: comment || null }))} className="rounded-xl bg-brand px-4 text-sm font-semibold text-white">
                Save
              </button>
            </div>
          )}
        </div>
      )}
      {canReopen && (
        <button disabled={pending} onClick={() => run(() => updateIssue(issueId, { status: 'open' }))} className="text-sm font-medium text-red-700 hover:underline">
          {reopenLabel}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  )
}

// For the assigned staff member (and the committee): move the work along and close it with proof.
export function WorkControls({
  issueId,
  orgId,
  status,
  hasAfterPhoto,
  requireAfterPhoto,
}: {
  issueId: string
  orgId: string
  status: IssueStatus
  hasAfterPhoto: boolean
  requireAfterPhoto: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [note, setNote] = useState('')
  const { pending, error, run } = useAction()
  const router = useRouter()
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (['resolved', 'closed', 'rejected'].includes(status)) return null

  async function uploadAfter(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const blob = await compressImage(file)
      const supabase = createClient()
      const path = `${orgId}/${issueId}/after-${crypto.randomUUID()}.jpg`
      const up = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
      if (up.error) throw new Error('Upload failed. Check your connection and try again.')
      const ins = await supabase.from('issue_media').insert({ issue_id: issueId, org_id: orgId, kind: 'after', storage_path: path, mime: 'image/jpeg', size_bytes: blob.size })
      if (ins.error) throw new Error('Only the assigned person or the committee can add an after photo.')
      router.refresh()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const canResolve = hasAfterPhoto || !requireAfterPhoto

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <p className="text-sm font-semibold">Update the work</p>
      <div className="flex flex-wrap gap-2">
        {status !== 'in_progress' && (
          <button disabled={pending} onClick={() => run(() => updateIssue(issueId, { status: 'in_progress' }))} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200">
            Start work
          </button>
        )}
        {status !== 'on_hold' && (
          <button disabled={pending} onClick={() => run(() => updateIssue(issueId, { status: 'on_hold' }))} className="rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">
            Put on hold
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadAfter(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {hasAfterPhoto ? 'Add another after photo' : 'Add “after” photo'}
        </button>
      </div>
      <div className="flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done? (resolution note)" className="flex-1 rounded-xl border border-line px-3 py-2 text-sm" maxLength={2000} />
        <button
          disabled={pending || !canResolve}
          title={canResolve ? undefined : 'Add an after photo first'}
          onClick={() => run(() => updateIssue(issueId, { status: 'resolved', resolution_note: note || null }))}
          className="rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Mark resolved
        </button>
      </div>
      {!canResolve && <p className="text-xs text-subtle">An “after” photo is required before this can be marked resolved.</p>}
      {(error || uploadError) && <p role="alert" className="text-sm text-red-700">{error ?? uploadError}</p>}
    </div>
  )
}
