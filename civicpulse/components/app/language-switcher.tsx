'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { LOCALE_NAMES, LOCALES, type AppLocale } from '@/lib/i18n/messages'
import { setLanguage } from '@/app/app/actions'

export function LanguageSwitcher({ locale }: { locale: AppLocale }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-subtle hover:bg-stone-100">
      <Languages className="size-4" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => start(async () => { await setLanguage(e.target.value); router.refresh() })}
        className="cursor-pointer appearance-none bg-transparent pr-1 text-sm text-text outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </label>
  )
}
