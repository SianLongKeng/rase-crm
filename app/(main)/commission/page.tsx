'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, EmptyState, PageHeader } from '@/components/ui'
import { computeCommission } from '@/types'
import { formatDate, formatMoney, cn } from '@/lib/utils'
import { DateRangePicker, defaultRange, rangeToMillis } from '@/components/DateRangePicker'

export default function CommissionPage() {
  const { state } = useApp()
  const user = state.currentUser
  const isTele = user?.role === 'telesale'

  const [range, setRange] = useState(defaultRange())
  const [tab, setTab] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')

  const { startMs: dayStart, endMs: dayEnd } = rangeToMillis(range)

  // Orders within day (createdAt for pending; deliveredAt/returnedAt for paid/cancelled)
  function ordersForDay(filter: 'closed' | 'delivered' | 'returned') {
    return state.orders.filter(o => {
      if (filter === 'closed') {
        const t = new Date(o.createdAt).getTime()
        return t >= dayStart && t <= dayEnd
      }
      if (filter === 'delivered') {
        if (o.status !== 'delivered') return false
        const t = new Date(o.deliveredAt ?? o.updatedAt).getTime()
        return t >= dayStart && t <= dayEnd
      }
      if (filter === 'returned') {
        if (o.status !== 'returned') return false
        const t = new Date(o.returnedAt ?? o.updatedAt).getTime()
        return t >= dayStart && t <= dayEnd
      }
      return false
    })
  }

  function calcCommission(o: ReturnType<typeof Array.prototype.find>): number {
    if (!o) return 0
    let comm = 0
    for (const item of o.items) {
      const product = state.products.find(p => p.id === item.productId)
      if (product?.commission) comm += computeCommission(product) * item.quantity
    }
    if (comm > 0) return Math.round(comm)
    // fallback to commissionAmount or rate
    if (o.commissionAmount) return o.commissionAmount
    const telesale = state.users.find(u => u.id === o.telesaleId)
    const rate = telesale?.commissionRate ?? 5
    return Math.round(((o.totalAmount - o.discount) * rate) / 100)
  }

  // All closed orders (any non-cancelled status) for the day
  // Telesale sees only their own orders
  const closedOrders = state.orders.filter(o => {
    if (o.status === 'cancelled') return false
    if (isTele && o.telesaleId !== user?.id) return false
    const t = new Date(o.createdAt).getTime()
    return t >= dayStart && t <= dayEnd
  })
  const deliveredOrders = closedOrders.filter(o => o.status === 'delivered')
  const returnedOrders = closedOrders.filter(o => o.status === 'returned')
  const pendingOrders = closedOrders.filter(o => o.status !== 'delivered' && o.status !== 'returned')

  // Aggregate
  const commPending = pendingOrders.reduce((s, o) => s + calcCommission(o), 0)
  const commPaid = deliveredOrders.reduce((s, o) => s + calcCommission(o), 0)
  const commCancelled = returnedOrders.reduce((s, o) => s + calcCommission(o), 0)
  const commTotal = commPending + commPaid + commCancelled

  // Stats
  const callsToday = state.callLogs.filter(c => {
    if (isTele && c.telesaleId !== user?.id) return false
    const t = new Date(c.createdAt).getTime()
    return t >= dayStart && t <= dayEnd
  })
  const totalCalls = callsToday.length
  const totalOrders = closedOrders.length
  const closeRate = totalCalls > 0 ? (totalOrders / totalCalls) * 100 : 0
  const shipped = deliveredOrders.length + returnedOrders.length
  const acceptRate = shipped > 0 ? (deliveredOrders.length / shipped) * 100 : 0
  const netProfit = deliveredOrders.reduce((s, o) => s + (o.totalAmount - o.discount - o.totalCost), 0)

  // Per-telesale leaderboard
  const telesales = state.users.filter(u => u.role === 'telesale')
  const rows = telesales.map(t => {
    const myCalls = callsToday.filter(c => c.telesaleId === t.id)
    const myClosedCalls = myCalls.filter(c => c.result === 'closed').length
    const myClosed = closedOrders.filter(o => o.telesaleId === t.id)
    const myDelivered = deliveredOrders.filter(o => o.telesaleId === t.id)
    const myReturned = returnedOrders.filter(o => o.telesaleId === t.id)
    const myPending = pendingOrders.filter(o => o.telesaleId === t.id)
    const myShipped = myDelivered.length + myReturned.length
    const mySales = myDelivered.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
    const myProfit = myDelivered.reduce((s, o) => s + (o.totalAmount - o.discount - o.totalCost), 0)
    const myCommPending = myPending.reduce((s, o) => s + calcCommission(o), 0)
    const myCommPaid = myDelivered.reduce((s, o) => s + calcCommission(o), 0)
    const myCommCancelled = myReturned.reduce((s, o) => s + calcCommission(o), 0)
    const lastCall = myCalls[0]
    return {
      user: t,
      calls: myCalls.length,
      orders: myClosed.length,
      closed: myClosedCalls,
      closeRate: myCalls.length > 0 ? (myClosedCalls / myCalls.length) * 100 : 0,
      delivered: myDelivered.length,
      returned: myReturned.length,
      acceptRate: myShipped > 0 ? (myDelivered.length / myShipped) * 100 : 0,
      sales: mySales,
      profit: myProfit,
      commPending: myCommPending,
      commPaid: myCommPaid,
      commCancelled: myCommCancelled,
      lastCallAt: lastCall ? new Date(lastCall.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-',
    }
  })
  // Sort by total comm descending
  rows.sort((a, b) => (b.commPending + b.commPaid) - (a.commPending + a.commPaid))

  const visibleRows = isTele ? rows.filter(r => r.user.id === user?.id) : rows

  // Top by sales bar
  const maxSales = Math.max(...rows.map(r => r.sales), 1)

  // Recent orders
  const recentOrders = (tab === 'all' ? closedOrders : tab === 'pending' ? pendingOrders : tab === 'paid' ? deliveredOrders : returnedOrders)
    .slice(0, 8)

  return (
    <div>
      <PageHeader
        title="ค่าคอมมิชชั่น"
        subtitle="ภาพรวมผลงานเทเลและค่าคอมมิชชั่น (อัปเดตแบบเรียลไทม์)"
        action={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="p-6 space-y-5">
        {/* 4 commission buckets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CommBox title="คอมทั้งหมด (รอรับสินค้า)" amount={commPending} count={pendingOrders.length} desc="ยังไม่รับสินค้า ค่าคอมยังไม่เข้ากระเป๋า" color="amber" icon="⏱️" />
          <CommBox title="คอมสุทธิ (จ่ายจริง) 🛡️" amount={commPaid} count={deliveredOrders.length} desc="ลูกค้ารับสินค้าแล้ว จ่ายได้" color="emerald" icon="💼" />
          <CommBox title="คอมถูกตัด (ตีกลับ)" amount={commCancelled} count={returnedOrders.length} desc="ลูกค้าตีกลับ ไม่จ่ายค่าคอม" color="red" icon="❌" />
          <CommBox title="คอมรวมทั้งหมด" amount={commTotal} count={closedOrders.length} desc="รวม 3 ประเภทด้านบน" color="indigo" icon="🗂️" />
        </div>

        {/* 8 middle stats */}
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
            <Stat icon="📞" color="blue" label="โทรทั้งหมด" value={totalCalls} sub="สาย" />
            <Stat icon="📋" color="violet" label="ออเดอร์ทั้งหมด" value={totalOrders} sub="ออเดอร์" />
            <Stat icon="🎯" color="rose" label="อัตราปิดการขาย" value={`${closeRate.toFixed(2)}%`} sub={`(${deliveredOrders.length}/${totalCalls})`} />
            <Stat icon="✅" color="emerald" label="ส่งสำเร็จ" value={deliveredOrders.length} sub="ออเดอร์" />
            <Stat icon="❌" color="red" label="ตีกลับ" value={returnedOrders.length} sub="ออเดอร์" />
            {!isTele && <Stat icon="📊" color="emerald" label="อัตรารับสินค้า" value={`${acceptRate.toFixed(2)}%`} sub={`(${deliveredOrders.length}/${shipped})`} />}
            {!isTele && <Stat icon="💰" color="emerald" label="กำไรสุทธิ" value={`฿${formatMoney(netProfit)}`} sub="หลังหักทุน" />}
            <Stat icon="⏳" color="amber" label="คอมค้างรอรับสินค้า" value={`฿${formatMoney(commPending)}`} sub={`${pendingOrders.length} ออเดอร์`} />
          </div>
        </Card>

        {/* Leaderboard + summary */}
        <div className={cn('grid grid-cols-1 gap-4', !isTele && 'lg:grid-cols-[1fr_280px]')}>
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{isTele ? 'สรุปผลงานของฉัน' : 'สรุปผลงานเทเลแต่ละคน'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-3 font-medium">อันดับ</th>
                    <th className="text-left py-3 px-3 font-medium">เทเล</th>
                    <th className="text-right py-3 px-2">โทรทั้งหมด</th>
                    <th className="text-right py-3 px-2">ออเดอร์ทั้งหมด</th>
                    <th className="text-right py-3 px-2">ปิดได้</th>
                    <th className="text-right py-3 px-2">อัตราปิด</th>
                    <th className="text-right py-3 px-2">ส่งสำเร็จ</th>
                    <th className="text-right py-3 px-2">ตีกลับ</th>
                    <th className="text-right py-3 px-2">อัตรารับ</th>
                    <th className="text-right py-3 px-2">ยอดขายสุทธิ</th>
                    {!isTele && <th className="text-right py-3 px-2">กำไรสุทธิ</th>}
                    <th className="text-right py-3 px-2 bg-amber-50 dark:bg-amber-900/10">คอมทั้งหมด<br/>(รอรับ)</th>
                    <th className="text-right py-3 px-2 bg-emerald-50 dark:bg-emerald-900/10">คอมสุทธิ<br/>(จ่ายจริง)</th>
                    <th className="text-right py-3 px-2 bg-red-50 dark:bg-red-900/10">คอมถูกตัด<br/>(ตีกลับ)</th>
                    <th className="text-right py-3 px-2">โทรล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r, i) => (
                    <tr key={r.user.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-3">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold">{r.user.name}</p>
                        <p className="text-[10px] text-slate-400">{r.user.email}</p>
                      </td>
                      <td className="py-3 px-2 text-right">{r.calls}</td>
                      <td className="py-3 px-2 text-right">{r.orders}</td>
                      <td className="py-3 px-2 text-right">{r.closed}</td>
                      <td className="py-3 px-2 text-right">{r.closeRate.toFixed(2)}%</td>
                      <td className="py-3 px-2 text-right text-emerald-600">{r.delivered}</td>
                      <td className="py-3 px-2 text-right text-red-500">{r.returned}</td>
                      <td className="py-3 px-2 text-right">{r.acceptRate.toFixed(2)}%</td>
                      <td className="py-3 px-2 text-right">฿{formatMoney(r.sales)}</td>
                      {!isTele && <td className="py-3 px-2 text-right text-emerald-600 font-semibold">฿{formatMoney(r.profit)}</td>}
                      <td className="py-3 px-2 text-right font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-900/5">฿{formatMoney(r.commPending)}</td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/5">฿{formatMoney(r.commPaid)}</td>
                      <td className="py-3 px-2 text-right font-bold text-red-500 bg-red-50/50 dark:bg-red-900/5">฿{formatMoney(r.commCancelled)}</td>
                      <td className="py-3 px-2 text-right text-slate-500">{r.lastCallAt}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 dark:bg-slate-800/50 font-bold">
                    <td colSpan={2} className="py-3 px-3 text-emerald-700">รวมทั้งหมด</td>
                    <td className="py-3 px-2 text-right">{visibleRows.reduce((s, r) => s + r.calls, 0)}</td>
                    <td className="py-3 px-2 text-right">{visibleRows.reduce((s, r) => s + r.orders, 0)}</td>
                    <td className="py-3 px-2 text-right">{visibleRows.reduce((s, r) => s + r.closed, 0)}</td>
                    <td className="py-3 px-2 text-right">{closeRate.toFixed(2)}%</td>
                    <td className="py-3 px-2 text-right">{visibleRows.reduce((s, r) => s + r.delivered, 0)}</td>
                    <td className="py-3 px-2 text-right">{visibleRows.reduce((s, r) => s + r.returned, 0)}</td>
                    <td className="py-3 px-2 text-right">{acceptRate.toFixed(2)}%</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(visibleRows.reduce((s, r) => s + r.sales, 0))}</td>
                    {!isTele && <td className="py-3 px-2 text-right">฿{formatMoney(visibleRows.reduce((s, r) => s + r.profit, 0))}</td>}
                    <td className="py-3 px-2 text-right">฿{formatMoney(visibleRows.reduce((s, r) => s + r.commPending, 0))}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(visibleRows.reduce((s, r) => s + r.commPaid, 0))}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(visibleRows.reduce((s, r) => s + r.commCancelled, 0))}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Summary stack — Owner/Admin only */}
          {!isTele && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">สรุปค่าคอมวันนี้ (ทั้งทีม)</p>
            {[
              { label: 'คอมสุทธิ (จ่ายจริง)', value: commPaid, count: deliveredOrders.length, color: 'emerald' },
              { label: 'คอมทั้งหมด (รอรับสินค้า)', value: commPending, count: pendingOrders.length, color: 'amber' },
              { label: 'คอมถูกตัด (ตีกลับ)', value: commCancelled, count: returnedOrders.length, color: 'red' },
              { label: 'คอมรวมทั้งหมด', value: commTotal, count: closedOrders.length, color: 'indigo' },
            ].map(s => (
              <Card key={s.label} className={cn('p-3 border-l-4',
                s.color === 'emerald' && 'border-emerald-400',
                s.color === 'amber' && 'border-amber-400',
                s.color === 'red' && 'border-red-400',
                s.color === 'indigo' && 'border-indigo-400',
              )}>
                <p className="text-[10px] text-slate-500">{s.label}</p>
                <p className={cn('text-xl font-black',
                  s.color === 'emerald' && 'text-emerald-600',
                  s.color === 'amber' && 'text-amber-600',
                  s.color === 'red' && 'text-red-600',
                  s.color === 'indigo' && 'text-indigo-600',
                )}>฿{formatMoney(s.value)}</p>
                <p className="text-[10px] text-slate-400">{s.count} ออเดอร์</p>
              </Card>
            ))}
          </div>
          )}
        </div>

        {/* Top sales bars + Recent orders */}
        <div className={cn('grid grid-cols-1 gap-4', !isTele && 'lg:grid-cols-2')}>
          {!isTele && (
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">อันดับยอดขายสำเร็จ (ตามยอดขายสุทธิ)</p>
            <div className="space-y-3">
              {rows.slice(0, 4).map((r, i) => (
                <div key={r.user.id} className="flex items-center gap-3">
                  <span className="text-xs w-4 text-slate-500">{i + 1}</span>
                  <span className="text-xs font-semibold w-24 truncate">{r.user.name}</span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden">
                    <div className={cn('h-full',
                      i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-violet-500' : 'bg-amber-500')}
                      style={{ width: `${(r.sales / maxSales) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-20 text-right">฿{formatMoney(r.sales)}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs text-emerald-600 font-semibold">ดูอันดับทั้งหมด</button>
          </Card>
          )}

          <Card>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">รายการออเดอร์ล่าสุด</p>
                <div className="flex gap-1 text-xs">
                  {(['all', 'pending', 'paid', 'cancelled'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={cn('px-2 py-1 rounded font-semibold',
                        tab === t ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                      {t === 'all' ? `ทั้งหมด (${closedOrders.length})` :
                       t === 'pending' ? `รอรับสินค้า (${pendingOrders.length})` :
                       t === 'paid' ? `ส่งสำเร็จ (${deliveredOrders.length})` :
                       `ตีกลับ (${returnedOrders.length})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {recentOrders.length === 0 ? <EmptyState message="ไม่มีออเดอร์" /> : (
              <table className="w-full text-xs">
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-500 w-28">{o.id}</td>
                      <td className="py-2 px-2">
                        <p className="font-semibold">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400">{o.items[0]?.productName} x{o.items[0]?.quantity}</p>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <p className="font-semibold">฿{formatMoney(o.totalAmount - o.discount)}</p>
                        <p className="text-[10px] text-slate-400">{o.telesaleName}</p>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <p className="text-[10px]">{formatDate(o.deliveredAt ?? o.createdAt)}</p>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={cn('text-[10px] font-bold',
                          o.status === 'delivered' ? 'text-emerald-600' :
                          o.status === 'returned' ? 'text-red-500' : 'text-amber-600')}>
                          ฿{formatMoney(calcCommission(o))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Footnote */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border-amber-200 dark:border-amber-800/50 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">💡 หมายเหตุ</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>คอมทั้งหมด = ค่าคอมจากออเดอร์ที่ปิดได้ (ยังไม่รับสินค้า)</li>
            <li>คอมสุทธิ = ค่าคอมจากออเดอร์ที่ลูกค้ารับสินค้าแล้วเท่านั้น</li>
            <li>คอมถูกตัด = ค่าคอมจากออเดอร์ที่ลูกค้าตีกลับ (ไม่จ่ายค่าคอม)</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

function CommBox({ title, amount, count, desc, color, icon }: { title: string; amount: number; count: number; desc: string; color: 'amber' | 'emerald' | 'red' | 'indigo'; icon: string }) {
  const bg = {
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  }[color]
  const text = {
    amber: 'text-amber-700 dark:text-amber-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    red: 'text-red-700 dark:text-red-300',
    indigo: 'text-indigo-700 dark:text-indigo-300',
  }[color]
  return (
    <div className={cn('rounded-2xl p-4 border-2', bg)}>
      <div className="flex items-start justify-between mb-2">
        <p className={cn('text-xs font-bold', text)}>{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={cn('text-3xl font-black', text)}>฿{formatMoney(amount)}</p>
      <p className={cn('text-xs font-semibold mt-1', text)}>{count} ออเดอร์</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 bg-white/50 dark:bg-black/20 rounded px-2 py-1">{desc}</p>
    </div>
  )
}

function Stat({ icon, color, label, value, sub }: { icon: string; color: string; label: string; value: string | number; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-base',
        color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
        color === 'violet' && 'bg-violet-100 dark:bg-violet-900/30',
        color === 'rose' && 'bg-rose-100 dark:bg-rose-900/30',
        color === 'emerald' && 'bg-emerald-100 dark:bg-emerald-900/30',
        color === 'red' && 'bg-red-100 dark:bg-red-900/30',
        color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30',
      )}>{icon}</span>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={cn('text-sm font-black',
        color === 'blue' && 'text-blue-600',
        color === 'violet' && 'text-violet-600',
        color === 'rose' && 'text-rose-600',
        color === 'emerald' && 'text-emerald-600',
        color === 'red' && 'text-red-600',
        color === 'amber' && 'text-amber-600',
      )}>{value}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  )
}
