import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = { title: 'Terms' }

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Draft terms — under legal review before public launch.
      </p>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Terms of service</h1>
      <h2>The service</h2>
      <p>{brand.name} provides software for residential communities to report, track and resolve maintenance issues and share notices.</p>
      <h2>Accounts</h2>
      <ul>
        <li>Societies are represented by their registered association. Committee members act on its behalf.</li>
        <li>You are responsible for what you post. Do not post anything unlawful, abusive or someone else’s private information.</li>
      </ul>
      <h2>Plans, billing and cancellation</h2>
      <ul>
        <li>Paid plans are billed per home, yearly or monthly, plus applicable GST.</li>
        <li>Annual plans can be refunded pro-rata within the first 30 days.</li>
        <li>If a payment is more than 30 days late, the account becomes read-only. Data is never deleted for non-payment and can always be exported.</li>
      </ul>
      <h2>Availability</h2>
      <p>We work hard to keep the service available but cannot guarantee it will be uninterrupted. Emergencies should always also be reported to security directly.</p>
      <h2>Contact</h2>
      <p><a className="text-brand underline" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a></p>
    </article>
  )
}
