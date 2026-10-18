import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = { title: 'Privacy notice' }

// Draft written for India's Digital Personal Data Protection Act, 2023. Have a lawyer review before launch.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Draft notice — under legal review before public launch.
      </p>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="text-subtle">Last updated: 18 October 2026 · Notice version 2026-10</p>

      <h2>What we collect, and why</h2>
      <ul>
        <li><strong>Your name, phone number or email</strong> — to sign you in and tell you about your issues.</li>
        <li><strong>Your flat and society</strong> — so your committee can confirm you live there.</li>
        <li><strong>Issues you report</strong> — the text, photos and location in the society you add, so they can be fixed.</li>
        <li><strong>Basic technical data</strong> — such as error logs, to keep the service secure and working.</li>
      </ul>
      <p>We do not collect Aadhaar numbers, and we do not sell personal data or show advertising.</p>

      <h2>Who can see what</h2>
      <ul>
        <li>Other residents see community issues, but never your phone number or email.</li>
        <li>Your society’s committee and the staff assigned to an issue can see the details they need to fix it.</li>
        <li>Issues you mark as private are visible only to you, the committee and the assigned staff.</li>
      </ul>

      <h2>Photos and AI</h2>
      <p>
        When you add a photo, it may be sent to an AI service to suggest a category. Please avoid capturing faces or vehicle
        number plates. Photos are re-saved without location metadata and stored privately.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see and correct your information, withdraw consent for optional messages, or ask us to delete your account at any
        time. Some records (for example, issues your society needs for its own records) may be kept by your society as allowed by law.
      </p>

      <h2>Contact and grievances</h2>
      <p>Write to <a className="text-brand underline" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>. We reply within 7 days.</p>
    </article>
  )
}
