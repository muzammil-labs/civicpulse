import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseUrl } from './config'

// Service-role client: bypasses row-level security. Only for trusted server code
// (usage metering, demo sign-in). Never import this from a Client Component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !key) return null
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
