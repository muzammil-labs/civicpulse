import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { ruleBasedTriage, triageIssue } from '@/lib/ai/triage'
import { rateLimit } from '@/lib/rate-limit'

const Body = z.object({
  orgId: z.string().uuid(),
  imageBase64: z.string().max(4_000_000).optional(), // ~3 MB image after base64
  text: z.string().max(1000).optional(),
  locale: z.enum(['en', 'te', 'hi']).default('en'),
})

const MONTHLY_FREE_PLAN_AI_CALLS = 30

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { orgId, imageBase64, text, locale } = parsed.data

  const limited = rateLimit(`triage:${user.id}`, 8, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } })
  }

  // Membership check (RLS returns nothing for societies the user is not part of).
  const [{ data: org }, { data: cats }] = await Promise.all([
    supabase.from('orgs').select('id, plan, is_demo').eq('id', orgId).single(),
    supabase.from('issue_categories').select('key').eq('org_id', orgId).eq('active', true),
  ])
  if (!org) return NextResponse.json({ error: 'Not a member of this society' }, { status: 403 })

  // Metering: count AI calls per society per month; enforce the free plan's quota.
  const admin = createAdminClient()
  const period = new Date().toISOString().slice(0, 7) + '-01'
  let useAi = Boolean(imageBase64 || text)
  if (admin && !org.is_demo) {
    const { data: usage } = await admin.from('usage_counters').select('ai_calls').eq('org_id', orgId).eq('period', period).maybeSingle()
    const used = usage?.ai_calls ?? 0
    if (org.plan === 'free' && used >= MONTHLY_FREE_PLAN_AI_CALLS) useAi = false
    else await admin.from('usage_counters').upsert({ org_id: orgId, period, ai_calls: used + 1 }, { onConflict: 'org_id,period' })
  }

  // The shared demo gets a daily ceiling so public visitors cannot run up the AI bill.
  if (org.is_demo && !rateLimit('triage:demo', 300, 86_400_000).ok) useAi = false

  const categoryKeys = (cats ?? []).map((c) => c.key as string)
  const result = useAi
    ? await triageIssue({ imageBase64, text, locale, categoryKeys })
    : ruleBasedTriage(text ?? '', categoryKeys)
  return NextResponse.json(result)
}
