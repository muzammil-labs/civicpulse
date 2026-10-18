'use client'

import { useActionState } from 'react'
import { requestDemo, type DemoState } from './actions'

const input = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15'

export function DemoForm() {
  const [state, action, pending] = useActionState<DemoState, FormData>(requestDemo, { ok: false })

  if (state.ok) {
    return (
      <div className="rounded-3xl bg-brand-soft p-8 text-center">
        <p className="text-2xl">🎉</p>
        <h2 className="mt-2 text-xl font-semibold">Thank you — we’ll be in touch within a day.</h2>
        <p className="mt-2 text-sm text-subtle">Meanwhile, you can explore the live demo society.</p>
        <a href="/login?demo=1" className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white">Open the demo</a>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Your name<input name="name" required className={input} autoComplete="name" /></label>
        <label className="block text-sm font-medium">Community name<input name="community" required className={input} placeholder="e.g. Lakeview Residency" /></label>
      </div>
      <label className="block text-sm font-medium">
        Number of homes
        <select name="homes" required defaultValue="51-300" className={input}>
          <option value="1-50">Up to 50</option>
          <option value="51-300">51 to 300</option>
          <option value="300+">More than 300</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className={input} autoComplete="email" /></label>
        <label className="block text-sm font-medium">Phone <span className="font-normal text-subtle">(optional)</span><input name="phone" type="tel" className={input} autoComplete="tel" /></label>
      </div>
      <label className="block text-sm font-medium">
        Anything we should know? <span className="font-normal text-subtle">(optional)</span>
        <textarea name="message" rows={3} className={input} placeholder="Biggest headache right now, current tools, committee meeting date…" />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
        {pending ? 'Sending…' : 'Request a demo'}
      </button>
      <p className="text-center text-xs text-subtle">We only use these details to contact you about a demo. See our <a href="/privacy" className="underline">privacy notice</a>.</p>
    </form>
  )
}
