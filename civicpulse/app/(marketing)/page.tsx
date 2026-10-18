import Link from 'next/link'
import {
  BarChart3, Bell, Camera, CheckCircle2, ClipboardList, Copy, FileText, Languages,
  MessageCircle, ShieldCheck, Timer, Users, Wrench,
} from 'lucide-react'
import { BeforeAfter } from '@/components/marketing/before-after'
import { brand } from '@/lib/brand'

const STEPS = [
  {
    icon: Camera,
    title: 'Residents snap a photo',
    body: 'No forms and no category to guess. AI suggests what it is and where — in English, Telugu or Hindi. The resident just confirms.',
  },
  {
    icon: Copy,
    title: 'Duplicates merge, the right person gets it',
    body: 'Three people reporting the same lift is one issue with three followers. It goes straight to the plumber, electrician or vendor responsible.',
  },
  {
    icon: CheckCircle2,
    title: 'Fixed — with proof',
    body: 'An issue can only be closed with an “after” photo. Everyone affected is told automatically. Nobody has to ask “any update?”.',
  },
]

const FEATURES = [
  { icon: ClipboardList, title: 'One clear queue', body: 'Open, overdue and urgent issues first. Assign in one tap. No more scrolling through 200 messages.' },
  { icon: Timer, title: 'Deadlines that escalate', body: 'Every category has a target time — 4 hours for a stuck lift, 24 hours for a leak. Overdue issues are flagged before residents complain.' },
  { icon: Wrench, title: 'Staff & vendor app', body: 'Electricians and plumbers see their jobs, update status, and attach the after-photo from their phone.' },
  { icon: Bell, title: 'Residents hear back', body: 'Every status change reaches the people affected — in the app now, on WhatsApp next.' },
  { icon: Languages, title: 'Telugu, Hindi, English', body: 'Residents use it in the language they are comfortable with. Committees see everything in one place.' },
  { icon: BarChart3, title: 'Numbers for the AGM', body: 'Resolution times, repeat problems, slow vendors. Bring facts to the meeting instead of opinions.' },
  { icon: Users, title: 'Built for committee changes', body: 'History, vendors and decisions stay with the society — not in a past secretary’s phone.' },
  { icon: ShieldCheck, title: 'Private by design', body: 'Each society’s data is isolated at the database level. Phone numbers are never shown to other residents.' },
  { icon: FileText, title: 'Notices with read receipts', body: 'Water shutdowns and meeting notices reach every resident — and you can see who has read them.' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 size-[36rem] rounded-full bg-brand-soft blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand ring-1 ring-line">
              For gated communities &amp; RWAs · Launching in {brand.city}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-text sm:text-5xl md:text-6xl">
              End the WhatsApp group chaos.
              <span className="block text-brand">Get issues actually fixed.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-subtle">
              Residents report with a photo. The committee gets one prioritised queue, staff close jobs with
              proof, and everyone affected hears back automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login?demo=1" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong">
                Try the live demo
              </Link>
              <Link href="/demo" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-text ring-1 ring-line transition-colors hover:bg-stone-50">
                Book a walkthrough
              </Link>
            </div>
            <p className="mt-4 text-sm text-subtle">No app to install. Works in any phone browser.</p>
          </div>

          {/* Product preview */}
          <div className="relative">
            <div className="rounded-[2rem] border border-line bg-white p-4 shadow-2xl shadow-stone-900/10 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-subtle">Today&apos;s queue</p>
                  <p className="font-semibold">Sunrise Enclave</p>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">2 overdue</span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {[
                  ['🛗', 'Lift stuck between 4th & 5th floor', 'Tower B · 3 residents affected', 'Emergency', 'bg-red-50 text-red-700'],
                  ['💧', 'No water on floors 8–10', 'Tower A · assigned to plumber', 'Assigned', 'bg-violet-50 text-violet-800'],
                  ['🧹', 'Garbage near visitor parking', 'Common area · 20 h ago', 'Open', 'bg-sky-50 text-sky-800'],
                  ['💡', 'Corridor lights flickering', 'Tower C · fixed with photo', 'Resolved', 'bg-emerald-50 text-emerald-800'],
                ].map(([icon, title, meta, tag, tone]) => (
                  <li key={title} className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
                    <span className="text-lg" aria-hidden>{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{title}</p>
                      <p className="truncate text-xs text-subtle">{meta}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{tag}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-line sm:block">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MessageCircle className="size-4 text-emerald-600" /> “Your lift issue #1 is now in progress”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Same week. Completely different Sunday.</h2>
            <p className="mt-3 text-subtle">Drag the handle to see what your committee deals with now — and what it looks like after.</p>
          </div>
          <div className="mt-10">
            <BeforeAfter />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-brand">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">From “this is broken” to “someone’s on it” — without anyone chasing.</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-3xl bg-white p-6 ring-1 ring-line">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><s.icon className="size-5" /></span>
                  <span className="text-sm font-semibold text-subtle">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-subtle">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-brand">Features</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">Everything your committee has been wishing for.</h2>
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <f.icon className="size-6 text-brand" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-subtle">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 rounded-2xl bg-canvas p-5 text-sm text-subtle ring-1 ring-line">
            <span className="font-semibold text-text">Coming next:</span> maintenance billing with online and UPI collection straight
            into the society’s bank account, vendor &amp; AMC tracking, amenity booking, polls, and visitor management.
          </p>
        </div>
      </section>

      {/* Founding societies offer — honest social proof until we have real customers */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-[2rem] bg-brand px-6 py-12 text-center text-white sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/70">Founding societies · {brand.city}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Be one of our first 10 communities.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              3 months free, then 50% off for the first year. We set everything up with your committee in person and
              build the next features with you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/demo" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-brand-soft">
                Apply as a founding society
              </Link>
              <Link href="/pricing" className="rounded-xl px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/10">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Civic mode */}
      <section className="border-t border-line bg-white py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-brand">Outside the gate?</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{brand.civicName} — report roads, streetlights and drains in your city.</h2>
            <p className="mt-2 max-w-2xl text-sm text-subtle">Our civic mode turns a photo and a location into a routed report for the right public department.</p>
          </div>
          <Link href="/civic" className="shrink-0 rounded-xl bg-text px-5 py-3 text-sm font-semibold text-white hover:bg-black">
            Open civic mode
          </Link>
        </div>
      </section>
    </>
  )
}
