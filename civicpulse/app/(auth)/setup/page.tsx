import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Setup required' }

// Shown when the app runs without a Supabase project configured (e.g. a fresh clone).
export default function SetupPage() {
  return (
    <div className="w-full max-w-xl rounded-3xl bg-white p-7 ring-1 ring-line">
      <h1 className="text-2xl font-semibold tracking-tight">Connect a database to continue</h1>
      <p className="mt-2 text-sm text-subtle">
        This copy of the app is not connected to Supabase yet, so sign-in and the community app are switched off.
        The marketing pages and civic mode still work.
      </p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm">
        <li>Create a Supabase project in the Mumbai (ap-south-1) region.</li>
        <li>Apply the SQL files in <code className="rounded bg-stone-100 px-1">supabase/migrations</code> in order.</li>
        <li>Copy <code className="rounded bg-stone-100 px-1">.env.example</code> to <code className="rounded bg-stone-100 px-1">.env.local</code> and fill in the URL and keys.</li>
        <li>Run <code className="rounded bg-stone-100 px-1">npm run demo:setup</code> to create the demo society.</li>
      </ol>
      <p className="mt-5 text-sm text-subtle">Full steps are in <code className="rounded bg-stone-100 px-1">docs/SETUP.md</code>.</p>
    </div>
  )
}
