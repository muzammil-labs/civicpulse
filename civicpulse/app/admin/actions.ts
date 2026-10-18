'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireManager } from '@/lib/session'
import type { MemberRole } from '@/lib/types'

type Result = { ok: boolean; error?: string; message?: string }

export async function mergeIssue(duplicateId: string, intoId: string): Promise<Result> {
  const { supabase } = await requireManager()
  const { error } = await supabase.rpc('merge_issue', { p_duplicate: duplicateId, p_into: intoId })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  revalidatePath(`/admin/issues/${duplicateId}`)
  revalidatePath(`/admin/issues/${intoId}`)
  return { ok: true }
}

export async function reviewMember(membershipId: string, approve: boolean): Promise<Result> {
  const { supabase } = await requireManager()
  const { error } = await supabase.rpc('review_member', { p_membership: membershipId, p_approve: approve })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/members')
  return { ok: true }
}

const INVITE_ROLES = ['resident_owner', 'staff', 'committee', 'facility_manager'] as const

export async function createInvite(role: string, autoApprove: boolean): Promise<Result> {
  if (!(INVITE_ROLES as readonly string[]).includes(role)) return { ok: false, error: 'Unknown role' }
  const { supabase, org, user, roles } = await requireManager()
  if ((role === 'committee' || role === 'facility_manager') && !roles.includes('org_admin')) {
    return { ok: false, error: 'Only the society admin can invite committee members.' }
  }
  const { error } = await supabase.from('org_invites').insert({
    org_id: org.id,
    role: role as MemberRole,
    auto_approve: autoApprove,
    created_by: user.id,
    max_uses: role === 'resident_owner' ? null : 5,
    expires_at: role === 'resident_owner' ? null : new Date(Date.now() + 14 * 86_400_000).toISOString(),
  })
  if (error) return { ok: false, error: 'Could not create the invite.' }
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function deleteInvite(inviteId: string): Promise<Result> {
  const { supabase, org } = await requireManager()
  await supabase.from('org_invites').delete().eq('id', inviteId).eq('org_id', org.id)
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function revokeMember(membershipId: string): Promise<Result> {
  const { supabase, org, user } = await requireManager()
  const { data, error } = await supabase
    .from('memberships')
    .update({ status: 'revoked' })
    .eq('id', membershipId)
    .eq('org_id', org.id)
    .neq('profile_id', user.id)
    .select('id')
  if (error || !data?.length) return { ok: false, error: 'Only the society admin can remove members.' }
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function addBlocks(raw: string): Promise<Result> {
  const names = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 100)
  if (!names.length) return { ok: false, error: 'Enter at least one tower or block name.' }
  const { supabase, org } = await requireManager()
  const { count } = await supabase.from('blocks').select('id', { count: 'exact', head: true }).eq('org_id', org.id)
  const { error } = await supabase
    .from('blocks')
    .upsert(names.map((name, i) => ({ org_id: org.id, name, sort: (count ?? 0) + i + 1 })), { onConflict: 'org_id,name', ignoreDuplicates: true })
  if (error) return { ok: false, error: 'Could not save the towers.' }
  revalidatePath('/admin/setup')
  return { ok: true }
}

// Paste from a spreadsheet: Tower, Flat, Floor, Area (sq ft). Header row optional.
export async function importUnits(csv: string): Promise<Result> {
  const { supabase, org } = await requireManager()
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length > 5000) return { ok: false, error: 'Import at most 5,000 flats at a time.' }
  const rows = lines
    .map((l) => l.split(/[,\t]/).map((c) => c.trim()))
    .filter((cols) => cols[1] && !/^flat|^unit/i.test(cols[1]))

  if (!rows.length) return { ok: false, error: 'No flats found. Use: Tower, Flat, Floor, Area' }

  const blockNames = [...new Set(rows.map((r) => r[0]).filter(Boolean))]
  if (blockNames.length) {
    await supabase.from('blocks').upsert(blockNames.map((name, i) => ({ org_id: org.id, name, sort: i + 1 })), { onConflict: 'org_id,name', ignoreDuplicates: true })
  }
  const { data: blocks } = await supabase.from('blocks').select('id, name').eq('org_id', org.id)
  const blockId = new Map((blocks ?? []).map((b) => [b.name as string, b.id as string]))

  const units = rows.map((r) => ({
    org_id: org.id,
    block_id: r[0] ? blockId.get(r[0]) ?? null : null,
    number: r[1].slice(0, 30),
    floor: Number.isFinite(Number(r[2])) && r[2] !== '' ? Math.trunc(Number(r[2])) : null,
    area_sqft: Number(r[3]) > 0 ? Number(r[3]) : null,
  }))
  const { error } = await supabase.from('units').upsert(units, { onConflict: 'org_id,block_id,number', ignoreDuplicates: true })
  if (error) return { ok: false, error: 'Import failed. Check the format: Tower, Flat, Floor, Area' }
  revalidatePath('/admin/setup')
  return { ok: true, message: `Imported ${units.length} flats.` }
}

const CategoryPatch = z.object({
  default_sla_hours: z.number().int().min(1).max(2160).optional(),
  active: z.boolean().optional(),
  default_assignee_id: z.string().uuid().nullable().optional(),
})

export async function updateCategory(categoryId: string, patch: z.input<typeof CategoryPatch>): Promise<Result> {
  const parsed = CategoryPatch.safeParse(patch)
  if (!parsed.success) return { ok: false, error: 'Invalid value' }
  const { supabase, org } = await requireManager()
  const { error } = await supabase.from('issue_categories').update(parsed.data).eq('id', categoryId).eq('org_id', org.id)
  if (error) return { ok: false, error: 'Could not save.' }
  revalidatePath('/admin/setup')
  return { ok: true }
}

export async function setRequireAfterPhoto(value: boolean): Promise<Result> {
  const { supabase, org } = await requireManager()
  const { data, error } = await supabase
    .from('orgs')
    .update({ settings: { ...org.settings, require_after_photo: value } })
    .eq('id', org.id)
    .select('id')
  if (error || !data?.length) return { ok: false, error: 'Only the society admin can change this.' }
  revalidatePath('/admin/setup')
  return { ok: true }
}

const NoticeInput = z.object({
  title: z.string().trim().min(3, 'Add a title').max(140),
  body: z.string().trim().min(1, 'Write the notice').max(8000),
  priority: z.enum(['normal', 'urgent']),
})

export async function publishNotice(input: z.input<typeof NoticeInput>): Promise<Result> {
  const parsed = NoticeInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
  const { supabase, org, user } = await requireManager()
  const { error } = await supabase.from('notices').insert({ ...parsed.data, org_id: org.id, created_by: user.id })
  if (error) return { ok: false, error: 'Could not publish.' }
  revalidatePath('/admin/notices')
  revalidatePath('/app')
  revalidatePath('/app/notices')
  return { ok: true }
}

export async function deleteNotice(noticeId: string): Promise<Result> {
  const { supabase, org } = await requireManager()
  await supabase.from('notices').delete().eq('id', noticeId).eq('org_id', org.id)
  revalidatePath('/admin/notices')
  return { ok: true }
}
