import { Bell, Home, LayoutDashboard, Plus } from 'lucide-react'
import { Logo } from '@/components/app/logo'
import { LanguageSwitcher } from '@/components/app/language-switcher'
import { NavLink } from '@/components/app/nav-link'
import { DemoBanner } from '@/components/app/demo-banner'
import { requireMember } from '@/lib/session'
import { getT } from '@/lib/i18n/server'

// Resident (and staff) app: mobile-first, bottom navigation on phones.
export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const { org, profile, isManager } = await requireMember()
  const { locale, t } = await getT(profile?.locale)

  const items = [
    { href: '/app', label: t('nav.home'), icon: Home, exact: true },
    { href: '/app/report', label: t('nav.report'), icon: Plus },
    { href: '/app/notices', label: t('nav.notices'), icon: Bell },
    ...(isManager ? [{ href: '/admin', label: t('nav.committee'), icon: LayoutDashboard }] : []),
  ]

  return (
    <div className="min-h-screen bg-canvas pb-24 text-text sm:pb-10">
      {org.is_demo && <DemoBanner />}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href="/app" className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
            <span className="truncate text-sm text-subtle">{org.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              {items.map((i) => (
                <NavLink key={i.href} href={i.href} exact={i.exact} className="rounded-lg px-3 py-1.5 text-sm text-subtle hover:bg-stone-100" activeClassName="bg-brand-soft text-brand font-medium">
                  {i.label}
                </NavLink>
              ))}
            </nav>
            <LanguageSwitcher locale={locale} />
            <form action="/auth/signout" method="post">
              <button className="rounded-lg px-2 py-1.5 text-sm text-subtle hover:bg-stone-100">{t('nav.signOut')}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((i) => (
            <li key={i.href}>
              <NavLink href={i.href} exact={i.exact} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-subtle" activeClassName="text-brand font-semibold">
                <i.icon className="size-5" aria-hidden />
                {i.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
