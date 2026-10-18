export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseConfigured() {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0
}

export const DEMO_ORG_ID = '00000000-0000-4000-8000-000000000001'

export const DEMO_ACCOUNTS = {
  resident: 'demo-resident@example.com',
  committee: 'demo-committee@example.com',
  staff: 'demo-staff@example.com',
} as const

export type DemoRole = keyof typeof DEMO_ACCOUNTS

export const MEDIA_BUCKET = 'issue-media'
