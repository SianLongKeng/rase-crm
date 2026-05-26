'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, OrderStatus } from '@/types'
import { cn, formatDate, formatMoney } from '@/lib/utils'

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending_pack', label: 'รอแพ็ก' },
  { key: 'packing', label: 'กำลังแพ็ก' },
  { key: 'shipped', label: 'จัดส่งแล้ว' },
  { key: 'delivered', label: 'สำเร็จ' },
  { key: 'returned', label: 'คืนสินค้า' },
]

export default function OrdersPage() {
  const { state } = useApp()
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = state.orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => !search || o.customerName.includes(search) || o.customerPhone.includes(search) || (o.trackingNumber ?? '').includes(search))

  const totalRevenue = filtered.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount - o.discount), 0)

  return (
    <div>
      <PageHeader
        title="ออเดอร์ทั้งหมด"
        subtitle={`${filtered.length} รายการ${tab === 'delivered' ? ` · ยอดรวม ฿${formatMoney(totalRevenue)}` : ''}`}
        action={
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..."
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-700" />
        }
      />

      <div className="p-6 space-y-5">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                tab === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              {t.label}
              <span className="ml-1 text-xs opacity-70">({state.orders.filter(o => t.key === 'all' || o.status === t.key).length})</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? <EmptyState message="ไม่พบออเดอร์" /> : (
          <div className="space-y-3">
            {filtered.map(o => (
              <Card key={o.id} className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{o.customerName}</p>
                      <Badge label={ORDER_STATUS_LABEL[o.status]} className={ORDER_STATUS_COLOR[o.status]} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{o.customerPhone} · เทเล: {o.telesaleName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">฿{formatMoney(o.totalAmount - o.discount)}</p>
                    {o.discount > 0 && <p className="text-xs text-slate-400 dark:text-slate-500">ส่วนลด ฿{formatMoney(o.discount)}</p>}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {o.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>฿{formatMoney(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{formatDate(o.createdAt)}</span>
                  {o.trackingNumber && <span className="font-medium text-slate-600 dark:text-slate-300">Tracking: {o.trackingNumber}</span>}
                  {o.packingName && <span>แพ็กโดย: {o.packingName}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
