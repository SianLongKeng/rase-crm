'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface DateRange {
  start: string  // ISO yyyy-mm-dd
  end: string    // ISO yyyy-mm-dd
  label: string
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x }
function fmt(d: Date) { return d.toISOString().slice(0, 10) }
function thaiShort(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function presets() {
  const today = startOfDay(new Date())
  const yest = new Date(today.getTime() - 86400000)
  return {
    today: { start: fmt(today), end: fmt(today), label: 'วันนี้' },
    last7: { start: fmt(new Date(today.getTime() - 6 * 86400000)), end: fmt(today), label: '7 วันล่าสุด' },
    last30: { start: fmt(new Date(today.getTime() - 29 * 86400000)), end: fmt(today), label: '30 วันล่าสุด' },
    prevMonth: (() => {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { start: fmt(start), end: fmt(end), label: 'เดือนที่แล้ว' }
    })(),
  }
}

export function rangeToMillis(range: DateRange) {
  return {
    startMs: startOfDay(new Date(range.start)).getTime(),
    endMs: endOfDay(new Date(range.end)).getTime(),
  }
}

export function DateRangePicker({ value, onChange, className }: {
  value: DateRange
  onChange: (r: DateRange) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [tempStart, setTempStart] = useState(value.start)
  const [tempEnd, setTempEnd] = useState(value.end)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const p = presets()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function pick(preset: DateRange) {
    onChange(preset)
    setTempStart(preset.start)
    setTempEnd(preset.end)
    setOpen(false)
  }

  function applyCustom() {
    if (!tempStart || !tempEnd) return
    const start = tempStart <= tempEnd ? tempStart : tempEnd
    const end = tempStart <= tempEnd ? tempEnd : tempStart
    onChange({ start, end, label: start === end ? thaiShort(start) : `${thaiShort(start)} - ${thaiShort(end)}` })
    setOpen(false)
  }

  const displayText = value.start === value.end ? thaiShort(value.start) : `${thaiShort(value.start)} - ${thaiShort(value.end)}`

  return (
    <div ref={wrapperRef} className={cn('relative inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm', className)}>
      <button onClick={() => pick(p.today)}
        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap',
          value.label === 'วันนี้' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
        วันนี้
      </button>
      <button onClick={() => pick(p.last7)}
        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap',
          value.label === '7 วันล่าสุด' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
        7 วันล่าสุด
      </button>
      <button onClick={() => pick(p.last30)}
        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap',
          value.label === '30 วันล่าสุด' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
        30 วันล่าสุด
      </button>
      <button onClick={() => pick(p.prevMonth)}
        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap',
          value.label === 'เดือนที่แล้ว' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
        เดือนที่แล้ว
      </button>
      <button onClick={() => setOpen(o => !o)}
        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border',
          open || !['วันนี้', '7 วันล่าสุด', '30 วันล่าสุด', 'เดือนที่แล้ว'].includes(value.label)
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
        ระยะเวลา
      </button>
      <div className="ml-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap flex items-center gap-1">
        <span>📅 {displayText}</span>
        {!['วันนี้', '7 วันล่าสุด', '30 วันล่าสุด', 'เดือนที่แล้ว'].includes(value.label) && (
          <button onClick={() => pick(p.today)} className="ml-1 text-slate-400 hover:text-slate-700">✕</button>
        )}
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 min-w-[320px]">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">เลือกช่วงเวลา (เลือกหลายวันได้)</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">วันเริ่ม</label>
              <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">วันสิ้นสุด</label>
              <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">ยกเลิก</button>
            <button onClick={applyCustom} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600">นำไปใช้</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function defaultRange(): DateRange {
  return presets().today
}
