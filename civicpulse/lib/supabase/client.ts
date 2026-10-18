'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey, supabaseUrl } from './config'

let client: ReturnType<typeof createBrowserClient> | null = null

// Browser client, used for photo uploads and sign-in. Row-level security applies.
export function createClient() {
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
