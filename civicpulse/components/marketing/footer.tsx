import Link from 'next/link'
import { Logo } from '@/components/app/logo'
import { brand } from '@/lib/brand'

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-subtle">
            The simplest way for residents to report problems — and for committees to actually fix them.
            Built in {brand.city}.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-subtle">
            <li><Link href="/#features" className="hover:text-text">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-text">Pricing</Link></li>
            <li><Link href="/login?demo=1" className="hover:text-text">Live demo</Link></li>
            <li><Link href="/civic" className="hover:text-text">{brand.civicName} (civic mode)</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-subtle">
            <li><Link href="/demo" className="hover:text-text">Book a demo</Link></li>
            <li><Link href="/privacy" className="hover:text-text">Privacy notice</Link></li>
            <li><Link href="/terms" className="hover:text-text">Terms</Link></li>
            <li><a href={`mailto:${brand.supportEmail}`} className="hover:text-text">{brand.supportEmail}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-subtle">
        © {new Date().getFullYear()} {brand.name}. Made in {brand.city}, India.
      </div>
    </footer>
  )
}
