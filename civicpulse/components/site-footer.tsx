"use client"
import Link from "next/link"
import { motion } from "framer-motion"

export function SiteFooter() {
  return (
    <footer className="relative" style={{ background: '#0A1628' }}>
      {/* Iridescent top border */}
      <div className="h-px w-full iridescent" />

      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Col 1: Brand */}
          <div>
            <p className="iridescent-text font-display text-2xl font-medium tracking-tight mb-2">
              CivicPulse
            </p>
            <p className="font-sans text-sm text-white/60 mb-3">
              AI-powered civic reporting for India&apos;s cities.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BBFBF] glow-pulse" />
              <span className="font-mono text-xs text-[#5BBFBF]">Live reporting active</span>
            </div>
            <p className="font-mono text-xs text-white/30">India · 2026</p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Navigation</p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "How it works", href: "/civic#how-it-works" },
                { label: "The Map", href: "/civic/map" },
                { label: "Dashboard", href: "/civic/dashboard" },
                { label: "For Cities", href: "/civic/for-cities" },
                { label: "About", href: "/civic/about" },
                { label: "Report an Issue", href: "/civic#upload" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-xs text-white/50 hover:text-[#5BBFBF] transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3: Built for */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Built for</p>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="text-sm">🏆</span>
                <span className="font-mono text-xs text-white/70">Google AI Studio Hackathon</span>
              </div>
              <div className="block">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/30 mb-1">Powered by</p>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5BBFBF]" />
                  <span className="font-mono text-xs text-white/60">Gemini 2.5 Flash</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                  <span className="font-mono text-xs text-white/60">Google Search Grounding</span>
                </div>
              </div>
              <a
                href="https://github.com/muzammil-labs/civicpulse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-white/50 hover:text-white transition-colors"
              >
                <span>🐙</span> View on GitHub →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row"
        >
          <p className="font-mono text-xs text-white/40">
            © 2026 CivicPulse · Built for India · Google AI Studio Hackathon
          </p>
          <p className="font-mono text-[11px] text-white/20">
            MIT License · Open Source
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
