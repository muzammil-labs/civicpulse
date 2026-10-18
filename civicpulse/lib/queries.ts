import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Block, Category } from '@/lib/types'

export async function getCategories(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase
    .from('issue_categories')
    .select('id, key, label, icon, default_sla_hours, sort, active')
    .eq('org_id', orgId)
    .order('sort')
  return (data ?? []) as Category[]
}

export async function getBlocks(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase.from('blocks').select('id, name, sort').eq('org_id', orgId).order('sort')
  return (data ?? []) as Block[]
}

export type Person = { profile_id: string; display_name: string; role: string; title: string | null }

export async function getPeople(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase.rpc('org_people', { p_org: orgId })
  return new Map(((data ?? []) as Person[]).map((p) => [p.profile_id, p]))
}

export const ISSUE_LIST_COLUMNS =
  'id, ref_no, title, status, urgency, category_id, block_id, created_at, sla_due_at, assignee_id, visibility, created_by, issue_followers(count)'

export type IssueListRow = {
  id: string
  ref_no: number
  title: string
  status: import('@/lib/types').IssueStatus
  urgency: import('@/lib/types').IssueUrgency
  category_id: string | null
  block_id: string | null
  created_at: string
  sla_due_at: string | null
  assignee_id: string | null
  visibility: 'community' | 'private'
  created_by: string
  issue_followers: { count: number }[]
}
