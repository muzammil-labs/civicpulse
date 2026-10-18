'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/navbar'
import { MapLegend } from '@/components/map-legend'
import { ReportCard } from '@/components/report-card'
import { seedReports } from '@/lib/seed-reports'
import { useReports } from '@/lib/report-context'

const CivicMap = dynamic(
  () => import('@/components/civic-map').then((m) => m.CivicMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#FAF7F2] flex items-center justify-center p-8">
        <div className="w-full h-full max-w-4xl max-h-[600px] border border-[#E8E4DB] rounded-2xl bg-white shadow-sm overflow-hidden flex relative">
          <div className="flex-1 bg-[#F0EBE3] animate-pulse">
            <div className="absolute top-4 left-4 w-12 h-24 bg-white/60 rounded-md" />
            <div className="absolute bottom-6 right-6 w-32 h-8 bg-white/60 rounded-md" />
          </div>
          <div className="w-80 border-l border-[#E8E4DB] bg-white hidden md:flex flex-col p-4 space-y-4">
            <div className="h-6 w-3/4 bg-[#E8E4DB] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[#F0EBE3] rounded animate-pulse mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full bg-[#FAF7F2] border border-[#E8E4DB] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    ),
  }
)

export default function MapPage() {
  useEffect(() => {
    try { sessionStorage.removeItem('civicpulse_confirmed') } catch {}
  }, [])

  const { confirmedReports } = useReports()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const allReports = [...seedReports, ...confirmedReports].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )

  useEffect(() => {
    if (selectedId) {
      setTimeout(() => {
        // Try scrolling desktop card first
        const desktopCard = document.getElementById(`report-card-${selectedId}`)
        if (desktopCard && window.innerWidth >= 768) {
          desktopCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
    }
  }, [selectedId])

  return (
    <div className="flex h-screen flex-col bg-[#FAF7F2] overflow-hidden">
      <Navbar />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex-shrink-0 border-b border-[#E8E4DB] px-6 py-4"
        style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-light text-[#1A1208]">Community Reports</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BBFBF] glow-pulse" />
              <p className="text-xs text-[#7A6A58] font-mono">{allReports.length} active · India</p>
            </div>
          </div>
          <Link href="/civic#upload" className="shimmer-btn magnetic-btn rounded-full px-5 py-2 text-sm font-medium">
            Report an Issue
          </Link>
        </div>
      </motion.div>

      {/* Map + Sidebar split — true flex, not absolute */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Map area */}
        <div className="relative flex-1 min-w-0">
          {allReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#FAF7F2]">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="font-display text-xl text-[#1A1208]">No reports yet</p>
              <p className="text-sm text-[#7A6A58] mt-1">Be the first to report an issue</p>
              <Link href="/civic#upload" className="mt-4 shimmer-btn rounded-full px-5 py-2 text-sm">Report an Issue</Link>
            </div>
          ) : (
            <CivicMap 
              reports={allReports} 
              selectedId={selectedId} 
              onMarkerClick={(id) => {
                // Delay by 50ms on mobile to allow Leaflet's mobile touchend events to fully resolve
                // On desktop, execute instantly for responsive sidebar syncing
                if (window.innerWidth < 768) {
                  setTimeout(() => setSelectedId(id), 50)
                } else {
                  setSelectedId(id)
                }
              }} 
            />
          )}
          <MapLegend />
        </div>

        {/* Sidebar — fixed width on desktop, bottom sheet on mobile */}
        <div className="hidden md:flex md:flex-col md:w-80 lg:w-96
          overflow-hidden flex-shrink-0 border-l border-[#E8E4DB] bg-white">
          <div className="flex-shrink-0 px-5 py-4 border-b border-[#E8E4DB]">
            <h2 className="font-display text-lg font-light text-[#1A1208]">Active Reports</h2>
            <p className="text-xs text-[#7A6A58] mt-0.5 font-mono">{allReports.length} reports · India</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {allReports.map((report) => (
              <div key={report.id} id={`report-card-${report.id}`}>
                <ReportCard
                  report={report}
                  dark={false}
                  isSelected={selectedId === report.id}
                  onClick={() => setSelectedId(report.id === selectedId ? null : report.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: bottom sheet with report count badge */}
        <div className={`
          md:hidden fixed bottom-0 left-0 right-0 z-20
          bg-white border-t border-[#E8E4DB] shadow-[0_-8px_30px_rgba(0,0,0,0.05)]
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out
          ${sheetOpen ? "max-h-[55vh]" : "max-h-[52px]"}
        `}>
          <button
            onClick={() => {
              setSheetOpen(prev => {
                const next = !prev;
                setTimeout(() => {
                  const mapEl = document.querySelector('.leaflet-container') as any;
                  if (mapEl?._leaflet_id) {
                    const map = (window as any).L?.map ? null : null; // skip
                  }
                  // Force Leaflet invalidateSize via custom event
                  window.dispatchEvent(new Event('resize'));
                }, 350);
                return next;
              });
            }}
            className="flex items-center justify-between px-4 py-3 w-full flex-shrink-0
              border-b border-[#E8E4DB]"
          >
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-light text-[#1A1208]">
                Active Reports
              </span>
              <span className="font-mono text-xs bg-[#5BBFBF]/10 text-[#5BBFBF]
                px-2 py-0.5 rounded-full border border-[#5BBFBF]/20">
                {allReports.length}
              </span>
            </div>
            <span className={`text-[#7A6A58] text-xs transition-transform duration-200
              ${sheetOpen ? "rotate-180" : ""}`}>
              ▲
            </span>
          </button>
          <div id="mobile-card-container" className="flex-1 overflow-y-auto p-2 space-y-2">
            {allReports.map((report) => (
              <div key={report.id} id={`report-card-mobile-${report.id}`}>
                <ReportCard
                  report={report}
                  dark={false}
                  isSelected={false} // Force false in the list so it doesn't expand inline on mobile
                  onClick={() => {
                    setSelectedId(report.id)
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Full-Screen Report Modal (Option B) */}
        {selectedId && (
          <div className="md:hidden fixed inset-0 z-[2000] bg-[#FAF7F2] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="bg-white px-4 py-3 border-b border-[#E8E4DB] flex items-center justify-between shadow-sm-warm flex-shrink-0">
              <h2 className="font-display text-lg text-[#1A1208]">Report Details</h2>
              <button 
                onClick={() => {
                  setSelectedId(null)
                  setTimeout(() => window.dispatchEvent(new Event('resize')), 100)
                }}
                className="p-2 -mr-2 text-[#7A6A58] hover:text-[#1A1208] transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const selectedReport = allReports.find(r => r.id === selectedId)
                if (!selectedReport) return null
                return (
                  <ReportCard
                    report={selectedReport}
                    dark={false}
                    isSelected={true} // Always expanded in modal
                    onClick={() => {}} // No-op
                  />
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
