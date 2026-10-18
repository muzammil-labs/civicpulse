"use client"
import { useReports } from "@/lib/report-context"
import { seedReports } from "@/lib/seed-reports"
import { Navbar } from "@/components/navbar"
import { CitizenProfile } from "@/components/citizen-profile"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const CATEGORY_LABELS: Record<string, string> = {
  pothole: "Pothole / Road",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  waste_management: "Waste Management",
  other: "Other Infrastructure",
}
const CATEGORY_ICONS: Record<string, string> = {
  pothole: "🛣️",
  water_leakage: "💧",
  streetlight: "💡",
  waste_management: "🗑️",
  other: "🏗️",
}
const SEVERITY_COLORS: Record<string, string> = {
  low: "#5BBFBF", medium: "#D4AF37", high: "#E8957A",
}
const STATUS_LABELS: Record<string, string> = {
  reported: "Reported", acknowledged: "Acknowledged", verified: "Verified",
  in_progress: "In Progress", resolved: "Resolved",
}
const STATUS_COLORS: Record<string, string> = {
  reported: "#C9A84C", acknowledged: "#5BBFBF", verified: "#7BCFCF",
  in_progress: "#D4AF37", resolved: "#22c55e",
}
const DEPT_COLORS: Record<string, string> = {
  "Municipal Roads Department": "#E8957A",
  "State Water Board": "#5BBFBF",
  "Electrical/Streetlighting": "#D4AF37",
  "Municipal Sanitation": "#22c55e",
  "Municipal Corporation": "#C9A84C",
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div className="w-full h-2 bg-[#E8E4DB] rounded-full overflow-hidden relative">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay }}
        className="h-full rounded-full relative"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
      />
    </div>
  )
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let cur = 0
    const step = target / 36
    const t = setInterval(() => {
      cur += step
      if (cur >= target) { setV(target); clearInterval(t) }
      else setV(Math.floor(cur))
    }, 28)
    return () => clearInterval(t)
  }, [target])
  return <>{v}{suffix}</>
}

export default function DashboardPage() {
  const { confirmedReports } = useReports()
  const allReports = [...seedReports, ...confirmedReports]
  const [tab, setTab] = useState<"overview" | "departments" | "activity">("overview")
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-IN'))
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const byCategory: Record<string, number> = {}
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0 }
  const byStatus: Record<string, number> = {
    reported: 0, acknowledged: 0, verified: 0, in_progress: 0, resolved: 0,
  }
  const byDept: Record<string, number> = {}

  for (const r of allReports) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1
    if (r.severity) bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1
    byStatus[r.status ?? "reported"] = (byStatus[r.status ?? "reported"] ?? 0) + 1
    byDept[r.department] = (byDept[r.department] ?? 0) + 1
  }

  const total = allReports.length || 1
  const resolvedPct = Math.round(((byStatus.resolved ?? 0) / total) * 100)
  const activeCount = (byStatus.reported ?? 0) + (byStatus.acknowledged ?? 0) + (byStatus.in_progress ?? 0)
  const highCount = bySeverity.high ?? 0
  const maxCat = Math.max(...Object.values(byCategory), 1)
  const maxDept = Math.max(...Object.values(byDept), 1)

  const recent = [...allReports]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 6)

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>
      <Navbar />

      <div className="border-b border-[#E8E4DB] px-6 py-6" style={{ background: 'rgba(255,255,255,0.8)' }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-[#5BBFBF] glow-pulse" />
              <p className="font-mono text-xs text-[#5BBFBF] uppercase tracking-widest">Live Dashboard</p>
            </div>
            <h1 className="font-display text-2xl font-light text-[#1A1208]">City Command Center</h1>
            <p className="font-mono text-xs text-[#7A6A58] mt-1">India · Real-time infrastructure tracking</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-mono text-xs text-[#7A6A58]">Last updated</p>
            <p className="font-mono text-xs text-[#5BBFBF]">{currentTime || "..."}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Reports', value: allReports.length, suffix: '', icon: '📋', color: '#5BBFBF', subtext: '+12 this week' },
            { label: 'Active Issues', value: activeCount, suffix: '', icon: '⚡', color: '#D4AF6A', subtext: `${highCount} critical` },
            { label: 'Resolved', value: byStatus.resolved ?? 0, suffix: '', icon: '✅', color: '#22c55e', subtext: `${resolvedPct}% rate` },
            { label: 'Departments', value: Object.keys(byDept).length, suffix: '', icon: '🏛️', color: '#E8957A', subtext: 'Active responders' },
          ].map(({ label, value, suffix, icon, color, subtext }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, rotateX: 5, rotateY: -5 }}
              className="iridescent-border-animated rounded-2xl bg-white shadow-sm-warm transform-style-3d cursor-default"
              style={{ borderRadius: '16px', perspective: '1000px' }}
            >
              <div className="rounded-2xl p-5 bg-white/90 backdrop-blur-md h-full transition-transform duration-300">
                <div className="flex items-start justify-between mb-3 transform-style-3d translate-z-10">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: `${color}15`, color }}>
                    Live
                  </span>
                </div>
                <p className="font-display text-4xl font-light text-[#1A1208] transform-style-3d translate-z-20">
                  <CountUp target={value} suffix={suffix} />
                </p>
                <p className="font-sans text-sm text-[#7A6A58] mt-1 transform-style-3d translate-z-10">{label}</p>
                <p className="font-mono text-[10px] mt-2 transform-style-3d translate-z-10" style={{ color }}>{subtext}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ background: 'rgba(26,18,8,0.05)' }}>
          {(['overview', 'departments', 'activity'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all
                ${tab === t
                  ? 'bg-white text-[#5BBFBF] font-semibold shadow-sm'
                  : 'text-[#7A6A58] hover:text-[#1A1208]'
                }`}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <motion.div key="overview"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-2xl border border-[#E8E4DB] p-6 bg-white shadow-sm-warm"
                  style={{ backdropFilter: 'blur(12px)' }}>
                  <h2 className="font-display text-xl font-light text-[#1A1208] mb-5">
                    Reports by Category
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(byCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, count], i) => (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-lg w-6 flex-shrink-0 bg-[#FAF7F2] rounded-lg p-1 text-center border border-[#E8E4DB]">
                            {CATEGORY_ICONS[cat] ?? "📋"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs font-mono text-[#7A6A58] mb-1.5">
                              <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                              <span className="font-semibold text-[#1A1208]">{count}</span>
                            </div>
                            <AnimatedBar
                              pct={(count / maxCat) * 100}
                              color="#5BBFBF"
                              delay={i * 0.07}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#E8E4DB] p-5 bg-white shadow-sm-warm"
                    style={{ backdropFilter: 'blur(12px)' }}>
                    <h2 className="font-display text-base font-light text-[#1A1208] mb-4">
                      Severity Distribution
                    </h2>
                    <div className="space-y-3">
                      {(["high", "medium", "low"] as const).map((sev, i) => (
                        <div key={sev}>
                          <div className="flex justify-between text-xs font-mono text-[#7A6A58] mb-1">
                            <span className="flex items-center gap-1.5 capitalize">
                              <span className="w-2 h-2 rounded-full inline-block"
                                style={{ background: SEVERITY_COLORS[sev] }} />
                              {sev}
                            </span>
                            <span className="text-[#1A1208]">{bySeverity[sev] ?? 0}</span>
                          </div>
                          <AnimatedBar
                            pct={((bySeverity[sev] ?? 0) / total) * 100}
                            color={SEVERITY_COLORS[sev]}
                            delay={i * 0.1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E8E4DB] p-5 flex flex-col items-center bg-white shadow-sm-warm"
                    style={{ backdropFilter: 'blur(12px)' }}>
                    <h2 className="font-display text-base font-light text-[#1A1208] mb-3 self-start">
                      Resolution Rate
                    </h2>
                    <svg width="96" height="96" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none"
                        stroke="#F0EBE3" strokeWidth="10" />
                      <motion.circle cx="50" cy="50" r="40" fill="none"
                        stroke="#22c55e" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{
                          strokeDashoffset: 2 * Math.PI * 40 * (1 - resolvedPct / 100),
                        }}
                        transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.2 }}
                        transform="rotate(-90 50 50)"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' }}
                      />
                      <text x="50" y="54" textAnchor="middle"
                        style={{ fontSize: 18, fill: "#1A1208", fontFamily: "var(--font-display)" }}>
                        {resolvedPct}%
                      </text>
                    </svg>
                    <p className="text-xs font-mono text-[#7A6A58] mt-2">
                      {byStatus.resolved ?? 0} of {total} resolved
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E4DB] p-6 bg-white shadow-sm-warm"
                style={{ backdropFilter: 'blur(12px)' }}>
                <h2 className="font-display text-xl font-light text-[#1A1208] mb-5">
                  Issue Pipeline
                </h2>
                <div className="flex flex-col md:flex-row gap-2">
                  {Object.entries(byStatus)
                    .filter(([, c]) => c > 0)
                    .sort(([a], [b]) => {
                      const ord = ["reported","acknowledged","verified","in_progress","resolved"]
                      return ord.indexOf(a) - ord.indexOf(b)
                    })
                    .map(([status, count], i, arr) => (
                      <div key={status} className="flex md:flex-col items-center gap-2 flex-1">
                        <div className="flex-1 md:flex-none md:w-full rounded-xl p-3 text-center"
                          style={{
                            background: `${STATUS_COLORS[status]}08`,
                            borderTop: `2px solid ${STATUS_COLORS[status]}`,
                            backdropFilter: 'blur(8px)',
                          }}>
                          <p className="font-display text-2xl font-light"
                            style={{ color: STATUS_COLORS[status] }}>
                            {count}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[#7A6A58] mt-0.5">
                            {STATUS_LABELS[status]}
                          </p>
                        </div>
                        {i < arr.length - 1 && (
                          <span className="text-[#C9A84C]/50 font-mono text-sm hidden md:block">→</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E4DB] overflow-hidden bg-white shadow-sm-warm">
                <CitizenProfile />
              </div>
            </motion.div>
          )}

          {/* ── DEPARTMENTS TAB ── */}
          {tab === "departments" && (
            <motion.div key="departments"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {Object.entries(byDept)
                .sort(([, a], [, b]) => b - a)
                .map(([dept, count], i) => {
                  const dr = allReports.filter((r) => r.department === dept)
                  const resolved = dr.filter((r) => r.status === "resolved").length
                  const high = dr.filter((r) => r.severity === "high").length
                  const rRate = dr.length ? Math.round((resolved / dr.length) * 100) : 0
                  const col = DEPT_COLORS[dept] ?? "#5BBFBF"
                  return (
                    <motion.div key={dept}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-[#E8E4DB] p-6 bg-white shadow-sm-warm"
                      style={{ backdropFilter: 'blur(12px)' }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-sans text-sm font-semibold text-[#1A1208]">{dept}</h3>
                          <p className="font-mono text-xs text-[#7A6A58] mt-0.5">
                            {count} total reports
                          </p>
                        </div>
                        <span className="font-display text-3xl font-light" style={{ color: col }}>
                          {count}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-[#FAF7F2] rounded-lg p-3 border border-[#E8E4DB]">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[#7A6A58]">
                            Resolved
                          </p>
                          <p className="font-sans text-lg font-semibold text-[#22c55e] mt-0.5">
                            {rRate}%
                          </p>
                        </div>
                        <div className="bg-[#FAF7F2] rounded-lg p-3 border border-[#E8E4DB]">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[#7A6A58]">
                            Urgent
                          </p>
                          <p className="font-sans text-lg font-semibold text-[#E8957A] mt-0.5">
                            {high}
                          </p>
                        </div>
                      </div>
                      <AnimatedBar
                        pct={(count / maxDept) * 100}
                        color={col}
                        delay={i * 0.05}
                      />
                    </motion.div>
                  )
                })}
            </motion.div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {tab === "activity" && (
            <motion.div key="activity"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <div className="rounded-2xl border border-[#E8E4DB] overflow-hidden bg-white shadow-sm-warm"
                style={{ backdropFilter: 'blur(12px)' }}>
                <div className="px-6 py-4 border-b border-[#E8E4DB]">
                  <h2 className="font-display text-xl font-light text-[#1A1208]">
                    Recent Activity
                  </h2>
                  <p className="text-xs font-mono text-[#7A6A58] mt-0.5">
                    Latest {recent.length} reports
                  </p>
                </div>
                <div className="divide-y divide-[#E8E4DB]">
                  {recent.map((r, i) => (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-[#FAF7F2] transition-colors"
                    >
                      <span className="text-xl mt-0.5 flex-shrink-0 bg-white border border-[#E8E4DB] rounded-lg p-1.5">
                        {CATEGORY_ICONS[r.category] ?? "📋"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-sans text-sm font-medium text-[#1A1208] truncate">
                            {r.department}
                          </p>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                            style={{
                              background: `${SEVERITY_COLORS[r.severity] ?? "#5BBFBF"}15`,
                              color: SEVERITY_COLORS[r.severity] ?? "#5BBFBF",
                            }}>
                            {r.severity}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                            style={{
                              background: `${STATUS_COLORS[r.status ?? "reported"]}15`,
                              color: STATUS_COLORS[r.status ?? "reported"],
                            }}>
                            {STATUS_LABELS[r.status ?? "reported"]}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A6A58] mt-1 line-clamp-1">
                          {r.description}
                        </p>
                        {(r as any).resolutionTimeEstimate && (
                          <p className="text-[10px] font-mono text-[#5BBFBF] mt-0.5">
                            ⏱ {(r as any).resolutionTimeEstimate}
                          </p>
                        )}
                      </div>
                      {r.timeAgo && (
                        <p className="text-[10px] font-mono text-[#7A6A58] flex-shrink-0 mt-1">
                          {r.timeAgo}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
