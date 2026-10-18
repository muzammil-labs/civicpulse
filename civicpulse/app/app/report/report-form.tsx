'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Lock, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MEDIA_BUCKET } from '@/lib/supabase/config'
import { blobToBase64, compressImage } from '@/lib/image'
import { getTranslator, type AppLocale } from '@/lib/i18n/messages'
import type { Block, Category, IssueUrgency } from '@/lib/types'
import { createIssue, findSimilar, setFollowing } from '../actions'
import { cn } from '@/lib/utils'

type Similar = Awaited<ReturnType<typeof findSimilar>>[number]

const field = 'w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15'
const URGENCIES: IssueUrgency[] = ['low', 'medium', 'high', 'critical']

export function ReportForm({
  orgId,
  categories,
  blocks,
  locale,
}: {
  orgId: string
  categories: Category[]
  blocks: Block[]
  locale: AppLocale
}) {
  const t = getTranslator(locale)
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [blockId, setBlockId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationText, setLocationText] = useState('')
  const [urgency, setUrgency] = useState<IssueUrgency>('medium')
  const [isPrivate, setIsPrivate] = useState(false)
  const [aiMeta, setAiMeta] = useState<Record<string, unknown> | null>(null)

  const [similar, setSimilar] = useState<Similar[]>([])
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()

  // Look for matching open issues as the report takes shape.
  const shouldSearch = !isPrivate && (Boolean(categoryId) || title.trim().length >= 4)
  useEffect(() => {
    if (!shouldSearch) return
    const handle = setTimeout(async () => {
      setSimilar(await findSimilar({ categoryId, blockId, text: title }))
    }, 450)
    return () => clearTimeout(handle)
  }, [categoryId, blockId, title, shouldSearch])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function onPhoto(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      const blob = await compressImage(file)
      setPhoto(blob)
      setPreview(URL.createObjectURL(blob))
      setAnalyzing(true)
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, imageBase64: await blobToBase64(blob), text: title || undefined, locale }),
      })
      if (res.ok) {
        const s = await res.json()
        const cat = categories.find((c) => c.key === s.categoryKey)
        if (cat && s.confidence >= 0.3) setCategoryId(cat.id)
        if (s.title && !title) setTitle(s.title)
        if (s.description && !description) setDescription(s.description)
        if (s.locationHint && !locationText) setLocationText(s.locationHint)
        if (s.urgency) setUrgency(s.urgency)
        setAiMeta({ suggested: s, source: s.source })
        setAiUsed(s.source === 'ai')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the photo.')
    } finally {
      setAnalyzing(false)
    }
  }

  function clearPhoto() {
    setPhoto(null)
    setPreview(null)
    setAiUsed(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function meToo(id: string) {
    const res = await setFollowing(id, true)
    if (res.ok) setFollowed((prev) => new Set(prev).add(id))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startSubmit(async () => {
      const res = await createIssue({
        categoryId,
        blockId,
        title,
        description: description || null,
        locationText: locationText || null,
        urgency,
        visibility: isPrivate ? 'private' : 'community',
        aiMeta,
      })
      if (!res.ok || !res.data) return setError(res.ok ? 'Something went wrong' : res.error)

      if (photo) {
        const supabase = createClient()
        const path = `${res.data.orgId}/${res.data.id}/before-${crypto.randomUUID()}.jpg`
        const upload = await supabase.storage.from(MEDIA_BUCKET).upload(path, photo, { contentType: 'image/jpeg' })
        if (!upload.error) {
          await supabase.from('issue_media').insert({
            issue_id: res.data.id,
            org_id: res.data.orgId,
            kind: 'before',
            storage_path: path,
            mime: 'image/jpeg',
            size_bytes: photo.size,
          })
        }
      }
      router.push(`/app/issues/${res.data.id}?new=1`)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Photo */}
      <section>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
        {preview ? (
          <div className="relative overflow-hidden rounded-3xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-80 w-full object-contain" />
            <button type="button" onClick={clearPhoto} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/60 text-white" aria-label={t('report.changePhoto')}>
              <X className="size-4" />
            </button>
            {analyzing && (
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/60 px-4 py-3 text-sm text-white">
                <Loader2 className="size-4 animate-spin" /> {t('report.analyzing')}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-10 text-center transition hover:border-brand"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Camera className="size-7" /></span>
            <span className="font-semibold">{t('report.photo')}</span>
            <span className="text-sm text-subtle">{t('report.photoHint')}</span>
          </button>
        )}
        {aiUsed && !analyzing && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand"><Sparkles className="size-3.5" /> {t('report.aiSuggested')}</p>
        )}
      </section>

      {/* What */}
      <section className="space-y-2">
        <label htmlFor="title" className="text-sm font-semibold">{t('report.whatHappened')}</label>
        <input id="title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('report.whatHappenedPlaceholder')} required minLength={3} maxLength={140} />
        <textarea className={field} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('report.details')} maxLength={4000} />
      </section>

      {/* Category */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t('report.category')}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {categories.filter((c) => c.active).map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center text-xs ring-1 transition',
                categoryId === c.id ? 'bg-brand-soft font-semibold text-brand ring-2 ring-brand' : 'bg-white ring-line hover:ring-brand/40',
              )}
            >
              <span className="text-xl" aria-hidden>{c.icon}</span>
              <span className="leading-tight">{c.label[locale] ?? c.label.en}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Where */}
      <section className="space-y-2">
        <p className="text-sm font-semibold">{t('report.where')}</p>
        {blocks.length > 0 && (
          <select className={field} value={blockId ?? ''} onChange={(e) => setBlockId(e.target.value || null)} aria-label={t('report.tower')}>
            <option value="">{t('report.anyTower')}</option>
            {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <input className={field} value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder={t('report.locationPlaceholder')} maxLength={200} aria-label={t('report.location')} />
      </section>

      {/* Similar issues */}
      {shouldSearch && similar.length > 0 && (
        <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm font-medium text-amber-900">{t('report.similar')}</p>
          <ul className="mt-3 space-y-2">
            {similar.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm">
                <a href={`/app/issues/${s.id}`} className="min-w-0 flex-1 truncate hover:underline">#{s.ref_no} · {s.title}</a>
                {followed.has(s.id) ? (
                  <span className="shrink-0 text-xs font-medium text-brand">✓ {t('report.followed')}</span>
                ) : (
                  <button type="button" onClick={() => meToo(s.id)} className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200">
                    {t('report.meToo')} ({Number(s.followers) + 0})
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Urgency */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t('report.urgency')}</legend>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-stone-100 p-1">
          {URGENCIES.map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={urgency === u}
              onClick={() => setUrgency(u)}
              className={cn('rounded-lg py-2 text-xs font-medium transition sm:text-sm', urgency === u ? (u === 'critical' ? 'bg-red-600 text-white' : 'bg-white shadow-sm') : 'text-subtle')}
            >
              {t(`urgency.${u}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-line">
        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-0.5 size-4 accent-brand" />
        <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-subtle" /> {t('report.private')}</span>
      </label>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <button disabled={submitting || analyzing || title.trim().length < 3} className="sticky bottom-20 w-full rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-strong disabled:opacity-50 sm:bottom-4">
        {submitting ? t('report.submitting') : t('report.submit')}
      </button>
    </form>
  )
}
