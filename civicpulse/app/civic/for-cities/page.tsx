"use client"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { motion } from "framer-motion"

const CAPABILITIES = [
  {
    icon: "⚡",
    metric: "< 2 sec",
    title: "Instant Classification",
    body: "AI identifies issue type from photo alone",
    color: "#5BBFBF",
  },
  {
    icon: "🏛️",
    metric: "14 depts",
    title: "Smart Routing",
    body: "Reports reach the right team automatically",
    color: "#D4AF37",
  },
  {
    icon: "🔄",
    metric: "200m radius",
    title: "Zero Duplicates",
    body: "Same issue reported once, not 47 times",
    color: "#C9A84C",
  },
  {
    icon: "📊",
    metric: "5-level",
    title: "Severity Scoring",
    body: "AI + live search = accurate urgency ranking",
    color: "#E8957A",
  },
  {
    icon: "✅",
    metric: "Full chain",
    title: "Resolution Tracking",
    body: "From report to resolved, every step visible",
    color: "#22c55e",
  },
  {
    icon: "🔌",
    metric: "REST",
    title: "Open API",
    body: "Integrate with any existing 311 or civic system",
    color: "#7BCFCF",
  },
]

const PIPELINE_STEPS = [
  { num: "01", label: "Citizen photographs the issue", sub: "No form. No category selection. Just the photo." },
  { num: "02", label: "Gemini classifies the issue", sub: "Category, severity estimate, duplicate check within 200m." },
  { num: "03", label: "Live search grounds the severity", sub: "Real department SLAs pulled from the web, not a static database." },
  { num: "04", label: "Report routed with escalation chain", sub: "Municipal Corporation, Water Board, Electrical — correct department, every time." },
]

export default function ForCitiesPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Navbar />

      {/* Hero — ivory with soft orbs */}
      <section
        className="relative overflow-hidden bg-white"
        style={{ borderBottom: '1px solid #E8E4DB' }}
      >
        {/* Ambient orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 h-[36rem] w-[36rem] rounded-full opacity-[0.25] blur-3xl"
          style={{ background: 'radial-gradient(circle, #5BBFBF, transparent 70%)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute left-0 bottom-16 h-80 w-80 rounded-full opacity-[0.20] blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent 70%)' }} />

        <div className="mx-auto max-w-5xl px-5 pb-36 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BBFBF] glow-pulse" />
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#5BBFBF]">For Municipal Corporations</p>
            </div>
            <h1 className="font-display text-5xl md:text-[64px] font-light leading-[1.05] tracking-tight text-[#1A1208] text-balance">
              Give your city a nervous system.
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-xl leading-relaxed text-[#7A6A58]">
              Real-time visibility into every reported infrastructure failure.
              Routed, tracked, resolved.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="mailto:contact@civicpulse.in"
                className="shimmer-btn magnetic-btn rounded-full px-8 py-3 font-sans text-sm font-medium">
                Request a Demo
              </a>
              <a href="/civic/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-[#1A1208]
                px-8 py-3 font-sans text-sm font-medium text-[#1A1208]
                hover:bg-[#1A1208] hover:text-white transition-colors">
                See Live Dashboard →
              </a>
              <a href="/civic#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DB]
                px-8 py-3 font-sans text-sm font-medium text-[#7A6A58]
                hover:bg-[#FAF7F2] transition-colors">
                How it works →
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3-column capability grid */}
      <section className="bg-white border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5BBFBF] mb-3">What cities get</p>
            <h2 className="font-display text-4xl font-light text-[#1A1208]">
              Six capabilities. One deployment.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(26,18,8,0.10)" }}
                className="rounded-2xl border border-[#E8E4DB] bg-[#FAF7F2] p-6 cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="font-display text-2xl font-light"
                    style={{ color: c.color }}>
                    {c.metric}
                  </span>
                </div>
                <h3 className="font-sans text-base font-semibold text-[#1A1208] mb-1.5">{c.title}</h3>
                <p className="font-sans text-sm leading-relaxed text-[#7A6A58]">{c.body}</p>
                {/* Bottom accent line */}
                <div className="mt-4 h-0.5 rounded-full w-8"
                  style={{ background: `linear-gradient(90deg, ${c.color}, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact stats strip */}
      <section className="bg-white border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "< 30s", label: "Photo to Routed Report" },
              { value: "14+", label: "Departments Auto-Linked" },
              { value: "4-step", label: "AI Pipeline" },
              { value: "MIT", label: "Licensed & Open Source" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="font-display text-4xl font-light text-[#5BBFBF] mb-1">{s.value}</p>
                <p className="font-mono text-xs text-[#7A6A58]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-step pipeline walkthrough */}
      <section className="bg-white border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7A6A58] mb-3">The Pipeline</p>
            <h2 className="font-display text-4xl font-light text-[#1A1208]">
              From WhatsApp photo to city hall in 4 steps.
            </h2>
          </motion.div>
          <div className="space-y-4">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-6 p-6 rounded-2xl border border-[#E8E4DB] bg-[#FAF7F2]"
              >
                <span className="font-mono text-3xl font-light text-[#5BBFBF]/40 flex-shrink-0 w-12">{step.num}</span>
                <div>
                  <p className="font-sans text-base font-semibold text-[#1A1208]">{step.label}</p>
                  <p className="font-sans text-sm text-[#7A6A58] mt-1">{step.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works CTA — light theme block */}
      <motion.a
        href="/civic#how-it-works"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="block bg-white hover:bg-[#FAF7F2] transition-colors border-b border-[#E8E4DB] group"
      >
        <div className="mx-auto max-w-5xl px-5 py-10 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5BBFBF] mb-1">Try it live</p>
            <p className="font-display text-2xl font-light text-[#1A1208]">See How It Works →</p>
          </div>
          <span className="shimmer-btn magnetic-btn rounded-full px-6 py-2.5 text-sm font-medium">
            See How It Works →
          </span>
        </div>
      </motion.a>

      {/* Contact / Partnership CTA */}
      <section className="bg-[#FAF7F2] border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5BBFBF] mb-3">Partnership</p>
              <h2 className="font-display text-4xl font-light text-[#1A1208] mb-4">
                Ready to bring CivicPulse to your city?
              </h2>
              <p className="font-sans text-base leading-relaxed text-[#7A6A58]">
                CivicPulse is open source and free to deploy. Municipal teams can be
                live in under 60 minutes with a single environment variable.
                We support Municipal Corporations, State Water Boards, and any civic body with an
                existing 311 or complaint portal.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-[#E8E4DB] bg-white p-8"
            >
              <h3 className="font-display text-xl font-light text-[#1A1208] mb-2">Get in touch</h3>
              <p className="font-sans text-sm text-[#7A6A58] mb-6">
                We respond within 24 hours to municipal partnership enquiries.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:contact@civicpulse.in?subject=Partnership Enquiry — [City Name]"
                  className="flex items-center gap-3 w-full shimmer-btn rounded-xl px-5 py-3 text-sm font-medium"
                >
                  <span>✉️</span>
                  Email us about your city
                </a>
                <a
                  href="https://github.com/muzammil-labs/civicpulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full rounded-xl border border-[#E8E4DB] px-5 py-3 text-sm font-mono text-[#1A1208] hover:bg-[#FAF7F2] transition-colors"
                >
                  <span>🐙</span>
                  View source on GitHub
                </a>
              </div>
              <p className="text-xs font-mono text-[#7A6A58] mt-4 text-center">
                contact@civicpulse.in
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
