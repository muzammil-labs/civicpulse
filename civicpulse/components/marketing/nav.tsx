import Link from 'next/link'
import { Logo } from '@/components/app/logo'

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/civic', label: 'Civic mode' },
]

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-subtle md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-text">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-white sm:inline-block">
            Sign in
          </Link>
          <Link
            href="/demo"
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  )
}
