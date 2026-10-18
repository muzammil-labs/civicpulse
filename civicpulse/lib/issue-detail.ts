import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MEDIA_BUCKET } from '@/lib/supabase/config'
import type { Issue, IssueEvent, IssueMedia } from '@/lib/types'
import type { SignedPhoto } from '@/components/app/photo-strip'

// Loads an issue with its timeline, photos (as short-lived signed URLs) and followers.
export async function getIssueDetail(supabase: SupabaseClient, issueId: string, userId: string) {
  const { data: issue } = await supabase.from('issues').select('*').eq('id', issueId).maybeSingle()
  if (!issue) return null

  const [events, media, followers, mine] = await Promise.all([
    supabase.from('issue_events').select('*').eq('issue_id', issueId).order('created_at').order('id'),
    supabase.from('issue_media').select('id, issue_id, kind, storage_path, created_at').eq('issue_id', issueId).order('created_at'),
    supabase.from('issue_followers').select('profile_id', { count: 'exact', head: true }).eq('issue_id', issueId),
    supabase.from('issue_followers').select('profile_id').eq('issue_id', issueId).eq('profile_id', userId).maybeSingle(),
  ])

  const mediaRows = (media.data ?? []) as IssueMedia[]
  let photos: SignedPhoto[] = []
  if (mediaRows.length) {
    const { data: signed } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(mediaRows.map((m) => m.storage_path), 60 * 60)
    photos = mediaRows
      .map((m, i) => ({ id: m.id, kind: m.kind, url: signed?.[i]?.signedUrl ?? '' }))
      .filter((p) => p.url)
  }

  return {
    issue: issue as Issue,
    events: (events.data ?? []) as IssueEvent[],
    photos,
    hasAfterPhoto: mediaRows.some((m) => m.kind === 'after'),
    followerCount: followers.count ?? 0,
    isFollowing: Boolean(mine.data),
  }
}
