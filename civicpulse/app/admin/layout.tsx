import { ClipboardList, Megaphone, Settings, Smartphone, Users } from 'lucide-react'
import { Logo } from '@/components/app/logo'
import { NavLink } from '@/components/app/nav-link'
import { DemoBanner } from '@/components/app/demo-banner'
import { requireManager } from '@/lib/session'

const NAV = [
  { href: '/admin', label: 'Queue', icon: ClipboardList, exact: true },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/notices', label: 'Notices', icon: Megaphone },
  { href: '/admin/setup', label: 'Setup', icon: Settings },
]

// Committee console: desktop-first, still usable on a phone.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { org, profile, memberships } = await requireManager()
  const title = memberships.find((m) => m.org_id === org.id && m.title)?.title

  return (
    <div className="min-h-screen bg-canvas text-text">
      {org.is_demo && <DemoBanner />}
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white px-3 py-5 lg:flex">
          <Logo href="/admin" className="px-2" />
          <div className="mt-5 rounded-xl bg-canvas px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{org.name}</p>
            <p className="truncate text-xs text-subtle">{profile?.full_name ?? 'Committee'}{title ? ` · ${title}` : ''}</p>
          </div>
          <nav aria-label="Committee" className="mt-5 space-y-1">
            {NAV.map((n) => (
              <NavLink key={n.href} href={n.href} exact={n.exact} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-subtle hover:bg-stone-100" activeClassName="bg-brand-soft text-brand font-medium">
                <n.icon className="size-4" /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-1">
            <NavLink href="/app" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-subtle hover:bg-stone-100">
              <Smartphone className="size-4" /> Resident view
            </NavLink>
            <form action="/auth/signout" method="post">
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-subtle hover:bg-stone-100">Sign out</button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <Logo href="/admin" />
            <nav aria-label="Committee" className="flex gap-1 overflow-x-auto">
              {NAV.map((n) => (
                <NavLink key={n.href} href={n.href} exact={n.exact} className="rounded-lg p-2 text-subtle" activeClassName="bg-brand-soft text-brand">
                  <n.icon className="size-5" aria-label={n.label} />
                </NavLink>
              ))}
            </nav>
          </header>
          <main className="px-4 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
