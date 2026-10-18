"use client"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { UploadSection } from "@/components/upload-section"
import { SiteFooter } from "@/components/site-footer"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      {/* Feature 18 — divider with iridescent gradient line */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mx-auto max-w-6xl px-5"
      >
        <div className="h-px w-full iridescent origin-left" />
      </motion.div>

      {/* Bento Features Grid */}
      <section id="how-it-works" className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #ffffff 60%, #FAF7F2 100%)' }}>
        <div aria-hidden="true" className="ambient-orb absolute right-0 top-1/2 -translate-y-1/2
          h-[40rem] w-[40rem] opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            {/* 8. Vertical teal accent line decoration */}
            <div className="flex items-start gap-4">
              <div className="w-px self-stretch bg-gradient-to-b from-[#5BBFBF] to-transparent mt-1" />
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5BBFBF] mb-3">
                  How it works
                </p>
                <h2 className="font-display text-5xl font-bold text-[#1A1208]">
                  Four steps. One photo.
                </h2>
              </div>
            </div>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto md:auto-rows-[160px]">

            {/* Large card — Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, rotateX: 5 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.05, duration: 0.7, ease: "easeOut" }}
              className="bento-card depth-card md:col-span-5 md:row-span-2 p-8 flex flex-col justify-between
              bg-white relative overflow-hidden transform-style-3d"
            >
              <div aria-hidden="true" className="ambient-orb absolute -right-8 -top-8
                h-40 w-40 opacity-[0.1]" />
              {/* 3. Scan line animation */}
              <div aria-hidden="true" className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(91,191,191,0.5), transparent)', animation: 'scan-line 3s ease-in-out infinite' }} />
              {/* 4. Step number */}
              <span className="font-mono text-5xl font-bold text-[#C9A84C]">01</span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#5BBFBF] mb-2">
                  Classify
                </p>
                <h3 className="font-display text-3xl font-light text-[#1A1208] mb-2">
                  AI reads your photo
                </h3>
                <p className="font-sans text-sm leading-relaxed text-[#3D2E1A]">
                  Gemini 2.5 Flash identifies the issue type — pothole, leaking pipe,
                  broken streetlight — directly from the image. No text description needed.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, rotateX: 5 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
              className="bento-card depth-card md:col-span-4 p-6 flex flex-col justify-between bg-[#FAF7F2] transform-style-3d"
            >
              {/* 4. Step number */}
              <span className="font-mono text-4xl font-bold text-[#C9A84C]">02</span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#5BBFBF] mb-1">
                  Deduplicate
                </p>
                <h3 className="font-sans text-lg font-semibold text-[#1A1208]">
                  No duplicate reports
                </h3>
                <p className="font-sans text-xs leading-relaxed text-[#3D2E1A] mt-1">
                  Checks reports within 200m for the same issue type before submitting.
                </p>
              </div>
            </motion.div>

            {/* Step 3 — severity — fixed readability */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, rotateX: 5 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
              className="bento-card depth-card md:col-span-3 p-6 flex flex-col justify-between
              overflow-hidden relative transform-style-3d"
              style={{ background: 'linear-gradient(135deg,#5BBFBF15,#D4AF6A15)' }}
            >
              <div className="flex items-center justify-between">
                {/* 1. Fix step 03 number — readable teal tint */}
                <span className="font-mono text-4xl font-bold text-[#C9A84C]">03</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-6 w-1.5 rounded-full"
                      style={{ background: i<=4 ? '#E8957A' : '#E8E4DB' }} />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#5BBFBF] mb-1">
                  Severity
                </p>
                {/* 1. Fixed contrast — font-bold and darker text */}
                <h3 className="font-sans text-lg font-bold text-[#1A1208]">
                  Live grounding
                </h3>
                <p className="font-sans text-xs text-[#3D2E1A] mt-1">
                  Google Search confirms real-world context. A flooded road gets a 5/5.
                </p>
              </div>
            </motion.div>

            {/* Step 4 — route */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, rotateX: 5 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
              className="bento-card depth-card md:col-span-4 p-6 flex flex-col justify-between transform-style-3d"
            >
              {/* 4. Step number */}
              <span className="font-mono text-4xl font-bold text-[#C9A84C]">04</span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#E8957A] mb-1">
                  Route
                </p>
                <h3 className="font-sans text-lg font-semibold text-[#1A1208]">
                  Right department, first time
                </h3>
                <p className="font-sans text-xs leading-relaxed text-[#3D2E1A] mt-1">
                  Municipal Corporation, Water Board, Electrical — routed automatically with escalation chain.
                </p>
              </div>
            </motion.div>

            {/* Wide card — map preview pill — with Live Pulse badge */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, rotateX: 5 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.45, duration: 0.7, ease: "easeOut" }}
              className="bento-card depth-card md:col-span-3 p-6 flex flex-col items-start justify-between
              bg-white relative overflow-hidden transform-style-3d group"
            >
              {/* Subtle map bg element */}
              <div aria-hidden="true" className="absolute inset-0 opacity-[0.03]" 
                style={{ backgroundImage: 'radial-gradient(#1A1208 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              {/* 5. Live Pulse badge */}
              <div className="flex items-center gap-1.5 mb-3 relative z-10">
                <span className="h-2 w-2 rounded-full bg-[#5BBFBF] glow-pulse" />
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#5BBFBF]">Live</p>
              </div>
              <div className="relative z-10">
                <h3 className="font-display text-2xl font-medium text-[#1A1208] mb-2">Community map</h3>
                <a href="/civic/map" className="font-mono text-xs text-[#D4AF6A] hover:underline">
                  View all reports →
                </a>
              </div>
            </motion.div>

          </div>

          {/* 6. Impact Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="mt-16 iridescent-border-animated rounded-2xl shadow-xl-warm transform-style-3d"
          >
            <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-around gap-6 bg-white relative z-10" style={{ borderRadius: '16px' }}>
              {[
                { num: '< 30s', label: 'Time to submit a report' },
                { num: '200m', label: 'Deduplication radius' },
                { num: '5', label: 'Departments routed' },
                { num: '4', label: 'AI review steps' },
              ].map(({ num, label }) => (
                <div key={label} className="text-center">
                  <p className="font-display text-4xl font-light text-[#5BBFBF] mb-2">{num}</p>
                  <p className="font-mono text-xs text-[#7A6A58] mt-1 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* 7. Upload section — subtle gradient depth instead of flat */}
      <section id="upload" className="relative overflow-hidden py-20"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #FAF7F2 100%)' }}>
        {/* Ambient orb decorations */}
        <div aria-hidden="true" className="ambient-orb absolute -right-32 top-10
          h-72 w-72 opacity-[0.08]" />
        <div aria-hidden="true" className="ambient-orb absolute -left-24 bottom-10
          h-56 w-56 opacity-[0.06]"
          style={{ background: 'linear-gradient(135deg,#E8957A,#D4AF6A)' }} />
        <div className="relative z-10 mx-auto max-w-3xl px-5">
          <UploadSection />
        </div>
      </section>

      {/* Feature 18 — floating map CTA that appears after scroll */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-3xl px-5 pb-20 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7A6A58] mb-4">
          Already reported? Track it.
        </p>
        <Link
          href="/civic/map"
          className="inline-flex items-center gap-2 rounded-full border border-[#1A1208] bg-transparent px-8 py-3 font-sans text-sm font-medium text-[#1A1208] transition-colors hover:bg-[#1A1208] hover:text-white"
        >
          🗺 View Community Map
        </Link>
      </motion.div>
      <SiteFooter />
    </main>
  )
}