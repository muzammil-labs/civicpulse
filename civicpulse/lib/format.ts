// Small, dependency-free formatting helpers (Indian locale, IST).

const rtf = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' })

export function timeAgo(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

export function dueLabel(iso: string | null, now = Date.now()) {
  if (!iso) return null
  const ms = new Date(iso).getTime() - now
  const hours = Math.round(Math.abs(ms) / 3_600_000)
  const span = hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`
  return ms < 0 ? { overdue: true, text: `${span} overdue` } : { overdue: false, text: `due in ${span}` }
}
