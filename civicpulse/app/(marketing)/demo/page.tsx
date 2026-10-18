import type { Metadata } from 'next'
import { DemoForm } from './demo-form'

export const metadata: Metadata = { title: 'Book a demo' }

export default function DemoPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">See it with your community.</h1>
          <p className="mt-4 text-subtle">
            A 20-minute walkthrough with your committee — on a call or in person anywhere in Hyderabad. We’ll show the resident
            app, the committee queue and the staff app, using your own towers and categories.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>✓ We import your flats from a spreadsheet</li>
            <li>✓ We help you set up categories, deadlines and staff</li>
            <li>✓ We print QR posters for lifts and the clubhouse</li>
          </ul>
        </div>
        <DemoForm />
      </div>
    </section>
  )
}
