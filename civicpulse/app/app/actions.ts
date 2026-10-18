'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireMember, ACTIVE_ORG_COOKIE } from '@/lib/session'
import { LOCALE_COOKIE } from '@/lib/i18n/server'
import { isLocale } from '@/lib/i18n/messages'

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

const NewIssue = z.object({
  categoryId: z.string().uuid().nullable(),
  blockId: z.string().uuid().nullable(),
  title: z.string().trim().min(3, 'Describe the problem in a few words').max(140),
  description: z.string().trim().max(4000).nullable(),
  locationText: z.string().trim().max(200).nullable(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  visibility: z.enum(['community', 'private']),
  aiMeta: z.record(z.string(), z.unknown()).nullable(),
})

export async function createIssue(input: z.input<typeof NewIssue>): Promise<Result<{ id: string; orgId: string }>> {
  const parsed = NewIssue.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form' }
  const { supabase, org, user } = await requireMember()
  if (org.status !== 'active') return { ok: false, error: 'Your society’s account is read-only right now.' }

  const v = parsed.data
  const { data, error } = await supabase
    .from('issues')
    .insert({
      org_id: org.id,
      category_id: v.categoryId,
      block_id: v.blockId,
      title: v.title,
      description: v.description || null,
      location_text: v.locationText || null,
      urgency: v.urgency,
      visibility: v.visibility,
      ai_meta: v.aiMeta,
      created_by: user.id,
      source: 'app',
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: 'Could not send your report. Please try again.' }
  revalidatePath('/app')
  revalidatePath('/admin')
  return { ok: true, data: { id: data.id, orgId: org.id } }
}

export async function findSimilar(input: { categoryId: string | null; blockId: string | null; text: string }) {
  const { supabase, org } = await requireMember()
  const { data } = await supabase.rpc('find_similar_issues', {
    p_org: org.id,
    p_category: input.categoryId,
    p_block: input.blockId,
    p_text: input.text.trim().length >= 4 ? input.text.trim() : null,
  })
  return (data ?? []) as { id: string; ref_no: number; title: string; status: string; followers: number }[]
}

export async function setFollowing(issueId: string, follow: boolean): Promise<Result> {
  const { supabase, user } = await requireMember()
  const { error } = follow
    ? await supabase.from('issue_followers').upsert({ issue_id: issueId, profile_id: user.id }, { ignoreDuplicates: true })
    : await supabase.from('issue_followers').delete().eq('issue_id', issueId).eq('profile_id', user.id)
  if (error) return { ok: false, error: 'Could not update. Please try again.' }
  revalidatePath(`/app/issues/${issueId}`)
  return { ok: true }
}

export async function addComment(issueId: string, body: string, internal = false): Promise<Result> {
  const text = body.trim()
  if (text.length < 1 || text.length > 4000) return { ok: false, error: 'Write a comment first.' }
  const { supabase, org, user } = await requireMember()
  const { error } = await supabase.from('issue_events').insert({
    issue_id: issueId,
    org_id: org.id,
    actor_id: user.id,
    type: 'comment',
    body: text,
    internal,
  })
  if (error) return { ok: false, error: 'Could not post your comment.' }
  revalidatePath(`/app/issues/${issueId}`)
  revalidatePath(`/admin/issues/${issueId}`)
  return { ok: true }
}

const IssueUpdate = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'rejected']).optional(),
  resolution_note: z.string().trim().max(2000).nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category_id: z.string().uuid().nullable().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  rating_comment: z.string().trim().max(1000).nullable().optional(),
})

// The database decides who may change what (see issues_before_update); this just relays it.
export async function updateIssue(issueId: string, patch: z.input<typeof IssueUpdate>): Promise<Result> {
  const parsed = IssueUpdate.safeParse(patch)
  if (!parsed.success) return { ok: false, error: 'Invalid update' }
  const { supabase } = await requireMember()
  const { data, error } = await supabase.from('issues').update(parsed.data).eq('id', issueId).select('id')
  if (error) return { ok: false, error: friendlyDbError(error.message) }
  if (!data?.length) return { ok: false, error: 'You don’t have permission to change this issue.' }
  revalidatePath(`/app/issues/${issueId}`)
  revalidatePath(`/admin/issues/${issueId}`)
  revalidatePath('/admin')
  revalidatePath('/app')
  return { ok: true }
}

export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return
  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  const { supabase, user } = await requireMember()
  await supabase.from('profiles').update({ locale }).eq('id', user.id)
  revalidatePath('/app', 'layout')
}

export async function switchOrg(orgId: string) {
  const { memberships } = await requireMember()
  if (!memberships.some((m) => m.org_id === orgId && m.status === 'active')) return
  ;(await cookies()).set(ACTIVE_ORG_COOKIE, orgId, { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 365 })
  revalidatePath('/', 'layout')
}

export async function markNoticesRead(noticeIds: string[]) {
  if (noticeIds.length === 0) return
  const { supabase, user } = await requireMember()
  await supabase
    .from('notice_reads')
    .upsert(noticeIds.slice(0, 100).map((id) => ({ notice_id: id, profile_id: user.id })), { ignoreDuplicates: true })
}

function friendlyDbError(message: string) {
  // Messages raised by our own database rules are written for people; pass them through.
  if (/after" photo|Residents|Assigned staff|reopen|rate an issue|only be edited/i.test(message)) return message
  return 'Could not save the change. Please try again.'
}
