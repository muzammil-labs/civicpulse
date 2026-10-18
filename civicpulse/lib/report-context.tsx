"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { seedReports } from '@/lib/seed-reports'

export type ReportSeverity = 'low' | 'medium' | 'high'

export function severityLabel(n: number): ReportSeverity {
  if (n <= 2) return 'low'
  if (n === 3) return 'medium'
  return 'high'
}

export type Report = {
  id: string
  lat: number
  lon: number
  category: 'pothole' | 'water_leakage' | 'streetlight' | 'waste_management' | 'other'
  description: string
  severity: ReportSeverity
  department: string
  timeAgo: string
  report: string
  status: 'reported' | 'acknowledged' | 'verified' | 'in_progress' | 'resolved'
  createdAt: string
}

type ReportContextValue = {
  confirmedReports: Report[]
  addConfirmedReport: (report: Report) => void
  reportCount: number
  comments: Record<string, { id: string; text: string; createdAt: string }[]>
  addComment: (reportId: string, text: string) => void
}

const ReportContext = createContext<ReportContextValue | null>(null)

const STORAGE_KEY = 'civicpulse_confirmed_reports'
const COMMENTS_STORAGE_KEY = 'civicpulse_comments'

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [confirmedReports, setConfirmedReports] = useState<Report[]>([])
  const [reportCount, setReportCount] = useState(seedReports.length)
  const [comments, setComments] = useState<Record<string, { id: string; text: string; createdAt: string }[]>>({})
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount only (client-side)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setConfirmedReports(parsed)
          setReportCount(seedReports.length + parsed.length)
        }
      }
      
      const rawComments = localStorage.getItem(COMMENTS_STORAGE_KEY)
      if (rawComments) {
        const parsedComments = JSON.parse(rawComments)
        setComments(parsedComments)
      }
    } catch (e) {
      console.warn('[report-context] failed to load saved data', e)
    }
    setHydrated(true)
  }, [])

  // Persist whenever confirmedReports changes, but only after initial hydration
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmedReports))
    } catch (e) {
      console.warn('[report-context] failed to save reports', e)
    }
  }, [confirmedReports, hydrated])

  // Persist whenever comments changes, but only after initial hydration
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
    } catch (e) {
      console.warn('[report-context] failed to save comments', e)
    }
  }, [comments, hydrated])

  const addConfirmedReport = (report: Report) => {
    setConfirmedReports((prev) => [...prev, report])
    setReportCount((prev) => prev + 1)
  }

  const addComment = (reportId: string, text: string) => {
    setComments((prev) => {
      const existing = prev[reportId] || []
      return {
        ...prev,
        [reportId]: [
          ...existing,
          { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() },
        ],
      }
    })
  }

  return (
    <ReportContext.Provider value={{ confirmedReports, addConfirmedReport, reportCount, comments, addComment }}>
      {children}
    </ReportContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportContext)
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider')
  }
  return context
}
