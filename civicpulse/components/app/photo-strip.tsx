export type SignedPhoto = { id: string; kind: 'before' | 'after' | 'attachment'; url: string }

export function PhotoStrip({ photos, beforeLabel = 'Before', afterLabel = 'After' }: { photos: SignedPhoto[]; beforeLabel?: string; afterLabel?: string }) {
  if (photos.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((p) => (
        <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-2xl bg-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.kind === 'after' ? afterLabel : beforeLabel} className="aspect-square w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.kind === 'after' ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white'}`}>
            {p.kind === 'after' ? afterLabel : beforeLabel}
          </span>
        </a>
      ))}
    </div>
  )
}
