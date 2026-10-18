import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { demoSignIn } from './actions'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

const DEMOS = [
  { role: 'resident', title: 'Resident', body: 'Report an issue and follow it' },
  { role: 'committee', title: 'Committee', body: 'Work the queue, assign, merge' },
  { role: 'staff', title: 'Staff', body: 'See jobs and close them with proof' },
] as const

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const next = typeof params.next === 'string' && params.next.startsWith('/') && !params.next.startsWith('//') ? params.next : '/app'
  if (!isSupabaseConfigured()) redirect('/setup')
  if (await getSession()) redirect(next)

  const demoFirst = params.demo === '1'
  const demoError = params.error === 'demo-unavailable'

  const demo = (
    <section aria-labelledby="demo-heading" className="rounded-3xl bg-white p-6 ring-1 ring-line">
      <h2 id="demo-heading" className="font-semibold">Explore the demo society</h2>
      <p className="mt-1 text-sm text-subtle">Sunrise Enclave is a sample community that resets every night. Nothing you do there is real.</p>
      <div className="mt-4 grid gap-2">
        {DEMOS.map((d) => (
          <form key={d.role} action={demoSignIn}>
            <input type="hidden" name="role" value={d.role} />
            <button className="flex w-full items-center justify-between rounded-xl bg-canvas px-4 py-3 text-left ring-1 ring-line transition hover:ring-brand">
              <span>
                <span className="block text-sm font-semibold">Try as {d.title}</span>
                <span className="block text-xs text-subtle">{d.body}</span>
              </span>
              <span aria-hidden className="text-brand">→</span>
            </button>
          </form>
        ))}
      </div>
      {demoError && <p role="alert" className="mt-3 text-sm text-red-700">The demo is not available right now. Please try again later.</p>}
    </section>
  )

  return (
    <div className="w-full max-w-md space-y-6">
      {demoFirst && demo}
      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-subtle">New here? Signing in creates your account.</p>
        <div className="mt-5">
          <LoginForm next={next} />
        </div>
      </section>
      {!demoFirst && demo}
    </div>
  )
}
