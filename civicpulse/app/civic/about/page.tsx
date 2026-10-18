"use client"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { motion } from "framer-motion"

const INTELLIGENCE_LAYER = [
  {
    name: "Gemini 2.5 Flash",
    capability: "Classifies any civic issue from a photo in under 2 seconds — pothole, burst pipe, broken streetlight — without a single form field filled.",
    badge: "Vision AI",
    color: "#5BBFBF",
  },
  {
    name: "Google Search Grounding",
    capability: "Pulls live SLA data, backlog reports, and department-specific policies before assigning urgency. Real web data, not training data.",
    badge: "Live Context",
    color: "#D4AF37",
  },
  {
    name: "URL Context Tool",
    capability: "Reads official department policy pages and city by-laws to route the report to the correct regulatory body with the right citation.",
    badge: "Policy Lookup",
    color: "#C9A84C",
  },
  {
    name: "Nominatim OSM",
    capability: "Free, privacy-respecting geocoding that resolves neighborhood names, street intersections, and GPS coordinates into actionable location data.",
    badge: "Geocoding",
    color: "#5BBFBF",
  },
  {
    name: "Leaflet + Clustering",
    capability: "Renders hundreds of live reports on a map with cluster grouping, heatmap overlay, and a full status timeline per pin.",
    badge: "Live Map",
    color: "#E8957A",
  },
  {
    name: "Next.js 16 + TypeScript",
    capability: "Streaming SSE responses mean AI pipeline steps appear in real time — no waiting for the full analysis to complete before showing progress.",
    badge: "Streaming UI",
    color: "#7BCFCF",
  },
  {
    name: "Framer Motion",
    capability: "Spring-physics animations and blur-reveal transitions make the AI reasoning process feel alive — not a loading spinner.",
    badge: "Motion",
    color: "#D4AF37",
  },
  {
    name: "Cloud Run",
    capability: "Zero cold-start serverless deployment. Any city's team can go from GitHub clone to live URL in under 60 minutes with one environment variable.",
    badge: "Zero Config",
    color: "#22c55e",
  },
]

const APPROACH_BULLETS = [
  "AI reasoning over static forms — Gemini reads the photo, you confirm the report",
  "Live search grounding — severity scores reference real department SLAs, not guesses",
  "Full escalation chains — a 4/5 severity report auto-escalates to the MD, not just the ward office",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Navbar />

      {/* Hero — light theme with soft orbs */}
      <section
        className="relative overflow-hidden bg-white"
        style={{ borderBottom: '1px solid #E8E4DB' }}
      >
        {/* Ambient orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full opacity-[0.25] blur-3xl"
          style={{ background: 'radial-gradient(circle, #5BBFBF, transparent 70%)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-20 h-72 w-72 rounded-full opacity-[0.20] blur-3xl"
          style={{ background: 'radial-gradient(circle, #E8957A, transparent 70%)' }} />

        <div className="mx-auto max-w-4xl px-5 pb-32 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BBFBF] glow-pulse" />
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#5BBFBF]">The Project</p>
            </div>
            <h1 className="font-display text-5xl md:text-[60px] font-light leading-[1.05] tracking-tight text-[#1A1208]">
              Built for the city that never stops breaking.
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-[#7A6A58]">
              CivicPulse started with a simple observation: India's residents have
              smartphones, but their complaints about infrastructure still disappear into
              WhatsApp groups and ignored emails.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution two-column */}
      <section className="border-b border-[#E8E4DB] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-start">

            {/* Left: The Problem */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#E8957A] mb-4">The Problem</p>
              <h2 className="font-display text-4xl font-light text-[#1A1208] mb-6">
                Too many civic complaints stall between filing and fixing.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#3D2E1A]">
                Complaints often reach the wrong department, get filed twice, or
                sit without an owner. Nobody can see what happened next.
              </p>
              <p className="mt-4 text-xs font-mono text-[#7A6A58]">
                The bottleneck is routing, not intent. Citizens care. The system fails them.
              </p>
            </motion.div>

            {/* Right: Our Approach */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5BBFBF] mb-4">Our Approach</p>
              <h2 className="font-display text-4xl font-light text-[#1A1208] mb-6">
                One photo. Four AI steps. Zero wrong departments.
              </h2>
              <div className="space-y-4 mt-8">
                {APPROACH_BULLETS.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#5BBFBF]/15 text-[#5BBFBF] text-xs font-bold">✓</span>
                    <p className="font-sans text-sm leading-relaxed text-[#3D2E1A]">{b}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact stats strip */}
      <section className="bg-white border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "< 30s", label: "Photo to routed report" },
              { value: "4", label: "AI pipeline steps" },
              { value: "14+", label: "Departments supported" },
              { value: "72h", label: "Built in" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="font-display text-4xl font-light text-[#5BBFBF] mb-1">{stat.value}</p>
                <p className="font-mono text-xs text-[#7A6A58]">{stat.label}</p>
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
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5BBFBF] mb-1">See the pipeline</p>
            <p className="font-display text-2xl font-light text-[#1A1208]">Watch the 4-step AI pipeline run live →</p>
          </div>
          <span className="text-[#5BBFBF] text-3xl group-hover:translate-x-2 transition-transform">→</span>
        </div>
      </motion.a>

      {/* Intelligence Layer — reframed tech stack */}
      <section className="bg-white border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7A6A58] mb-3">Intelligence Layer</p>
            <h2 className="font-display text-4xl font-light text-[#1A1208] mb-2">
              Every tool chosen for impact, not resume.
            </h2>
            <p className="font-sans text-base text-[#7A6A58] mb-12 max-w-2xl">
              Each capability in CivicPulse exists because it solves a specific failure mode in how cities handle civic complaints.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {INTELLIGENCE_LAYER.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(26,18,8,0.10)" }}
                className="rounded-2xl border border-[#E8E4DB] p-5 bg-[#FAF7F2] cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{ borderColor: `${t.color}40`, color: t.color, background: `${t.color}10` }}>
                    {t.badge}
                  </span>
                </div>
                <p className="font-sans text-sm font-semibold text-[#1A1208] mb-2">{t.name}</p>
                <p className="font-sans text-xs leading-relaxed text-[#7A6A58]">{t.capability}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Links section */}
      <section className="border-t border-[#E8E4DB] bg-[#FAF7F2]">
        <div className="mx-auto max-w-5xl px-5 py-16 flex flex-wrap gap-4">
          <a href="https://github.com/muzammil-labs/civicpulse" target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#1A1208]
            px-6 py-2.5 font-mono text-sm text-[#1A1208] hover:bg-[#1A1208] hover:text-white
            transition-colors">
            View on GitHub →
          </a>
          <a href="/civic/for-cities" className="shimmer-btn rounded-full px-6 py-2.5 font-mono text-sm">
            For Cities
          </a>
          <a href="/civic#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-[#1A1208]
            px-6 py-2.5 font-mono text-sm text-[#1A1208]
            hover:bg-[#1A1208] hover:text-white transition-colors">
            How it works →
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
