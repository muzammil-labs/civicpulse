import 'server-only'

// Simple in-memory sliding window. Good enough for one Cloud Run instance; move to
// Postgres or Redis when running several instances.
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return { ok: false as const, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) }
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 10_000) hits.clear()
  return { ok: true as const }
}
