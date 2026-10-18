import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata: Metadata = { title: 'Pricing' }

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    unit: 'up to 50 homes',
    blurb: 'For small societies trying it out.',
    features: ['Issue reporting with photos', 'Committee queue', 'Notices', '30 AI photo checks a month', 'English, Telugu, Hindi'],
    cta: 'Start free',
    href: '/login',
  },
  {
    name: 'Community',
    price: '₹6',
    unit: 'per home / month · min ₹1,200',
    blurb: 'For communities that want issues resolved, not just recorded.',
    features: [
      'Everything in Free',
      'Unlimited AI photo checks',
      'Deadlines and automatic escalation',
      'Staff & vendor app with proof-of-fix',
      'Duplicate merging',
      'WhatsApp updates (fair use)',
      'Monthly committee report',
    ],
    cta: 'Book a demo',
    href: '/demo',
    featured: true,
  },
  {
    name: 'Community + Finance',
    price: '₹10',
    unit: 'per home / month · min ₹2,500',
    blurb: 'Adds maintenance billing and transparent books.',
    features: [
      'Everything in Community',
      'Maintenance billing & receipts',
      'Online + UPI collection into the society’s own account',
      'Expenses and AGM financial pack',
      'Vendor & AMC tracking',
      'Priority support',
    ],
    cta: 'Join the waitlist',
    href: '/demo',
    soon: true,
  },
]

export default function PricingPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Simple pricing, per home.</h1>
          <p className="mt-3 text-subtle">
            Pay yearly and get 2 months free. Prices exclude GST. Cancel any time — your data always stays exportable.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-3xl bg-white p-7 ring-1 ${p.featured ? 'ring-2 ring-brand shadow-xl shadow-brand/10' : 'ring-line'}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {p.featured && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">Most popular</span>}
                {p.soon && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">Coming soon</span>}
              </div>
              <p className="mt-4">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
              </p>
              <p className="mt-1 text-sm text-subtle">{p.unit}</p>
              <p className="mt-4 text-sm text-subtle">{p.blurb}</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-8 rounded-xl px-4 py-3 text-center text-sm font-semibold ${p.featured ? 'bg-brand text-white hover:bg-brand-strong' : 'bg-canvas text-text ring-1 ring-line hover:bg-stone-100'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-3xl bg-white p-7 ring-1 ring-line">
          <h2 className="font-semibold">Large townships and facility-management companies</h2>
          <p className="mt-2 text-sm text-subtle">
            Managing several communities, or more than 1,000 homes? We offer one login across all your sites, a branded WhatsApp
            number and on-site onboarding. <Link href="/demo" className="font-medium text-brand underline-offset-4 hover:underline">Talk to us</Link>.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-subtle">
          Founding societies in Hyderabad: 3 months free, then 50% off the first year.
        </p>
      </div>
    </section>
  )
}
