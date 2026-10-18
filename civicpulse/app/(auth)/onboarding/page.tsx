import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getActiveOrg } from '@/lib/session'
import { OnboardingForms } from './forms'

export const metadata: Metadata = { title: 'Get started' }

export default async function OnboardingPage({ searchParams }: PageProps<'/onboarding'>) {
  const params = await searchParams
  const ctx = await getActiveOrg()
  if (!ctx) redirect('/login?next=/onboarding')
  if (ctx.org) redirect(ctx.isManager ? '/admin' : '/app')

  if (ctx.pending || params.joined === '1') {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center ring-1 ring-line">
        <p className="text-3xl">⏳</p>
        <h1 className="mt-2 text-xl font-semibold">Waiting for your committee</h1>
        <p className="mt-2 text-sm text-subtle">
          We’ve sent your request to join. A committee member will confirm your flat — usually within a day.
          You’ll be able to report issues as soon as they approve.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="text-sm text-subtle underline-offset-4 hover:underline">Sign out</button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-6 ring-1 ring-line sm:p-7">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome! Let’s get you in.</h1>
      <p className="mt-1 text-sm text-subtle">Join your society with an invite code, or set up a new one.</p>
      <div className="mt-5">
        <OnboardingForms defaultName={ctx.profile?.full_name ?? ''} initialCode={typeof params.code === 'string' ? params.code : ''} />
      </div>
    </div>
  )
}
