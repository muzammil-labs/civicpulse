#!/usr/bin/env node
// Creates the three demo accounts (if missing) and rebuilds the demo society.
// Usage: npm run demo:setup   (reads .env.local; needs the service role key)
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.DEMO_USER_PASSWORD

if (!url || !serviceKey || !password) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_USER_PASSWORD in .env.local first.')
  process.exit(1)
}
if (password.length < 16) {
  console.error('DEMO_USER_PASSWORD must be at least 16 characters.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const ACCOUNTS = [
  ['demo-resident@example.com', 'Priya Sharma (demo)'],
  ['demo-committee@example.com', 'Ravi Kumar (demo)'],
  ['demo-staff@example.com', 'Suresh (demo electrician)'],
]

const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (listError) throw listError

for (const [email, fullName] of ACCOUNTS) {
  const existing = list.users.find((u) => u.email === email)
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password })
    console.log(`✓ ${email} exists (password refreshed)`)
  } else {
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
    if (error) throw error
    console.log(`✓ created ${email}`)
  }
}

const { data: orgId, error } = await admin.rpc('reset_demo')
if (error) throw error
console.log(`✓ demo society rebuilt (${orgId})`)
