'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const input = 'w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'enter' | 'verify' | 'sent'>('enter')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const e164 = `+91${phone.replace(/\D/g, '').slice(-10)}`

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const supabase = createClient()
    if (mode === 'phone') {
      if (!/^\+91[6-9]\d{9}$/.test(e164)) {
        setBusy(false)
        return setError('Enter a 10-digit Indian mobile number.')
      }
      const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
      setBusy(false)
      if (error) return setError(friendly(error.message))
      setStage('verify')
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      setBusy(false)
      if (error) return setError(friendly(error.message))
      setStage('sent')
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await createClient().auth.verifyOtp({ phone: e164, token: code.trim(), type: 'sms' })
    setBusy(false)
    if (error) return setError(friendly(error.message))
    router.replace(next)
    router.refresh()
  }

  if (stage === 'sent') {
    return (
      <div className="rounded-2xl bg-brand-soft p-5 text-sm">
        <p className="font-semibold text-text">Check your email</p>
        <p className="mt-1 text-subtle">We sent a sign-in link to <strong>{email}</strong>. Open it on this device.</p>
      </div>
    )
  }

  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-medium">
        {(['phone', 'email'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => { setMode(m); setStage('enter'); setError(null) }}
            className={cn('flex items-center justify-center gap-2 rounded-lg py-2 transition', mode === m ? 'bg-white shadow-sm' : 'text-subtle')}
          >
            {m === 'phone' ? <Phone className="size-4" /> : <Mail className="size-4" />}
            {m === 'phone' ? 'Mobile' : 'Email'}
          </button>
        ))}
      </div>

      {stage === 'verify' ? (
        <form onSubmit={verify} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            Enter the 6-digit code sent to {e164}
            <input
              className={cn(input, 'mt-1.5 tracking-[0.4em]')}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy || code.length < 6} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Checking…' : 'Verify and continue'}
          </button>
          <button type="button" onClick={() => setStage('enter')} className="w-full text-sm text-subtle hover:text-text">
            Use a different number
          </button>
        </form>
      ) : (
        <form onSubmit={sendCode} className="mt-5 space-y-3">
          {mode === 'phone' ? (
            <label className="block text-sm font-medium">
              Mobile number
              <div className="mt-1.5 flex">
                <span className="grid place-items-center rounded-l-xl border border-r-0 border-line bg-stone-50 px-3 text-sm text-subtle">+91</span>
                <input
                  className={cn(input, 'rounded-l-none')}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </label>
          ) : (
            <label className="block text-sm font-medium">
              Email address
              <input className={cn(input, 'mt-1.5')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
          )}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
            {busy ? 'Sending…' : mode === 'phone' ? 'Send code' : 'Email me a sign-in link'}
          </button>
        </form>
      )}
    </div>
  )
}

function friendly(message: string) {
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.'
  if (/expired|invalid/i.test(message)) return 'That code is wrong or has expired. Try again.'
  if (/phone.*(provider|disabled|unsupported)/i.test(message)) return 'Mobile sign-in is not switched on yet. Please use email for now.'
  return message
}
