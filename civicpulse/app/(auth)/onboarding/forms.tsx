'use client'

import { useActionState, useState } from 'react'
import { createSociety, joinSociety, type OnboardingState } from './actions'
import { cn } from '@/lib/utils'

const input = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15'

export function OnboardingForms({ defaultName, initialCode }: { defaultName: string; initialCode: string }) {
  const [tab, setTab] = useState<'join' | 'create'>('join')
  const [joinState, joinAction, joining] = useActionState<OnboardingState, FormData>(joinSociety, {})
  const [createState, createAction, creating] = useActionState<OnboardingState, FormData>(createSociety, {})

  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-medium">
        <button type="button" role="tab" aria-selected={tab === 'join'} onClick={() => setTab('join')} className={cn('rounded-lg py-2', tab === 'join' ? 'bg-white shadow-sm' : 'text-subtle')}>
          I’m a resident
        </button>
        <button type="button" role="tab" aria-selected={tab === 'create'} onClick={() => setTab('create')} className={cn('rounded-lg py-2', tab === 'create' ? 'bg-white shadow-sm' : 'text-subtle')}>
          Set up my society
        </button>
      </div>

      {tab === 'join' ? (
        <form action={joinAction} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Your name<input name="fullName" defaultValue={defaultName} required className={input} autoComplete="name" /></label>
          <label className="block text-sm font-medium">
            Invite code
            <input name="code" defaultValue={initialCode} required className={cn(input, 'uppercase tracking-widest')} placeholder="e.g. 7F3K2Q9A" autoCapitalize="characters" />
            <span className="mt-1 block text-xs font-normal text-subtle">Ask your committee, or scan the QR poster in your lift.</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Tower / block<input name="block" className={input} placeholder="Tower B" /></label>
            <label className="block text-sm font-medium">Flat number<input name="unit" required className={input} placeholder="B-405" /></label>
          </div>
          <label className="block text-sm font-medium">
            I am the
            <select name="relation" defaultValue="owner" className={input}>
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
              <option value="family">Family member</option>
            </select>
          </label>
          {joinState.error && <p role="alert" className="text-sm text-red-700">{joinState.error}</p>}
          <button disabled={joining} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60">
            {joining ? 'Joining…' : 'Join my society'}
          </button>
        </form>
      ) : (
        <form action={createAction} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Your name<input name="fullName" defaultValue={defaultName} required className={input} autoComplete="name" /></label>
          <label className="block text-sm font-medium">Society name<input name="name" required className={input} placeholder="e.g. Lakeview Residency" /></label>
          <label className="block text-sm font-medium">City<input name="city" defaultValue="Hyderabad" className={input} /></label>
          <label className="block text-sm font-medium">
            Towers or blocks <span className="font-normal text-subtle">(comma separated, optional)</span>
            <input name="blocks" className={input} placeholder="Tower A, Tower B, Tower C" />
          </label>
          {createState.error && <p role="alert" className="text-sm text-red-700">{createState.error}</p>}
          <button disabled={creating} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60">
            {creating ? 'Creating…' : 'Create society'}
          </button>
          <p className="text-xs text-subtle">You’ll become the society admin and can invite the rest of the committee.</p>
        </form>
      )}
    </div>
  )
}
