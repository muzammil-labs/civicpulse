'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addBlocks, importUnits, setRequireAfterPhoto, updateCategory } from '../actions'
import type { Category } from '@/lib/types'

function useRun() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, onOk?: () => void) =>
    start(async () => {
      const res = await fn()
      setMsg(res.ok ? (res.message ? { ok: true, text: res.message } : null) : { ok: false, text: res.error ?? 'Something went wrong' })
      if (res.ok) onOk?.()
      router.refresh()
    })
  return { pending, msg, run }
}

export function BlocksForm() {
  const [value, setValue] = useState('')
  const { pending, msg, run } = useRun()
  return (
    <div className="flex flex-wrap gap-2">
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Tower D, Tower E" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm" />
      <button disabled={pending || !value.trim()} onClick={() => run(() => addBlocks(value), () => setValue(''))} className="rounded-xl bg-text px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Add</button>
      {msg && <p className={`w-full text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</p>}
    </div>
  )
}

export function UnitsImport() {
  const [csv, setCsv] = useState('')
  const { pending, msg, run } = useRun()
  return (
    <div className="space-y-2">
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder={'Tower, Flat, Floor, Area (sq ft)\nTower A, A-101, 1, 1450\nTower A, A-102, 1, 1450'}
        className="w-full rounded-xl border border-line px-3 py-2 font-mono text-xs"
      />
      <div className="flex items-center gap-3">
        <button disabled={pending || !csv.trim()} onClick={() => run(() => importUnits(csv), () => setCsv(''))} className="rounded-xl bg-text px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {pending ? 'Importing…' : 'Import flats'}
        </button>
        <p className="text-xs text-subtle">Copy the columns straight from Excel or Google Sheets. Existing flats are skipped.</p>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</p>}
    </div>
  )
}

export function CategoryRow({ category, assignees }: { category: Category & { default_assignee_id: string | null }; assignees: { id: string; label: string }[] }) {
  const { pending, msg, run } = useRun()
  return (
    <tr>
      <td className="py-2.5 pr-3"><span className="mr-2">{category.icon}</span>{category.label.en}</td>
      <td className="py-2.5 pr-3">
        <select
          defaultValue={category.default_sla_hours}
          disabled={pending}
          onChange={(e) => run(() => updateCategory(category.id, { default_sla_hours: Number(e.target.value) }))}
          className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
        >
          {[2, 4, 8, 12, 24, 48, 72, 120, 168].map((h) => <option key={h} value={h}>{h < 48 ? `${h} hours` : `${h / 24} days`}</option>)}
          {![2, 4, 8, 12, 24, 48, 72, 120, 168].includes(category.default_sla_hours) && <option value={category.default_sla_hours}>{category.default_sla_hours} hours</option>}
        </select>
      </td>
      <td className="py-2.5 pr-3">
        <select
          defaultValue={category.default_assignee_id ?? ''}
          disabled={pending}
          onChange={(e) => run(() => updateCategory(category.id, { default_assignee_id: e.target.value || null }))}
          className="max-w-48 rounded-lg border border-line bg-white px-2 py-1 text-sm"
        >
          <option value="">Committee decides</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </td>
      <td className="py-2.5">
        <input
          type="checkbox"
          defaultChecked={category.active}
          disabled={pending}
          onChange={(e) => run(() => updateCategory(category.id, { active: e.target.checked }))}
          className="accent-brand"
          aria-label={`Show ${category.label.en} to residents`}
        />
        {msg && !msg.ok && <span className="ml-2 text-xs text-red-700">{msg.text}</span>}
      </td>
    </tr>
  )
}

export function AfterPhotoToggle({ value }: { value: boolean }) {
  const { pending, msg, run } = useRun()
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" defaultChecked={value} disabled={pending} onChange={(e) => run(() => setRequireAfterPhoto(e.target.checked))} className="mt-0.5 accent-brand" />
      <span>
        <span className="font-medium">Require an “after” photo to resolve an issue</span>
        <span className="block text-subtle">Recommended. Residents trust a fix they can see.</span>
        {msg && !msg.ok && <span className="block text-red-700">{msg.text}</span>}
      </span>
    </label>
  )
}
