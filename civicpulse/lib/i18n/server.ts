import 'server-only'
import { cookies } from 'next/headers'
import { getTranslator, isLocale, type AppLocale } from './messages'

export const LOCALE_COOKIE = 'locale'

// Language preference: explicit choice (cookie) first, then the profile, then English.
export async function getLocale(profileLocale?: string | null): Promise<AppLocale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie
  if (isLocale(profileLocale)) return profileLocale
  return 'en'
}

export async function getT(profileLocale?: string | null) {
  const locale = await getLocale(profileLocale)
  return { locale, t: getTranslator(locale) }
}
