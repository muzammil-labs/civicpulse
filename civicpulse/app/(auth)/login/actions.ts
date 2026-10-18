'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_ACCOUNTS, isSupabaseConfigured, type DemoRole } from '@/lib/supabase/config'

const DEMO_DESTINATION: Record<DemoRole, string> = {
  resident: '/app',
  committee: '/admin',
  staff: '/app',
}

// One-click sign-in to the shared demo society. No OTP, no SMS cost.
export async function demoSignIn(formData: FormData) {
  const role = formData.get('role') as DemoRole
  const password = process.env.DEMO_USER_PASSWORD
  if (!isSupabaseConfigured() || !password || !(role in DEMO_ACCOUNTS)) {
    redirect('/login?error=demo-unavailable')
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: DEMO_ACCOUNTS[role], password })
  if (error) redirect('/login?error=demo-unavailable')
  redirect(DEMO_DESTINATION[role])
}
