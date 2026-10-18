'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy } from 'lucide-react'
import { createInvite, deleteInvite, reviewMember, revokeMember } from '../actions'

function useRun() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null)
      const res = await fn()
      if (!res.ok) setError(res.error ?? 'Something went wrong')
      router.refresh()
    })
  return { pending, error, run }
}

export function ReviewButtons({ membershipId }: { membershipId: string }) {
  const { pending, error, run } = useRun()
  return (
    <div className="flex items-center gap-2">
      <button disabled={pending} onClick={() => run(() => reviewMember(membershipId, true))} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">Approve</button>
      <button disabled={pending} onClick={() => run(() => reviewMember(membershipId, false))} className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium">Reject</button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}

export function RevokeButton({ membershipId }: { membershipId: string }) {
  const { pending, error, run } = useRun()
  return (
    <>
      <button
        disabled={pending}
        onClick={() => { if (confirm('Remove this person from the society?')) run(() => revokeMember(membershipId)) }}
        className="text-xs text-subtle hover:text-red-700"
      >
        Remove
      </button>
      {error && <span className="ml-2 text-xs text-red-700">{error}</span>}
    </>
  )
}

export function NewInvite() {
  const [role, setRole] = useState('resident_owner')
  const [auto, setAuto] = useState(false)
  const { pending, error, run } = useRun()
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs font-medium text-subtle">
        Invite
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block rounded-xl border border-line bg-white px-3 py-2 text-sm">
          <option value="resident_owner">Residents</option>
          <option value="staff">Staff / technicians</option>
          <option value="facility_manager">Facility manager</option>
          <option value="committee">Committee member</option>
        </select>
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-brand" />
        Approve automatically
      </label>
      <button disabled={pending} onClick={() => run(() => createInvite(role, auto))} className="rounded-xl bg-text px-4 py-2 text-sm font-semibold text-white">Create code</button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  )
}

export function InviteCode({ id, code, link }: { id: string; code: string; link: string }) {
  const [copied, setCopied] = useState(false)
  const { pending, run } = useRun()
  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg bg-canvas px-2.5 py-1 font-mono text-sm tracking-widest">{code}</code>
      <button
        onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand hover:bg-brand-soft"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : 'Copy link'}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`Join our society on the app: ${link}`)}`} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">
        Share on WhatsApp
      </a>
      <button disabled={pending} onClick={() => run(() => deleteInvite(id))} className="text-xs text-subtle hover:text-red-700">Delete</button>
    </div>
  )
}
