'use client'

import { useApp } from '@/lib/store'
import { KpiCard, Card, PageHeader } from '@/components/ui'
import { formatMoney, timeAgo } from '@/lib/utils'
import { HISTORY_EVENT_LABEL, HISTORY_EVENT_COLOR, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const { state } = useApp()
  const { customers, orders, callLogs, history, products } = state

  const todayQueue = customers.filter(c => c.nextCallAt && new Date(c.nextCallAt) <= new Date()).length
  const pendingPack = orders.filter(o => o.status === 'pending_pack').length
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount - o.discount), 0)
  const closedToday = callLogs.filter(c => c.result === 'closed' && new Date(c.createdAt).toDateString() === new Date().toDateString()).length
  const vip = customers.filter(c => c.tier === 'vip').length
  const warm = customers.filter(c => c.tier === 'warm').length
  const cold = customers.filter(c => c.tier === 'cold').length

  return (
    <div>
      <PageHeader
        title="ภาพรวมระบบ"
        subtitle={new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="p-5 space-y-5">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/queue">
            <KpiCard label="คิวโทรวันนี้" value={todayQueue} sub="รายการรอโทร" emoji="📞" gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
          </Link>
          <Link href="/packing">
            <KpiCard label="รอแพ็ก" value={pendingPack} sub="ออเดอร์ที่รอ" emoji="📦" gradient="bg-gradient-to-br from-orange-400 to-amber-500" />
          </Link>
          <KpiCard label="ปิดได้วันนี้" value={closedToday} sub="ออเดอร์ใหม่" emoji="✅" gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
          <KpiCard label="รายได้รวม" value={`฿${formatMoney(totalRevenue)}`} sub="ออเดอร์สำเร็จ" emoji="💰" gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tier breakdown */}
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">ระดับลูกค้า</p>
            <div className="space-y-3 mb-5">
              {[
                { label: '⭐ VIP', count: vip, bar: 'bg-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' },
                { label: '🔥 WARM', count: warm, bar: 'bg-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
                { label: '❄️ COLD', count: cold, bar: 'bg-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
              ].map(t => (
                <div key={t.label} className={cn('flex items-center gap-3 p-3 rounded-xl', t.bg)}>
                  <span className={cn('text-xs font-black w-14 shrink-0', t.text)}>{t.label}</span>
                  <div className="flex-1 h-1.5 bg-white/60 dark:bg-black/20 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', t.bar)} style={{ width: `${customers.length ? (t.count / customers.length) * 100 : 0}%` }} />
                  </div>
                  <span className={cn('text-xs font-bold w-10 text-right shrink-0', t.text)}>{t.count}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: customers.length, l: 'ลูกค้า' },
                { v: orders.length, l: 'ออเดอร์' },
                { v: products.filter(p => p.status === 'active').length, l: 'สินค้า' },
              ].map(s => (
                <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">{s.v}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent orders */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">ออเดอร์ล่าสุด</p>
              <Link href="/orders" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-2">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{o.customerName}</p>
                    <p className="text-xs text-slate-400">฿{formatMoney(o.totalAmount - o.discount)}</p>
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2', ORDER_STATUS_COLOR[o.status])}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีออเดอร์</p>}
            </div>
          </Card>

          {/* Quick links */}
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">ทางลัด</p>
            <div className="space-y-2">
              {[
                { href: '/queue', emoji: '📞', label: 'คิวโทรวันนี้', count: `${todayQueue} ราย`, hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800' },
                { href: '/packing', emoji: '📦', label: 'รอแพ็กสินค้า', count: `${pendingPack} ออเดอร์`, hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800' },
                { href: '/customers', emoji: '👥', label: 'ฐานลูกค้า', count: `${customers.length} ราย`, hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800' },
                { href: '/history', emoji: '🕒', label: 'ประวัติ', count: `${history.length} รายการ`, hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-800' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all', l.hoverBg)}>
                  <span className="text-xl">{l.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{l.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{l.count}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">กิจกรรมล่าสุด</p>
            <Link href="/history" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {history.slice(0, 6).map(h => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 whitespace-nowrap', HISTORY_EVENT_COLOR[h.eventType])}>
                  {HISTORY_EVENT_LABEL[h.eventType]}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0 truncate">{h.description}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{timeAgo(h.createdAt)}</p>
              </div>
            ))}
            {history.length === 0 && <p className="text-sm text-slate-400 text-center py-8">ยังไม่มีกิจกรรม</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
