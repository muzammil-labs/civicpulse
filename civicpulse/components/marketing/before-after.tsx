'use client'

import { useState } from 'react'

const CHAT = [
  { who: 'Priya', text: 'anyone else’s Tower B lift stuck again??', time: '9:14 AM' },
  { who: 'Ramesh', text: 'reported this last week also 🙄', time: '9:16 AM' },
  { who: 'Secretary', text: 'noting it down', time: '9:20 AM' },
  { who: 'Anjali', text: '📷 gate light also not working', time: '10:02 AM' },
  { who: 'Priya', text: 'any update on the lift??', time: '2:47 PM' },
  { who: 'Vikram', text: '+1, still stuck on 4th floor', time: '4:15 PM' },
]

const QUEUE = [
  { icon: '🛗', title: 'Tower B lift stuck, 4th floor', meta: '3 reports merged · assigned to lift vendor', status: 'In progress', tone: 'bg-amber-50 text-amber-800' },
  { icon: '💡', title: 'Gate light flickering', meta: 'Block C entrance · electrician assigned', status: 'Assigned', tone: 'bg-violet-50 text-violet-800' },
  { icon: '✅', title: 'Water logging, Gate 2', meta: 'Fixed yesterday · after-photo attached', status: 'Resolved', tone: 'bg-emerald-50 text-emerald-800' },
]

// Drag to compare a typical society WhatsApp group with the same week in the queue.
export function BeforeAfter() {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-3xl select-none overflow-hidden rounded-3xl border border-line bg-white shadow-xl shadow-stone-900/5 sm:aspect-[16/10]">
      {/* After (underneath) */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-soft to-white p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">After · committee queue</p>
        <ul className="mt-4 space-y-3">
          {QUEUE.map((q) => (
            <li key={q.title} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line sm:p-4">
              <span className="text-xl" aria-hidden>{q.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{q.title}</p>
                <p className="truncate text-xs text-subtle">{q.meta}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${q.tone}`}>{q.status}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Before (clipped on top) */}
      <div className="absolute inset-0 bg-[#ECE5DD] p-5 sm:p-8" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Before · society WhatsApp group · 47 unread</p>
        <ul className="mt-4 space-y-2">
          {CHAT.map((m, i) => (
            <li key={i} className="w-fit max-w-[85%] rounded-xl rounded-tl-none bg-white px-3 py-1.5 text-sm shadow-sm">
              <span className="font-semibold text-teal-700">{m.who}: </span>
              <span className="text-stone-800">{m.text}</span>
              <span className="ml-2 text-[10px] text-stone-400">{m.time}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Handle */}
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow" />
        <div className="absolute top-1/2 -ml-5 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand shadow-lg ring-1 ring-line">⟷</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}
