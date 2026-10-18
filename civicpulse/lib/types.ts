// Row shapes for the tables the app reads. They mirror supabase/migrations/*.sql.

export type MemberRole =
  | 'org_admin' | 'committee' | 'finance' | 'facility_manager'
  | 'staff' | 'vendor' | 'guard' | 'resident_owner' | 'resident_tenant'

export type MemberStatus = 'pending' | 'active' | 'revoked'

export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'rejected'
export type IssueUrgency = 'low' | 'medium' | 'high' | 'critical'
export type Locale = 'en' | 'te' | 'hi'

export interface Org {
  id: string
  name: string
  slug: string
  city: string
  plan: string
  status: 'active' | 'read_only' | 'suspended'
  is_demo: boolean
  settings: { require_after_photo?: boolean }
}

export interface Membership {
  id: string
  org_id: string
  role: MemberRole
  status: MemberStatus
  title: string | null
  orgs: Org
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  locale: Locale
}

export interface Category {
  id: string
  key: string
  label: Partial<Record<Locale, string>> & { en: string }
  icon: string | null
  default_sla_hours: number
  sort: number
  active: boolean
}

export interface Block {
  id: string
  name: string
  sort: number
}

export interface Issue {
  id: string
  org_id: string
  ref_no: number
  category_id: string | null
  block_id: string | null
  unit_id: string | null
  location_text: string | null
  title: string
  description: string | null
  urgency: IssueUrgency
  status: IssueStatus
  visibility: 'community' | 'private'
  assignee_id: string | null
  sla_due_at: string | null
  duplicate_of: string | null
  source: string
  ai_meta: { source?: 'ai' | 'rules' } & Record<string, unknown> | null
  resolution_note: string | null
  rating: number | null
  rating_comment: string | null
  created_by: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface IssueEvent {
  id: number
  issue_id: string
  actor_id: string | null
  type: 'created' | 'status_changed' | 'assigned' | 'comment' | 'merged' | 'media_added' | 'rated' | 'escalated'
  from_status: IssueStatus | null
  to_status: IssueStatus | null
  body: string | null
  internal: boolean
  payload: Record<string, unknown> | null
  created_at: string
}

export interface IssueMedia {
  id: string
  issue_id: string
  kind: 'before' | 'after' | 'attachment'
  storage_path: string
  created_at: string
}

export interface Notice {
  id: string
  title: string
  body: string
  priority: 'normal' | 'urgent'
  published_at: string
}

export const OPEN_STATUSES: IssueStatus[] = ['open', 'assigned', 'in_progress', 'on_hold']
export const MANAGER_ROLES: MemberRole[] = ['org_admin', 'committee', 'facility_manager']
