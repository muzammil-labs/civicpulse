'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

const DemoRequest = z.object({
  name: z.string().trim().min(1, 'Please tell us your name').max(120),
  community: z.string().trim().min(1, 'Which community is this for?').max(160),
  homes: z.enum(['1-50', '51-300', '300+']),
  email: z.string().trim().email('Please enter a valid email').max(200),
  phone: z.string().trim().max(20).optional().transform((v) => v || null),
  message: z.string().trim().max(2000).optional().transform((v) => v || null),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
})

export type DemoState = { ok: boolean; error?: string }

export async function requestDemo(_prev: DemoState, formData: FormData): Promise<DemoState> {
  const parsed = DemoRequest.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form' }
  if (!isSupabaseConfigured()) return { ok: false, error: 'The demo form is not connected yet. Please email us instead.' }

  const { website: _honeypot, ...row } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('demo_requests').insert(row)
  if (error) return { ok: false, error: 'Something went wrong. Please try again or email us.' }
  return { ok: true }
}
