'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, EmptyState, PageHeader } from '@/components/ui'
import { HISTORY_EVENT_LABEL, HISTORY_EVENT_COLOR, HistoryEventType } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const EVENT_TYPES: { key: HistoryEventType | 'all'; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'customer_added', label: 'เพิ่มลูกค้า' },
  { key: 'call_made', label: 'โทร' },
  { key: 'order_created', label: 'ออเดอร์ใหม่' },
  { key: 'order_shipped', label: 'จัดส่ง' },
  { key: 'order_delivered', label: 'ส่งสำเร็จ' },
  { key: 'order_returned', label: 'คืนสินค้า' },
]

export default function HistoryPage() {
  const { state } = useApp()
  const [filter, setFilter] = useState<HistoryEventType | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = state.history
    .filter(h => filter === 'all' || h.eventType === filter)
    .filter(h => !search || h.description.includes(search) || h.userName.includes(search))

  return (
    <div>
      <PageHeader
        title="ประวัติการทำงาน"
        subtitle={`${filtered.length} รายการ`}
        action={
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..."
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-700" />
        }
      />

      <div className="p-6 space-y-5">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {EVENT_TYPES.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key as never)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                filter === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? <EmptyState message="ไม่พบประวัติ" /> : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map(h => (
              <div key={h.id} className="flex items-start gap-4 px-5 py-4">
                <Badge label={HISTORY_EVENT_LABEL[h.eventType]} className={`${HISTORY_EVENT_COLOR[h.eventType]} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">{h.description}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{h.userName} · {formatDateTime(h.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
