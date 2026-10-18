'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/session'

export type OnboardingState = { error?: string }

const CreateSociety = z.object({
  name: z.string().trim().min(2, 'Enter the society name').max(120),
  city: z.string().trim().max(60).default('Hyderabad'),
  blocks: z.string().max(2000).default(''),
  fullName: z.string().trim().min(1, 'Enter your name').max(120),
})

export async function createSociety(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const parsed = CreateSociety.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('profiles').update({ full_name: parsed.data.fullName }).eq('id', user.id)

  const blocks = parsed.data.blocks
    .split(/[,\n]/)
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 100)
  const { data: orgId, error } = await supabase.rpc('create_society', {
    p_name: parsed.data.name,
    p_city: parsed.data.city || 'Hyderabad',
    p_blocks: blocks,
  })
  if (error) return { error: error.message }

  ;(await cookies()).set(ACTIVE_ORG_COOKIE, orgId as string, { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 365 })
  redirect('/admin/setup')
}

const JoinSociety = z.object({
  code: z.string().trim().min(4, 'Enter the invite code from your committee').max(20),
  block: z.string().trim().max(60).default(''),
  unit: z.string().trim().min(1, 'Enter your flat number').max(30),
  relation: z.enum(['owner', 'tenant', 'family']).default('owner'),
  fullName: z.string().trim().min(1, 'Enter your name').max(120),
})

export async function joinSociety(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const parsed = JoinSociety.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('profiles').update({ full_name: parsed.data.fullName }).eq('id', user.id)
  const { error } = await supabase.rpc('join_society', {
    p_code: parsed.data.code,
    p_block: parsed.data.block || null,
    p_unit: parsed.data.unit,
    p_relation: parsed.data.relation,
  })
  if (error) return { error: error.message }
  redirect('/onboarding?joined=1')
}
